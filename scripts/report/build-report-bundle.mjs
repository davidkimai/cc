import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readdir, readFile, stat, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { generateArtifact } from '../visual-artifacts/generate-visual-artifact.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const execFileAsync = promisify(execFile);

const REQUIRED_OUTPUTS = [
  'index.html',
  'cycle-briefing.html',
  'pilot-recap.html',
  'compatibility-proof.html',
  'protocol-explainer.html',
  'evidence-index.json',
  'operator-review.md',
  'research-review.md',
];

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      flags[token.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  if (!flags.source && !flags.out) {
    return {
      sourceDir: path.resolve(repoRoot, 'artifacts/benchmarks/demo/public-hearing-triage'),
      outDir: path.resolve(repoRoot, 'artifacts/reports/demo'),
      defaultDemoSource: true,
    };
  }
  if (!flags.source || !flags.out) {
    throw new Error('usage: npm run report:bundle -- --source <bundle-or-run-dir> --out <dir>\n       npm run report:bundle  # builds the default local demo report');
  }
  return {
    sourceDir: path.resolve(repoRoot, flags.source),
    outDir: path.resolve(repoRoot, flags.out),
    defaultDemoSource: false,
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function readJsonMaybe(filePath) {
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error && error.code === 'ENOENT') return null;
    throw error;
  }
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error && error.code === 'ENOENT') return false;
    throw error;
  }
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeText(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value, 'utf8');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function titleCase(value) {
  return String(value || 'unknown')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

async function collectEvidenceFiles(rootDir) {
  const artifacts = [];

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const filePath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, filePath);
      if (relativePath.split(path.sep).includes('runtime-data')) continue;
      if (entry.isDirectory()) {
        await walk(filePath);
        continue;
      }
      if (!/\.(json|jsonl|md|html|txt)$/i.test(entry.name)) continue;
      const bytes = await readFile(filePath);
      artifacts.push({
        id: relativePath.replaceAll(path.sep, '/'),
        type: path.extname(entry.name).slice(1).toLowerCase(),
        sourcePath: filePath,
        sourceRelativePath: relativePath.replaceAll(path.sep, '/'),
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
    }
  }

  await walk(rootDir);
  return artifacts.sort((a, b) => a.sourceRelativePath.localeCompare(b.sourceRelativePath));
}

async function detectSource(sourceDir) {
  const comparisonSummary = await readJsonMaybe(path.join(sourceDir, 'comparison-summary.json'));
  const bundleManifest = await readJsonMaybe(path.join(sourceDir, 'bundle-manifest.json'));
  if (comparisonSummary && bundleManifest) {
    return {
      kind: 'benchmark-comparison',
      primaryRunDir: path.join(sourceDir, 'intervention'),
      comparisonSummary,
      bundleManifest,
    };
  }

  const runManifest = await readJsonMaybe(path.join(sourceDir, 'run-manifest.json'));
  const dogfoodReport = await readJsonMaybe(path.join(sourceDir, 'report.json'));
  if (runManifest) {
    return {
      kind: dogfoodReport ? 'dogfood-run' : 'live-run',
      primaryRunDir: sourceDir,
      runManifest,
      dogfoodReport,
    };
  }

  throw new Error(`source directory is not a recognized ACP bundle: ${sourceDir}`);
}

