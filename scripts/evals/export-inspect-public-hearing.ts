#!/usr/bin/env tsx
import { execFile } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const DEFAULT_OUT = path.join(repoRoot, 'artifacts', 'tmp', 'inspect', 'exports', 'public-hearing.json');
const DEFAULT_BUNDLE = path.join(repoRoot, 'artifacts', 'tmp', 'inspect', 'public-hearing-benchmark');

interface ComparisonBundleSummary {
  scenarioClass: string;
  title: string;
  domain: string;
  description: string;
  comparison: Record<string, unknown>;
  pairSignals: Record<string, unknown>;
  criteria?: Record<string, unknown>;
  proceduralLayer?: Record<string, unknown>;
  intervention: Record<string, unknown>;
  baseline: Record<string, unknown>;
}

interface ExportRecord {
  id: string;
  input: string;
  target: string;
  metadata: Record<string, unknown>;
}

function parseArgs(argv: string[]) {
  const flags: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = 'true';
    }
  }
  return {
    outPath: path.resolve(repoRoot, flags.out ?? DEFAULT_OUT),
    bundleDir: path.resolve(repoRoot, flags.source ?? flags['bundle-out'] ?? DEFAULT_BUNDLE),
    refreshBundle: flags['refresh-bundle'] === 'true' || !flags.source,
  };
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function repoRelative(filePath: string): string {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

async function ensureBundle(bundleDir: string, refreshBundle: boolean) {
  const summaryPath = path.join(bundleDir, 'comparison-summary.json');
  if (!refreshBundle && await exists(summaryPath)) return;
  await execFileAsync('npm', [
    'run',
    '--silent',
    'benchmark:compare',
    '--',
    '--class',
    'public-hearing-triage',
    '--out',
    bundleDir,
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  });
}

function sanitizeMarkdown(markdown: string): string {
  return markdown
    .replace(/\bcondition:\s*intervention\b/gi, 'condition: workflow_alpha')
    .replace(/\bcondition:\s*baseline_thread\b/gi, 'condition: workflow_beta')
    .replace(/\bIntervention Snapshot\b/g, 'Workflow Snapshot')
    .replace(/\bBaseline Thread Snapshot\b/g, 'Workflow Snapshot')
    .replace(/\bintervention\b/gi, 'workflow_alpha')
    .replace(/\bbaseline thread\b/gi, 'workflow_beta')
    .replace(/\bbaseline_thread\b/gi, 'workflow_beta');
}

function toSurface(label: string, analysisMarkdown: string, evidence: Record<string, unknown>, cycle: Record<string, unknown>) {
  return {
    label,
    analysisReport: sanitizeMarkdown(analysisMarkdown),
    evidenceSummary: {
      participantCount: evidence.participantCount,
      contributionCount: evidence.contributionCount,
      responseCount: evidence.responseCount,
      feedbackCount: evidence.feedbackCount,
      routingDecisionCount: evidence.routingDecisionCount,
      digestCount: evidence.digestCount,
      metrics: evidence.metrics,
      criteria: evidence.criteria,
      proceduralLayer: evidence.proceduralLayer,
      averageFeedback: evidence.averageFeedback,
      conformanceResult: evidence.conformanceResult,
    },
    cycleHighlights: {
      title: cycle.title,
      prompt: cycle.prompt,
      participantNames: Array.isArray(cycle.participants) ? cycle.participants.map((item: Record<string, unknown>) => item.name) : [],
      contributions: Array.isArray(cycle.contributions)
        ? cycle.contributions.map((item: Record<string, unknown>) => item.body)
        : [],
      responses: Array.isArray(cycle.responses)
        ? cycle.responses.map((item: Record<string, unknown>) => item.body)
        : [],
    },
  };
}

function renderPrompt(pairId: string, summary: ComparisonBundleSummary, surfaceA: Record<string, unknown>, surfaceB: Record<string, unknown>): string {
  return [
    'You are performing blinded comparative adjudication for ACP\'s flagship public-hearing benchmark inside the Inspect AI mirror.',
    'You are given two workflow surfaces, A and B, drawn from the same civic task class under bounded attention.',
    'Do not assume that either label is inherently better. Judge the pair on the evidence provided.',
    'Return one strict JSON object only with these fields:',
    '{',
    '  "preferredLabel": "A" | "B" | "tie",',
    '  "keepBaselineAsComparator": boolean,',
    '  "keyTradeoffs": string[],',
    '  "minorityConcernHandling": string[],',
    '  "claimBoundaryWarnings": string[],',
    '  "producedArtifacts": string[],',
    '  "rationale": string,',
    '  "confidence": number',
    '}',
    '',
    'Judge which workflow better supports:',
    '- bounded-attention triage of decision-relevant input',
    '- preservation of quieter or minority concerns',
    '- contestable and inspectable workflow evidence',
    '- claim-safe public briefing discipline',
    '',
    'Claim boundaries:',
    '- Do not claim consensus manufacture.',
    '- Do not claim real-world field efficacy.',
    '- Do not claim proven institutional scale.',
    '',
    `Pair id: ${pairId}`,
    'Canonical benchmark comparison summary (with workflow names removed from the pair labels):',
    JSON.stringify({
      scenarioClass: summary.scenarioClass,
      title: summary.title,
      domain: summary.domain,
      description: summary.description,
      comparison: summary.comparison,
      pairSignals: summary.pairSignals,
      criteria: summary.criteria,
      proceduralLayer: summary.proceduralLayer,
    }, null, 2),
    '',
    'Workflow A surface:',
    JSON.stringify(surfaceA, null, 2),
    '',
    'Workflow B surface:',
    JSON.stringify(surfaceB, null, 2),
  ].join('\n');
}

function buildRecord(pairId: string, preferredLabel: 'A' | 'B', labelMap: Record<string, string>, summary: ComparisonBundleSummary, surfaceA: Record<string, unknown>, surfaceB: Record<string, unknown>): ExportRecord {
  return {
    id: pairId,
    input: renderPrompt(pairId, summary, surfaceA, surfaceB),
    target: preferredLabel,
    metadata: {
      benchmark_class: 'public-hearing-triage',
      benchmark_task: 'flagship-pairwise-comparison',
      preferred_label: preferredLabel,
      label_map: labelMap,
      keep_baseline_as_comparator: true,
      required_tradeoff_terms: ['chronology', 'decision relevance', 'bounded attention'],
      minority_terms: ['minority', 'quieter', 'bridge', 'dissent'],
      forbidden_claims: ['consensus', 'field efficacy', 'proven institutional scale'],
      artifact_expectations: ['comparison_summary', 'claim_boundary_note'],
      comparison_summary: {
        comparison: summary.comparison,
        pairSignals: summary.pairSignals,
        criteria: summary.criteria,
        proceduralLayer: summary.proceduralLayer,
      },
    },
  };
}

async function main() {
  const { outPath, bundleDir, refreshBundle } = parseArgs(process.argv.slice(2));
  await ensureBundle(bundleDir, refreshBundle);

  const summary = await readJson<ComparisonBundleSummary>(path.join(bundleDir, 'comparison-summary.json'));
  const interventionAnalysis = await readFile(path.join(bundleDir, 'intervention', 'exports', 'analysis.md'), 'utf8');
  const baselineAnalysis = await readFile(path.join(bundleDir, 'baseline', 'exports', 'analysis.md'), 'utf8');
  const interventionEvidence = await readJson<Record<string, unknown>>(path.join(bundleDir, 'intervention', 'evidence.json'));
  const baselineEvidence = await readJson<Record<string, unknown>>(path.join(bundleDir, 'baseline', 'evidence.json'));
  const interventionCycle = await readJson<Record<string, unknown>>(path.join(bundleDir, 'intervention', 'cycle.json'));
  const baselineCycle = await readJson<Record<string, unknown>>(path.join(bundleDir, 'baseline', 'cycle.json'));

  const interventionSurface = toSurface('workflow_alpha', interventionAnalysis, interventionEvidence, interventionCycle);
  const baselineSurface = toSurface('workflow_beta', baselineAnalysis, baselineEvidence, baselineCycle);

  const records: ExportRecord[] = [
    buildRecord(
      'public-hearing-flagship-compare-ab',
      'A',
      { A: 'intervention', B: 'baseline_thread' },
      summary,
      interventionSurface,
      baselineSurface,
    ),
    buildRecord(
      'public-hearing-flagship-compare-ba',
      'B',
      { A: 'baseline_thread', B: 'intervention' },
      summary,
      baselineSurface,
      interventionSurface,
    ),
  ];

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');

  process.stdout.write(`${JSON.stringify({
    ok: true,
    outPath: repoRelative(outPath),
    recordCount: records.length,
    bundleDir: repoRelative(bundleDir),
    pairIds: records.map((record) => record.id),
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
