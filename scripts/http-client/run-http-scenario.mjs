import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runAcpChecks } from '../conformance/check-acp.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const positional = [];
  let outDir;
  let baseUrl = 'http://127.0.0.1:4317';
  let actorId = 'external-http-runner';

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--out') {
      outDir = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === '--base-url') {
      baseUrl = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === '--actor-id') {
      actorId = argv[i + 1];
      i += 1;
      continue;
    }
    positional.push(token);
  }

  return { scenarioPath: positional[0], outDir, baseUrl, actorId };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeText(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value, 'utf8');
}

function ensureScenario(bundle) {
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

async function api(baseUrl, pathName, options = {}) {
  const { headers: customHeaders = {}, ...rest } = options;
  const headers = {
    ...(rest.body !== undefined ? { 'content-type': 'application/json' } : {}),
    ...customHeaders,
  };
  const response = await fetch(new URL(pathName, baseUrl), {
    ...rest,
    headers,
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = payload?.error || payload?.message || text || response.statusText;
    throw new Error(`${pathName} ${message}`);
  }
  return payload;
}

async function main() {
  const { scenarioPath, outDir, baseUrl, actorId } = parseArgs(process.argv.slice(2));
  if (!scenarioPath) {
    throw new Error('usage: npm run http:run -- <scenario-file> --base-url <url> [--out DIR]');
  }

  const resolvedScenarioPath = path.resolve(repoRoot, scenarioPath);
  const scenario = await readJson(resolvedScenarioPath);
  ensureScenario(scenario);

  const resolvedOutDir = path.resolve(repoRoot, outDir ?? path.join('runners/http-client/out', scenario.scenarioId));
  const headers = { 'x-acp-actor-id': actorId };

  let payload = await api(baseUrl, '/v1/cycles', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: scenario.title,
      prompt: scenario.prompt,
      condition: scenario.condition,
      participants: scenario.participants,
      config: scenario.config,
      schedule: scenario.schedule,
    }),
  });
  let cycle = payload.cycle;

  payload = await api(baseUrl, `/v1/cycles/${cycle.id}/open`, { method: 'POST', headers });
  cycle = payload.cycle;

  const contributionByParticipantId = new Map();
  for (const contribution of scenario.contributions) {
    payload = await api(baseUrl, `/v1/cycles/${cycle.id}/participants/${contribution.participantId}/contribution`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        body: contribution.body,
        confidenceLabel: contribution.confidenceLabel,
        evidenceText: contribution.evidenceText,
      }),
    });
    cycle = payload.cycle;
    const saved = cycle.contributions.find((item) => item.participantId === contribution.participantId);
    if (!saved) {
      throw new Error(`missing persisted contribution for participant ${contribution.participantId}`);
    }
    contributionByParticipantId.set(contribution.participantId, saved.id);
  }

  payload = await api(baseUrl, `/v1/cycles/${cycle.id}/close-submissions`, { method: 'POST', headers });
  cycle = payload.cycle;

  if (scenario.condition === 'intervention') {
    payload = await api(baseUrl, `/v1/cycles/${cycle.id}/routing`, { method: 'POST', headers });
    cycle = payload.cycle;
  }

  payload = await api(baseUrl, `/v1/cycles/${cycle.id}/release`, { method: 'POST', headers });
  cycle = payload.cycle;

  const participantViews = [];
  for (const participant of scenario.participants.filter((item) => item.role === 'participant')) {
    const viewPayload = await api(baseUrl, `/v1/cycles/${cycle.id}/participants/${participant.id}/view`, { headers });
    participantViews.push({ participantId: participant.id, view: viewPayload.view });
  }

  for (const response of scenario.responses ?? []) {
    const parentContributionId = contributionByParticipantId.get(response.parentContributionParticipantId);
    if (!parentContributionId) {
      throw new Error(`unknown parentContributionParticipantId ${response.parentContributionParticipantId}`);
    }
    payload = await api(baseUrl, `/v1/cycles/${cycle.id}/participants/${response.participantId}/responses`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parentContributionId,
        body: response.body,
      }),
    });
    cycle = payload.cycle;
  }

  for (const feedback of scenario.feedback ?? []) {
    payload = await api(baseUrl, `/v1/cycles/${cycle.id}/participants/${feedback.participantId}/feedback`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        instrumentVersion: feedback.instrumentVersion ?? 'v1',
        answers: feedback.answers,
      }),
    });
    cycle = payload.cycle;
  }

  payload = await api(baseUrl, `/v1/cycles/${cycle.id}/replay`, { method: 'POST', headers });
  cycle = payload.cycle;
  payload = await api(baseUrl, `/v1/cycles/${cycle.id}/close-reflection`, { method: 'POST', headers });
  cycle = payload.cycle;
  payload = await api(baseUrl, `/v1/cycles/${cycle.id}/archive`, { method: 'POST', headers });
  cycle = payload.cycle;

  const exportModes = scenario.exportModes?.length ? scenario.exportModes : ['analysis', 'audit', 'minimal'];
  const exportsOut = [];
  for (const mode of exportModes) {
    const exportPayload = await api(baseUrl, `/v1/cycles/${cycle.id}/exports`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mode }),
    });
    const artifact = exportPayload.export;
    const exportPath = path.join(resolvedOutDir, 'exports', `${mode}.md`);
    await writeText(exportPath, artifact.content);
    exportsOut.push({ mode, id: artifact.id, path: exportPath });
  }

  const finalCyclePayload = await api(baseUrl, `/v1/cycles/${cycle.id}`, { headers });
  cycle = finalCyclePayload.cycle;

  const globalConformance = runAcpChecks();
  const localConformance = {
    scenarioId: scenario.scenarioId,
    protocolVersion: scenario.protocolVersion,
    cycleId: cycle.id,
    condition: cycle.condition,
    status: cycle.status,
    surface: 'http-api-runner',
    checks: {
      sharedCycleModel: Boolean(cycle.id && cycle.condition),
      routingConditionRespected:
        cycle.condition === 'baseline_thread'
          ? cycle.routingDecisions.length === 0 && cycle.digests.length === 0
          : cycle.routingDecisions.length > 0 && cycle.digests.length > 0,
      exportsGenerated: exportsOut.length > 0,
      auditRetention: cycle.auditEvents.length > 0,
      telemetryRetention: Array.isArray(cycle.telemetryEvents),
      participantViewsCaptured: participantViews.length > 0,
    },
    result: 'pass',
    globalConformance,
  };

  if (Object.values(localConformance.checks).some((value) => value !== true) || globalConformance.status !== 'pass') {
    localConformance.result = 'fail';
  }

  await writeJson(path.join(resolvedOutDir, 'normalized-input.json'), scenario);
  await writeJson(path.join(resolvedOutDir, 'cycle.json'), cycle);
  await writeJson(path.join(resolvedOutDir, 'participant-views.json'), participantViews);
  await writeJson(path.join(resolvedOutDir, 'conformance-report.json'), localConformance);
  await writeJson(path.join(resolvedOutDir, 'run-manifest.json'), {
    scenarioId: scenario.scenarioId,
    protocolVersion: scenario.protocolVersion,
    cycleId: cycle.id,
    condition: cycle.condition,
    outDir: resolvedOutDir,
    baseUrl,
    actorId,
    exports: exportsOut,
    conformanceResult: localConformance.result,
  });

  if (localConformance.result !== 'pass') {
    throw new Error(`http run failed conformance for ${scenario.scenarioId}`);
  }

  process.stdout.write(
    `${JSON.stringify({ scenarioId: scenario.scenarioId, cycleId: cycle.id, outDir: resolvedOutDir, baseUrl }, null, 2)}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