async function buildPilotInputs(source, outDir) {
  const inputsDir = path.join(outDir, '_report-inputs');
  await mkdir(inputsDir, { recursive: true });

  if (source.runManifest) {
    const report = source.dogfoodReport || {
      scenarioId: source.runManifest.scenarioId,
      cycleId: source.runManifest.cycleId,
      checks: [],
      findings: [],
      generatedArtifacts: [],
    };
    const manifestPath = path.join(inputsDir, 'pilot-manifest.json');
    const reportPath = path.join(inputsDir, 'pilot-report.json');
    await writeJson(manifestPath, source.runManifest);
    await writeJson(reportPath, report);
    return { manifestPath, reportPath };
  }

  const summary = source.comparisonSummary;
  const checks = Object.entries(summary.pairSignals || {}).map(([id, value]) => ({
    id,
    status: value ? 'pass' : 'fail',
    evidence: 'Derived from benchmark comparison-summary.json',
  }));
  const report = {
    scenarioId: summary.scenarioClass,
    cycleId: source.bundleManifest.bundleId,
    checks,
    findings: [],
    generatedArtifacts: [],
  };
  const manifest = {
    scenarioId: summary.scenarioClass,
    cycleId: source.bundleManifest.bundleId,
    condition: 'comparison',
    exports: [
      { mode: 'comparison-summary', path: path.join(source.sourceDir || '', 'comparison-summary.json') },
    ],
  };
  const manifestPath = path.join(inputsDir, 'pilot-manifest.json');
  const reportPath = path.join(inputsDir, 'pilot-report.json');
  await writeJson(manifestPath, manifest);
  await writeJson(reportPath, report);
  return { manifestPath, reportPath };
}

async function getViewInput(primaryRunDir, outDir) {
  const viewsPath = path.join(primaryRunDir, 'participant-views.json');
  if (await exists(viewsPath)) return viewsPath;

  const cycle = await readJson(path.join(primaryRunDir, 'cycle.json'));
  const derivedViews = (cycle.participants || []).map((participant) => ({
    participantId: participant.id,
    view: {
      mode: cycle.status,
      condition: cycle.condition,
      prompt: cycle.prompt,
    },
  }));
  const derivedPath = path.join(outDir, '_report-inputs', 'participant-views.json');
  await writeJson(derivedPath, derivedViews);
  return derivedPath;
}

function renderIndex({ source, evidenceIndex, hasComparison }) {
  const artifactRows = evidenceIndex.artifacts
    .slice(0, 16)
    .map((artifact) => `<tr><td>${escapeHtml(artifact.sourceRelativePath)}</td><td>${escapeHtml(artifact.type)}</td><td>${artifact.bytes}</td></tr>`)
    .join('');
  const links = REQUIRED_OUTPUTS.concat(hasComparison ? ['comparison-summary.json'] : [])
    .filter((name) => name !== 'index.html')
    .map((name) => `<li><a href="./${escapeHtml(name)}">${escapeHtml(name)}</a></li>`)
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ACP Institutional Report Bundle</title>
    <style>
      :root { color-scheme: light; --bg: #f7f4ed; --ink: #1f1d19; --muted: #665f53; --line: #d7ccba; --panel: #fffdf8; --accent: #0f5b50; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Avenir Next, Gill Sans, Trebuchet MS, sans-serif; color: var(--ink); background: var(--bg); }
      main { max-width: 1120px; margin: 0 auto; padding: 32px 20px 56px; }
      h1, h2 { font-family: Iowan Old Style, Palatino Linotype, Georgia, serif; margin: 0; }
      h1 { font-size: 3rem; line-height: 1; max-width: 13ch; }
      h2 { margin-top: 28px; font-size: 1.5rem; }
      p, li, td { color: var(--muted); line-height: 1.55; }
      .hero, .panel { border: 1px solid var(--line); background: var(--panel); border-radius: 8px; padding: 18px; }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
      .metric strong { display: block; color: var(--ink); font-size: 1.8rem; font-family: Iowan Old Style, Palatino Linotype, Georgia, serif; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; background: var(--panel); border: 1px solid var(--line); }
      th, td { padding: 10px 12px; border-bottom: 1px solid var(--line); text-align: left; }
      th { color: var(--ink); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; }
      a { color: var(--accent); font-weight: 700; }
      @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } h1 { font-size: 2.2rem; } }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <p>ACP institutional report bundle</p>
        <h1>Evidence you can inspect.</h1>
        <p>This bundle was generated from preserved ACP artifacts. It links readable review pages back to the raw files used to produce them.</p>
      </section>
      <section class="grid">
        <article class="panel metric"><p>Source type</p><strong>${escapeHtml(titleCase(source.kind))}</strong></article>
        <article class="panel metric"><p>Evidence files</p><strong>${evidenceIndex.artifacts.length}</strong></article>
        <article class="panel metric"><p>Generated pages</p><strong>${REQUIRED_OUTPUTS.length}</strong></article>
      </section>
      <h2>Bundle contents</h2>
      <div class="panel"><ul>${links}</ul></div>
      <h2>Evidence sample</h2>
      <table><thead><tr><th>Source file</th><th>Type</th><th>Bytes</th></tr></thead><tbody>${artifactRows}</tbody></table>
    </main>
  </body>
