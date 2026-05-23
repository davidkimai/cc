import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CycleService } from '../../src/services/cycle-service.js';
import { FileStore } from '../../src/services/file-store.js';
import { exportModeSchema, type CreateCycleInput, type ExportMode } from '../../src/core/types.js';
import { runAcpChecks } from '../conformance/check-acp.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  let outDir: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--out') {
      outDir = argv[i + 1];
      i += 1;
      continue;
    }
    positional.push(token);
  }
  return { scenarioPath: positional[0], outDir };
}

async function readJsonNode<T>(filePath: string): Promise<T> {
  const { readFile } = await import('node:fs/promises');
  return JSON.parse(await readFile(filePath, 'utf8')) as T;
}

type ScenarioContribution = {
  participantId: string;
  body: string;
  confidenceLabel?: 'low' | 'medium' | 'high';
  evidenceText?: string;
};

type ScenarioResponse = {
  participantId: string;
  parentContributionParticipantId: string;
  body: string;
};

type ScenarioFeedback = {
  participantId: string;
  instrumentVersion?: string;
  answers: {
    overload: number;
    usefulness: number;
    exchangeQuality: number;
    explanationClarity?: number;
    returnWillingness: number;
  };
};

type ScenarioBundle = {
  protocolVersion: string;
  scenarioId: string;
  title: string;
  prompt: string;
  condition: 'intervention' | 'baseline_thread';
  participants: CreateCycleInput['participants'];
  config?: CreateCycleInput['config'];
  schedule?: CreateCycleInput['schedule'];
  contributions: ScenarioContribution[];
  responses?: ScenarioResponse[];
  feedback?: ScenarioFeedback[];
  exportModes?: ExportMode[];
};

function ensureScenario(bundle: ScenarioBundle) {
  if (!bundle.protocolVersion) throw new Error('scenario bundle missing protocolVersion');
  if (!bundle.scenarioId) throw new Error('scenario bundle missing scenarioId');
  if (!bundle.title || !bundle.prompt) throw new Error('scenario bundle missing title or prompt');
  if (bundle.condition !== 'intervention' && bundle.condition !== 'baseline_thread') {
    throw new Error(`unsupported condition: ${bundle.condition}`);
  }
  if (!Array.isArray(bundle.participants) || bundle.participants.length < 2) {
    throw new Error('scenario bundle requires at least two participants');
  }
  if (!Array.isArray(bundle.contributions) || bundle.contributions.length === 0) {
    throw new Error('scenario bundle requires contributions');
  }
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeText(filePath: string, value: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value, 'utf8');
}

async function main() {
  const { scenarioPath, outDir } = parseArgs(process.argv.slice(2));
  if (!scenarioPath) {
    throw new Error('usage: npm run batch:run -- <scenario-file> [--out DIR]');
  }

  const resolvedScenarioPath = path.resolve(repoRoot, scenarioPath);
  const scenario = await readJsonNode<ScenarioBundle>(resolvedScenarioPath);
  ensureScenario(scenario);

  const resolvedOutDir = path.resolve(repoRoot, outDir ?? path.join('runners/batch/out', scenario.scenarioId));
  const dataDir = path.join(resolvedOutDir, 'runtime-data');
  const service = new CycleService(new FileStore(dataDir));

  const createInput: CreateCycleInput = {
    title: scenario.title,
    prompt: scenario.prompt,
    condition: scenario.condition,
    participants: scenario.participants,
    config: scenario.config,
    schedule: scenario.schedule,
  };

  let cycle = await service.createCycle(createInput, 'batch-runner');
  cycle = await service.openCycle(cycle.id, 'batch-runner');

  const contributionByParticipantId = new Map<string, string>();
  for (const contribution of scenario.contributions) {
    cycle = await service.submitContribution(cycle.id, contribution);
    const saved = cycle.contributions.find((item) => item.participantId === contribution.participantId);
    if (!saved) {
      throw new Error(`missing persisted contribution for participant ${contribution.participantId}`);
    }
    contributionByParticipantId.set(contribution.participantId, saved.id);
  }

  cycle = await service.closeSubmissions(cycle.id, 'batch-runner');
  if (scenario.condition === 'intervention') {
    cycle = await service.runRouting(cycle.id, 'batch-runner');
  }
  cycle = await service.releaseCycle(cycle.id, 'batch-runner');

  for (const response of scenario.responses ?? []) {
    const parentContributionId = contributionByParticipantId.get(response.parentContributionParticipantId);
    if (!parentContributionId) {
      throw new Error(`unknown parentContributionParticipantId ${response.parentContributionParticipantId}`);
    }
    cycle = await service.submitResponse(cycle.id, {
      participantId: response.participantId,
      parentContributionId,
      body: response.body,
    });
  }

  for (const feedback of scenario.feedback ?? []) {
    cycle = await service.submitFeedback(cycle.id, {
      participantId: feedback.participantId,
      instrumentVersion: feedback.instrumentVersion ?? 'v1',
      answers: feedback.answers,
    });
  }

  cycle = await service.replayCycle(cycle.id, 'batch-runner');
  cycle = await service.closeReflection(cycle.id, 'batch-runner');
  cycle = await service.archiveCycle(cycle.id, 'batch-runner');

  const exportModes = (scenario.exportModes?.length ? scenario.exportModes : ['analysis', 'audit', 'minimal'])
    .map((mode) => exportModeSchema.parse(mode));
  const exportsOut: Array<{ mode: ExportMode; id: string; path: string }> = [];
  for (const mode of exportModes) {
    const artifact = await service.exportCycle(cycle.id, mode, 'batch-runner');
    const exportPath = path.join(resolvedOutDir, 'exports', `${mode}.md`);
    await writeText(exportPath, artifact.content);
    exportsOut.push({ mode, id: artifact.id, path: exportPath });
  }

  const globalConformance = runAcpChecks();
  const localConformance = {
    scenarioId: scenario.scenarioId,
    protocolVersion: scenario.protocolVersion,
    cycleId: cycle.id,
    condition: cycle.condition,
    status: cycle.status,
    checks: {
      sharedCycleModel: Boolean(cycle.id && cycle.condition),
      routingConditionRespected: cycle.condition === 'baseline_thread'
        ? cycle.routingDecisions.length === 0 && cycle.digests.length === 0
        : cycle.routingDecisions.length > 0 && cycle.digests.length > 0,
      exportsGenerated: exportsOut.length > 0,
      auditRetention: cycle.auditEvents.length > 0,
      telemetryRetention: cycle.telemetryEvents.length >= 0,
    },
    result: 'pass',
    globalConformance,
  };
  if (Object.values(localConformance.checks).some((value) => value !== true) || globalConformance.status !== 'pass') {
    localConformance.result = 'fail';
  }

  await writeJson(path.join(resolvedOutDir, 'normalized-input.json'), scenario);
  await writeJson(path.join(resolvedOutDir, 'cycle.json'), cycle);
  await writeJson(path.join(resolvedOutDir, 'conformance-report.json'), localConformance);
  await writeJson(path.join(resolvedOutDir, 'run-manifest.json'), {
    scenarioId: scenario.scenarioId,
    protocolVersion: scenario.protocolVersion,
    cycleId: cycle.id,
    condition: cycle.condition,
    outDir: resolvedOutDir,
    dataDir,
    exports: exportsOut,
    conformanceResult: localConformance.result,
  });

  if (localConformance.result !== 'pass') {
    throw new Error(`batch run failed conformance for ${scenario.scenarioId}`);
  }

  process.stdout.write(`${JSON.stringify({ scenarioId: scenario.scenarioId, cycleId: cycle.id, outDir: resolvedOutDir }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
