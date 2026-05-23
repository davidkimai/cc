import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { generateArtifact } from '../visual-artifacts/generate-visual-artifact.mjs';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      flags[token.slice(2)] = argv[i + 1];
      i += 1;
      continue;
    }
    positional.push(token);
  }
  return {
    scenarioPath: positional[0] || 'runners/http-client/examples/intervention.json',
    baseUrl: flags['base-url'] || 'http://127.0.0.1:4317',
    outDir: flags.out || path.join('artifacts', 'dogfood', 'relay-dogfood'),
  };
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

async function fetchText(url) {
  const response = await fetch(url);
  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}

function toMarkdown(report) {
  const checks = report.checks
    .map((check) => `| ${check.id} | ${check.status} | ${check.evidence || ''} |`)
    .join('\n');
  const findings = report.findings.length
    ? report.findings.map((finding) => `- [${finding.severity}] ${finding.title}: ${finding.details}`).join('\n')
    : '- No blocking findings recorded by automation.';

  return `# Relay Dogfood Report\n\n## Summary\n\n- Scenario: ${report.scenarioId}\n- Cycle ID: ${report.cycleId}\n- Base URL: ${report.baseUrl}\n- Findings: ${report.findings.length}\n- Browser automation: ${report.browserAutomation.status}\n\n## Deterministic Checks\n\n| Check | Status | Evidence |\n| --- | --- | --- |\n${checks}\n\n## Findings\n\n${findings}\n\n## Browser Automation\n\n${report.browserAutomation.status}: ${report.browserAutomation.reason}\n\n## Generated Artifacts\n\n${report.generatedArtifacts.map((artifact) => `- ${artifact.mode}: ${artifact.path}`).join('\n')}\n\n## Evidence Pointers\n\n${report.evidencePointers.map((artifact) => `- ${artifact.path} (${artifact.bytes} bytes, ${artifact.sha256})`).join('\n')}\n`;
}