</html>`;
}

function markdownList(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

function renderOperatorReview({ source, evidenceIndex }) {
  const lifecycleArtifacts = evidenceIndex.artifacts.filter((artifact) => /audit|telemetry|manifest|cycle/.test(artifact.sourceRelativePath));
  return `# Operator Review

- Source type: ${source.kind}
- Evidence files indexed: ${evidenceIndex.artifacts.length}
- Lifecycle artifacts indexed: ${lifecycleArtifacts.length}

## Operator Checks

${markdownList([
    'Confirm cycle state and lifecycle events in cycle-briefing.html.',
    'Confirm export and evidence paths in evidence-index.json.',
    'Confirm comparison-summary.json when reviewing paired benchmark runs.',
    'Use raw audit and telemetry files for incident review before making claims from summaries.',
  ])}

## Key Evidence Files

${markdownList(lifecycleArtifacts.slice(0, 12).map((artifact) => artifact.sourceRelativePath))}
`;
}

function renderResearchReview({ source, evidenceIndex, comparisonSummary }) {
  const evidenceArtifacts = evidenceIndex.artifacts.filter((artifact) => /evidence|comparison|conformance|feedback|summary/.test(artifact.sourceRelativePath));
  const comparisonText = comparisonSummary
    ? `\n## Comparison Snapshot\n\n- Scenario class: ${comparisonSummary.scenarioClass}\n- Routing contrast: ${comparisonSummary.pairSignals?.routingContrast}\n- Digest contrast: ${comparisonSummary.pairSignals?.digestContrast}\n- Criteria evidence present: ${comparisonSummary.pairSignals?.criteriaEvidencePresent}\n- Engine V2 trace present: ${comparisonSummary.pairSignals?.engineV2TracePresent}\n- Engine V2 critics present: ${comparisonSummary.pairSignals?.engineV2CriticsPresent}\n- Procedural layer present: ${comparisonSummary.pairSignals?.proceduralLayerPresent ?? 'n/a'}\n- Procedural contest points present: ${comparisonSummary.pairSignals?.proceduralContestPointsPresent ?? 'n/a'}\n- Overload delta: ${comparisonSummary.comparison?.overloadDelta ?? 'n/a'}\n- Usefulness delta: ${comparisonSummary.comparison?.usefulnessDelta ?? 'n/a'}\n\n## Criteria Snapshot\n\n- Shared weights: ${JSON.stringify(comparisonSummary.criteria?.sharedWeights ?? {})}\n- Average routing factors: ${JSON.stringify(comparisonSummary.criteria?.averageFactors ?? {})}\n- Dominant criteria: ${JSON.stringify(comparisonSummary.criteria?.dominantCriteria ?? {})}\n\n## Engine V2 Snapshot\n\n- Provider: ${comparisonSummary.engineV2?.provider ?? 'n/a'}\n- Primary model: ${comparisonSummary.engineV2?.primaryModel ?? 'n/a'}\n- Arbitration model: ${comparisonSummary.engineV2?.arbitrationModel ?? 'n/a'}\n- Issue clusters: ${comparisonSummary.engineV2?.issueClusterCount ?? 'n/a'}\n- Issue coverage rate: ${comparisonSummary.engineV2?.issueCoverageRate ?? 'n/a'}\n- Stakeholder diversity rate: ${comparisonSummary.engineV2?.stakeholderDiversityRate ?? 'n/a'}\n- Critic severities: ${JSON.stringify(comparisonSummary.engineV2?.criticSeverities ?? {})}\n- Escalation: ${comparisonSummary.engineV2?.escalation?.recommendedAction ?? 'n/a'}\n\n## Procedural Layer Snapshot\n\n- References: ${comparisonSummary.proceduralLayer?.referenceCount ?? 'n/a'}\n- Contest points: ${comparisonSummary.proceduralLayer?.contestPointCount ?? 'n/a'}\n- Selected procedures: ${comparisonSummary.proceduralLayer?.selectedProcedureCount ?? 'n/a'}\n- Expected artifact coverage: ${comparisonSummary.proceduralLayer?.expectedArtifactCoverage ?? 'n/a'}\n- Human review required: ${comparisonSummary.proceduralLayer?.humanReviewRequired ?? 'n/a'}\n`
    : '';

  return `# Research Review

- Source type: ${source.kind}
- Evidence files indexed: ${evidenceIndex.artifacts.length}
- Analysis artifacts indexed: ${evidenceArtifacts.length}
${comparisonText}
## Review Discipline

${markdownList([
    'Treat the generated pages as reading aids, not new evidence.',
    'Use evidence-index.json to trace every claim back to preserved artifacts.',
    'Check Criteria Snapshot before making claims about why ACP routed an item.',
    'Check Engine V2 Snapshot before making claims about recursive critics, issue maps, or escalation behavior.',
    'Compare intervention and baseline only when both conditions appear in the source bundle.',
    'Record missingness separately if expected survey, response, or telemetry artifacts are absent.',
  ])}

## Key Evidence Files

${markdownList(evidenceArtifacts.slice(0, 12).map((artifact) => artifact.sourceRelativePath))}
`;
}

export async function buildReportBundle({ sourceDir, outDir }) {
  await mkdir(outDir, { recursive: true });
  const source = await detectSource(sourceDir);
  source.sourceDir = sourceDir;

  const artifacts = await collectEvidenceFiles(sourceDir);
  const evidenceIndex = {
    generatedAt: new Date().toISOString(),
    sourceType: source.kind,
    sourceDir,
    artifacts,
  };
  await writeJson(path.join(outDir, 'evidence-index.json'), evidenceIndex);

  if (source.comparisonSummary) {
    await copyFile(path.join(sourceDir, 'comparison-summary.json'), path.join(outDir, 'comparison-summary.json'));
  }

  const primaryRunDir = source.primaryRunDir;
  const cyclePath = path.join(primaryRunDir, 'cycle.json');
  const conformancePath = path.join(primaryRunDir, 'conformance-report.json');
  if (!(await exists(cyclePath))) {
    throw new Error(`report source missing cycle artifact: ${cyclePath}`);
  }
  const viewsPath = await getViewInput(primaryRunDir, outDir);

  await generateArtifact('cycle-briefing', {
    out: path.join(outDir, 'cycle-briefing.html'),
    cycle: cyclePath,
    views: viewsPath,
    conformance: conformancePath,
  });

  const { manifestPath, reportPath } = await buildPilotInputs(source, outDir);
  await generateArtifact('pilot-recap', {
    out: path.join(outDir, 'pilot-recap.html'),
    manifest: manifestPath,
    report: reportPath,
  });

  await generateArtifact('compatibility-proof', {
    out: path.join(outDir, 'compatibility-proof.html'),
  });
  await generateArtifact('protocol-explainer', {
    out: path.join(outDir, 'protocol-explainer.html'),
  });

  await writeText(path.join(outDir, 'index.html'), renderIndex({
    source,
    evidenceIndex,
    hasComparison: Boolean(source.comparisonSummary),
  }));
  await writeText(path.join(outDir, 'operator-review.md'), renderOperatorReview({ source, evidenceIndex }));
  await writeText(path.join(outDir, 'research-review.md'), renderResearchReview({
    source,
    evidenceIndex,
    comparisonSummary: source.comparisonSummary,
  }));

  return {
    outDir,
    sourceType: source.kind,
    requiredOutputs: REQUIRED_OUTPUTS.concat(source.comparisonSummary ? ['comparison-summary.json'] : []),
    evidenceFiles: artifacts.length,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.defaultDemoSource) {
    await execFileAsync('node', [
      path.join('scripts', 'benchmark', 'run-benchmark.mjs'),
      'demo',
      '--out',
      options.sourceDir,
    ], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
  }
  const result = await buildReportBundle(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