async function evidencePointer(filePath) {
  const bytes = await readFile(filePath);
  return {
    path: filePath,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

async function evidencePointers(outDir) {
  const files = [
    'normalized-input.json',
    'cycle.json',
    'participant-views.json',
    'run-manifest.json',
    'conformance-report.json',
    'report.json',
    'report.md',
  ];
  const pointers = [];
  for (const file of files) {
    const filePath = path.join(outDir, file);
    try {
      await stat(filePath);
      pointers.push(await evidencePointer(filePath));
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return pointers;
}

async function main() {
  const { scenarioPath, baseUrl, outDir } = parseArgs(process.argv.slice(2));
  const resolvedOutDir = path.resolve(repoRoot, outDir);
  await mkdir(resolvedOutDir, { recursive: true });

  await execFileAsync('node', [path.join('scripts', 'http-client', 'run-http-scenario.mjs'), scenarioPath, '--base-url', baseUrl, '--out', resolvedOutDir], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  const cycle = await readJson(path.join(resolvedOutDir, 'cycle.json'));
  const views = await readJson(path.join(resolvedOutDir, 'participant-views.json'));
  const manifest = await readJson(path.join(resolvedOutDir, 'run-manifest.json'));
  const conformance = await readJson(path.join(resolvedOutDir, 'conformance-report.json'));
  const root = await fetchText(`${baseUrl}/`);
  const session = await fetchText(`${baseUrl}/v1/session`);
  const health = await fetchText(`${baseUrl}/health`);
  const ready = await fetchText(`${baseUrl}/ready`);

  const checks = [
    {
      id: 'operator-surface-marker',
      status: root.ok && root.text.includes('Cycle control, inspection, and export') ? 'pass' : 'fail',
      evidence: 'Root HTML contains operator surface heading',
    },
    {
      id: 'participant-surface-marker',
      status: root.ok && root.text.includes('Prompt, digest, thread, response, and feedback') ? 'pass' : 'fail',
      evidence: 'Root HTML contains participant surface heading',
    },
    {
      id: 'session-endpoint',
      status: session.ok ? 'pass' : 'fail',
      evidence: 'GET /v1/session returned success',
    },
    {
      id: 'health-endpoint',
      status: health.ok && health.text.includes('uptimeSeconds') ? 'pass' : 'fail',
      evidence: 'GET /health returned operational metadata',
    },
    {
      id: 'ready-endpoint',
      status: ready.ok && ready.text.includes('protocolBundle') ? 'pass' : 'fail',
      evidence: 'GET /ready returned storage and protocol readiness',
    },
    {
      id: 'operator-flow-audit',
      status: ['cycle_created', 'cycle_opened', 'submissions_closed', 'digests_released', 'cycle_archived'].every((action) => cycle.auditEvents.some((event) => event.action === action)) ? 'pass' : 'fail',
      evidence: 'Lifecycle audit events cover the expected operator flow',
    },
    {
      id: 'participant-load-flow',
      status: views.length > 0 && views.every((entry) => entry.view && entry.view.mode) ? 'pass' : 'fail',
      evidence: 'Participant views were captured after release',
    },
    {
      id: 'export-generation-flow',
      status: Array.isArray(manifest.exports) && manifest.exports.length > 0 ? 'pass' : 'fail',
      evidence: 'Run manifest contains generated exports',
    },
  ];

  const findings = [];
  if (checks.some((check) => check.status !== 'pass')) {
    findings.push({
      severity: 'high',
      title: 'Deterministic dogfood check failure',
      details: 'At least one deterministic product check failed. Review report.json and generated artifacts.',
    });
  }
  if (conformance.result !== 'pass') {
    findings.push({
      severity: 'high',
      title: 'Conformance regression',
      details: 'The seeded run did not satisfy the local or repo-wide conformance layer.',
    });
  }

  const generatedArtifacts = [];
  for (const [mode, rel] of [
    ['cycle-briefing', 'cycle-briefing.html'],
    ['compatibility-proof', 'compatibility-proof.html'],
    ['protocol-explainer', 'protocol-explainer.html'],
  ]) {
    const options = mode === 'cycle-briefing'
      ? { out: path.join(resolvedOutDir, rel), cycle: path.join(resolvedOutDir, 'cycle.json'), views: path.join(resolvedOutDir, 'participant-views.json'), conformance: path.join(resolvedOutDir, 'conformance-report.json') }
      : mode === 'pilot-recap'
        ? { out: path.join(resolvedOutDir, rel), manifest: path.join(resolvedOutDir, 'run-manifest.json'), report: path.join(resolvedOutDir, 'report.json') }
        : { out: path.join(resolvedOutDir, rel) };
    generatedArtifacts.push(await generateArtifact(mode, options));
  }

  const report = {
    scenarioId: manifest.scenarioId,
    cycleId: manifest.cycleId,
    baseUrl,
    checks,
    findings,
    browserAutomation: {
      status: 'skipped',
      reason: 'No approved browser-control path was available to this deterministic dogfood command.',
    },
    evidencePointers: [],
    generatedArtifacts,
  };

  await writeJson(path.join(resolvedOutDir, 'report.json'), report);
  await writeText(path.join(resolvedOutDir, 'report.md'), toMarkdown(report));

  const pilotRecap = await generateArtifact('pilot-recap', {
    out: path.join(resolvedOutDir, 'pilot-recap.html'),
    manifest: path.join(resolvedOutDir, 'run-manifest.json'),
    report: path.join(resolvedOutDir, 'report.json'),
  });
  report.generatedArtifacts = generatedArtifacts.map((artifact) => ({ mode: artifact.mode, path: artifact.out })).concat([{ mode: pilotRecap.mode, path: pilotRecap.out }]);
  await execFileAsync('node', [path.join('scripts', 'report', 'build-report-bundle.mjs'), '--source', resolvedOutDir, '--out', path.join(resolvedOutDir, 'institutional-report')], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  report.generatedArtifacts.push({ mode: 'institutional-report', path: path.join(resolvedOutDir, 'institutional-report', 'index.html') });
  checks.push({
    id: 'report-bundle-generation',
    status: 'pass',
    evidence: 'Institutional report bundle generated from dogfood artifacts',
  });
  report.evidencePointers = await evidencePointers(resolvedOutDir);
  await writeJson(path.join(resolvedOutDir, 'report.json'), report);
  await writeText(path.join(resolvedOutDir, 'report.md'), toMarkdown(report));

  process.stdout.write(`${JSON.stringify({ outDir: resolvedOutDir, checks: checks.length, findings: findings.length }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
