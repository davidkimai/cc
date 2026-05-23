import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      flags[token.slice(2)] = argv[i + 1];
      i += 1;
      continue;
    }
    positional.push(token);
  }
  return { mode: positional[0], flags };
}

async function readJsonMaybe(filePath) {
  if (!filePath) return null;
  const resolved = path.resolve(repoRoot, filePath);
  return JSON.parse(await readFile(resolved, 'utf8'));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderLayout({ title, subtitle, eyebrow = 'ACP visual artifact', sections = [] }) {
  const body = sections
    .map(
      (section) => `
        <section class="section">
          <div class="section__header">
            <p class="eyebrow">${escapeHtml(section.eyebrow || 'Section')}</p>
            <h2>${escapeHtml(section.title)}</h2>
            ${section.description ? `<p class="section__description">${escapeHtml(section.description)}</p>` : ''}
          </div>
          <div class="section__body">${section.body}</div>
        </section>
      `,
    )
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        --bg: #f4efe6;
        --panel: rgba(255, 252, 247, 0.92);
        --panel-strong: #fffdfa;
        --ink: #1d1a16;
        --muted: #6d6658;
        --line: #d6cab8;
        --accent: #0f5b50;
        --accent-soft: rgba(15, 91, 80, 0.08);
        --warm: #a55429;
        --warn: #8f5b1f;
        --radius: 20px;
        --shadow: 0 18px 45px rgba(33, 25, 16, 0.08);
        --font-sans: "Avenir Next", "Gill Sans", "Trebuchet MS", sans-serif;
        --font-serif: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: var(--font-sans);
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(15, 91, 80, 0.08), transparent 24%),
          linear-gradient(180deg, #f8f3eb 0%, var(--bg) 100%);
      }
      .page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px 20px 56px;
      }
      .hero {
        display: grid;
        gap: 16px;
        padding: 24px;
        border: 1px solid var(--line);
        border-radius: 28px;
        background:
          linear-gradient(180deg, rgba(255,253,249,0.96), rgba(249,244,235,0.88)),
          radial-gradient(circle at top right, rgba(15, 91, 80, 0.08), transparent 40%);
        box-shadow: var(--shadow);
      }
      .hero h1, .section h2, .card h3 {
        margin: 0;
        font-family: var(--font-serif);
        letter-spacing: -0.03em;
      }
      .hero h1 { font-size: clamp(2rem, 4vw, 3.5rem); line-height: 0.95; max-width: 14ch; }
      .hero p { margin: 0; color: var(--muted); line-height: 1.6; }
      .eyebrow {
        margin: 0;
        font-size: 0.76rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--muted);
      }
      .hero-grid, .card-grid, .metric-grid, .timeline { display: grid; gap: 14px; }
      .hero-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .section { margin-top: 24px; }
      .section__header { margin-bottom: 12px; }
      .section__description { margin: 8px 0 0; color: var(--muted); line-height: 1.55; }
      .card-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .metric-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .card, .metric, .timeline-item, table {
        border: 1px solid rgba(214, 202, 184, 0.82);
        border-radius: var(--radius);
        background: var(--panel);
        box-shadow: var(--shadow);
      }
      .card, .metric, .timeline-item { padding: 16px 18px; }
      .card p, .metric p, .timeline-item p, li { color: var(--muted); line-height: 1.55; }
      .metric strong { display: block; margin-top: 8px; font-size: 1.6rem; font-family: var(--font-serif); }
      table { width: 100%; border-collapse: collapse; overflow: hidden; background: var(--panel-strong); }
      th, td { padding: 12px 14px; border-bottom: 1px solid rgba(214, 202, 184, 0.72); text-align: left; vertical-align: top; }
      th { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); background: rgba(15, 91, 80, 0.05); }
      .badge {
        display: inline-flex;
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-weight: 700;
        font-size: 0.84rem;
      }
      .badge--warn { background: rgba(165, 84, 41, 0.1); color: var(--warm); }
      ul { margin: 0; padding-left: 18px; }
      @media (max-width: 960px) {
        .hero-grid, .card-grid, .metric-grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="hero">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
      </header>
      ${body}
    </main>
  </body>
</html>`;
}

function summarizeParticipantViews(views) {
  return (views || []).map((entry) => {
    const view = entry.view || {};
    return `
      <article class="card">
        <p class="eyebrow">Participant</p>
        <h3>${escapeHtml(entry.participantId)}</h3>
        <p>Mode: <span class="badge">${escapeHtml(view.mode || 'unknown')}</span></p>
        <p>Condition: ${escapeHtml(view.condition || 'unknown')}</p>
        <p>${escapeHtml(view.prompt || 'No prompt')}</p>
      </article>
    `;
  }).join('');
}

function summarizeAudit(auditEvents) {
  return (auditEvents || []).slice(-8).map((event) => `
    <article class="timeline-item">
      <p class="eyebrow">${escapeHtml(event.createdAt || 'Unknown time')}</p>
      <h3>${escapeHtml(event.action || 'Unknown action')}</h3>
      <p>${escapeHtml(`${event.actorType || 'actor'}:${event.actorId || 'unknown'}`)}</p>
    </article>
  `).join('');
}

function summarizeCriteria(cycle) {
  const criteria = cycle.config?.deliberativeCriteria || [];
  if (!criteria.length) {
    return '<article class="card"><p class="eyebrow">Criteria</p><h3>Not recorded</h3><p>This cycle does not include explicit shared criteria.</p></article>';
  }
  return criteria.map((criterion) => `
    <article class="card">
      <p class="eyebrow">${escapeHtml(criterion.id)}</p>
      <h3>${escapeHtml(criterion.label || criterion.id)}</h3>
      <p>${escapeHtml(criterion.description || 'Configured ACP criterion.')}</p>
      <p>Weight: ${escapeHtml(criterion.weight)}</p>
    </article>
  `).join('');
}

function summarizeEngineV2(cycle) {
  const trace = cycle.engineV2;
  if (!trace) {
    return '<article class="card"><p class="eyebrow">Engine V2</p><h3>No trace</h3><p>This cycle did not record a recursive Engine V2 trace.</p></article>';
  }
  const critics = (trace.critics || []).map((critic) => `
    <tr><td>${escapeHtml(critic.criticType)}</td><td>${escapeHtml(critic.severity)}</td><td>${escapeHtml((critic.findings || []).join(' '))}</td></tr>
  `).join('');
  return `
    <div class="card-grid">
      <article class="card"><p class="eyebrow">Provider</p><h3>${escapeHtml(trace.provider)}</h3><p>${escapeHtml(trace.modelPolicy?.primaryModel)} with ${escapeHtml(trace.modelPolicy?.arbitrationModel)} arbitration.</p></article>
      <article class="card"><p class="eyebrow">Issue map</p><h3>${escapeHtml((trace.issueMap?.clusters || []).length)}</h3><p>Issue clusters generated from contribution understanding records.</p></article>
      <article class="card"><p class="eyebrow">Escalation</p><h3>${escapeHtml(trace.escalation?.recommendedAction)}</h3><p>Confidence ${escapeHtml(trace.escalation?.confidence)}.</p></article>
    </div>
    <table><thead><tr><th>Critic</th><th>Severity</th><th>Finding</th></tr></thead><tbody>${critics}</tbody></table>
  `;
}

function buildCycleBriefing({ cycle, views, conformance }) {
  const metrics = cycle.metrics || {};
  return renderLayout({
    title: cycle.title || 'Cycle briefing',
    subtitle: 'A briefing artifact for one ACP cycle, including lifecycle state, participant delivery, metrics, and protocol checks.',
    eyebrow: 'Cycle briefing',
    sections: [
      {
        eyebrow: 'Cycle summary',
        title: 'Current cycle state',
        body: `
          <div class="hero-grid">
            <article class="card"><p class="eyebrow">Condition</p><h3>${escapeHtml(cycle.condition)}</h3><p>Shared ACP cycle model with condition-aware release logic.</p></article>
            <article class="card"><p class="eyebrow">Status</p><h3>${escapeHtml(cycle.status)}</h3><p>Current lifecycle token emitted by Relay.</p></article>
            <article class="card"><p class="eyebrow">Participants</p><h3>${escapeHtml((cycle.participants || []).length)}</h3><p>Participants recorded on this cycle.</p></article>
          </div>
        `,
      },
      {
        eyebrow: 'Criteria',
        title: 'Shared routing weights',
        body: `<div class="card-grid">${summarizeCriteria(cycle)}</div>`,
      },
      {
        eyebrow: 'Engine V2',
        title: 'Issue map, critics, and escalation',
        body: summarizeEngineV2(cycle),
      },
      {
        eyebrow: 'Metrics',
        title: 'Discussion measures',
        body: `
          <div class="metric-grid">
            <article class="metric"><p>Exposure Gini</p><strong>${escapeHtml(metrics.exposureConcentrationGini ?? '—')}</strong></article>
            <article class="metric"><p>Reply Gini</p><strong>${escapeHtml(metrics.replyConcentrationGini ?? '—')}</strong></article>
            <article class="metric"><p>Coverage</p><strong>${escapeHtml(metrics.averageContributorCoverage ?? '—')}</strong></article>
            <article class="metric"><p>Bridge Rate</p><strong>${escapeHtml(metrics.bridgeExposureRate ?? '—')}</strong></article>
          </div>
        `,
      },
      {
        eyebrow: 'Participant delivery',
        title: 'Participant view capture',
        body: `<div class="card-grid">${summarizeParticipantViews(views)}</div>`,
      },
      {
        eyebrow: 'Lifecycle',
        title: 'Recent audit trail',
        body: `<div class="timeline">${summarizeAudit(cycle.auditEvents || [])}</div>`,
      },
      {
        eyebrow: 'Protocol checks',
        title: 'Conformance summary',
        body: `
          <div class="card-grid">
            <article class="card"><p class="eyebrow">Result</p><h3>${escapeHtml(conformance?.result || 'unknown')}</h3><p>Local run plus repo-wide conformance check outcome.</p></article>
            <article class="card"><p class="eyebrow">Routing respected</p><h3>${escapeHtml(conformance?.checks?.routingConditionRespected)}</h3><p>Intervention and baseline behavior stayed condition-correct.</p></article>
            <article class="card"><p class="eyebrow">Exports generated</p><h3>${escapeHtml(conformance?.checks?.exportsGenerated)}</h3><p>Cycle outputs were generated for review and analysis.</p></article>
          </div>
        `,
      },
    ],
  });
}

function buildPilotRecap({ manifest, report }) {
  const checks = report?.checks || [];
  const findings = report?.findings || [];
  return renderLayout({
    title: 'Pilot recap',
    subtitle: 'A run-level recap that combines seeded execution, deterministic checks, generated artifacts, and current findings.',
    eyebrow: 'Pilot recap',
    sections: [
      {
        eyebrow: 'Run summary',
        title: 'Seeded run and artifact status',
        body: `
          <div class="card-grid">
            <article class="card"><p class="eyebrow">Scenario</p><h3>${escapeHtml(report?.scenarioId || manifest?.scenarioId || 'unknown')}</h3><p>Seeded scenario used for dogfood automation.</p></article>
            <article class="card"><p class="eyebrow">Condition</p><h3>${escapeHtml(manifest?.condition || 'unknown')}</h3><p>Condition executed through the public Relay boundary.</p></article>
            <article class="card"><p class="eyebrow">Artifacts</p><h3>${escapeHtml((manifest?.exports || []).length)}</h3><p>Export artifacts captured in the run bundle.</p></article>
          </div>
        `,
      },
      {
        eyebrow: 'Checks',
        title: 'Deterministic surface checks',
        body: `<table><thead><tr><th>Check</th><th>Status</th><th>Evidence</th></tr></thead><tbody>${checks.map((check) => `<tr><td>${escapeHtml(check.id)}</td><td>${escapeHtml(check.status)}</td><td>${escapeHtml(check.evidence || '')}</td></tr>`).join('')}</tbody></table>`,
      },
      {
        eyebrow: 'Findings',
        title: 'Current dogfood findings',
        body: findings.length
          ? `<table><thead><tr><th>Severity</th><th>Title</th><th>Details</th></tr></thead><tbody>${findings.map((finding) => `<tr><td>${escapeHtml(finding.severity)}</td><td>${escapeHtml(finding.title)}</td><td>${escapeHtml(finding.details)}</td></tr>`).join('')}</tbody></table>`
          : `<div class="card"><p class="eyebrow">Status</p><h3>No blocking findings recorded</h3><p>The automation completed without recording critical product issues.</p></div>`,
      },
    ],
  });
}

function buildCompatibilityProof(matrix) {
  return renderLayout({
    title: 'Compatibility proof',
    subtitle: 'A compact proof page for ACP boundary ownership, proof surfaces, and runtime validation layers.',
    eyebrow: 'Compatibility proof',
    sections: [
      {
        eyebrow: 'Boundary matrix',
        title: 'Protocol and implementation ownership',
        body: `<table><thead><tr><th>Feature</th><th>Protocol</th><th>Relay</th><th>Blocks</th><th>Adapter</th></tr></thead><tbody>${matrix.matrix.map((row) => `<tr><td>${escapeHtml(row.feature)}</td><td>${escapeHtml(row.protocol)}</td><td>${escapeHtml(row.relayImplementation)}</td><td>${escapeHtml(row.relayBlocks)}</td><td>${escapeHtml(row.runtimeAdapter)}</td></tr>`).join('')}</tbody></table>`,
      },
      {
        eyebrow: 'Proof surfaces',
        title: 'How ACP is currently validated',
        body: `<div class="card-grid">${matrix.proofSurfaces.map((surface) => `<article class="card"><p class="eyebrow">${escapeHtml(surface.kind)}</p><h3>${escapeHtml(surface.id)}</h3><p>${escapeHtml(surface.notes)}</p></article>`).join('')}</div>`,
      },
      {
        eyebrow: 'Runtime wrappers',
        title: 'Skills-compatible runtime validation',
        body: `<table><thead><tr><th>Runtime</th><th>Support</th><th>Discovery root</th></tr></thead><tbody>${(matrix.agentRuntimeValidation?.runtimes || []).map((runtime) => `<tr><td>${escapeHtml(runtime.runtime)}</td><td>${escapeHtml(runtime.support)}</td><td>${escapeHtml(runtime.discoveryRoot)}</td></tr>`).join('')}</tbody></table>`,
      },
    ],
  });
}

function buildProtocolExplainer() {
  return renderLayout({
    title: 'Protocol explainer',
    subtitle: 'A plain-language overview of ACP, Relay, Relay Blocks, and the current proof surfaces in this repository.',
    eyebrow: 'Protocol explainer',
    sections: [
      {
        eyebrow: 'Hierarchy',
        title: 'Three-layer framing',
        body: `
          <div class="card-grid">
            <article class="card"><p class="eyebrow">Protocol</p><h3>ACP</h3><p>The protocol contract. It owns cycle meaning, lifecycle semantics, condition behavior, auditability, and exports.</p></article>
            <article class="card"><p class="eyebrow">Implementation</p><h3>Relay</h3><p>The first implementation. It exposes the browser surface, API, CLI, persistence layer, and export behavior.</p></article>
            <article class="card"><p class="eyebrow">Operational layer</p><h3>Relay Blocks</h3><p>Reusable operational units over ACP and Relay, packaged for compatible agents and workflow automation.</p></article>
          </div>
        `,
      },
      {
        eyebrow: 'Lifecycle',
        title: 'Core cycle shape',
        body: `
          <table><thead><tr><th>Step</th><th>Meaning</th></tr></thead><tbody>
            <tr><td>Create</td><td>One shared cycle is created with prompt, participants, condition, and config.</td></tr>
            <tr><td>Open</td><td>Participants can submit one primary contribution.</td></tr>
            <tr><td>Close submissions</td><td>The contribution window closes.</td></tr>
            <tr><td>Route if intervention</td><td>Only intervention cycles generate routing decisions and digests.</td></tr>
            <tr><td>Release</td><td>Participants receive either routed digests or a baseline thread view.</td></tr>
            <tr><td>Respond and reflect</td><td>Responses, feedback, telemetry, and audit evidence accumulate.</td></tr>
            <tr><td>Archive and export</td><td>The cycle is closed and exported for pilot review.</td></tr>
          </tbody></table>
        `,
      },
      {
        eyebrow: 'Proof today',
        title: 'What currently proves ACP',
        body: `
          <div class="card-grid">
            <article class="card"><p class="eyebrow">First implementation</p><h3>Relay browser and CLI</h3><p>The main product boundary for operators and participants.</p></article>
            <article class="card"><p class="eyebrow">Second surface</p><h3>Batch runner</h3><p>File-driven proof surface outside the browser UI.</p></article>
            <article class="card"><p class="eyebrow">External consumer</p><h3>HTTP client runner</h3><p>API-driven proof surface across the public Relay boundary.</p></article>
          </div>
        `,
      },
    ],
  });
}

export async function generateArtifact(mode, options = {}) {
  const out = path.resolve(repoRoot, options.out || `artifacts/${mode}.html`);
  let html;

  if (mode === 'cycle-briefing') {
    const cycle = await readJsonMaybe(options.cycle);
    const views = await readJsonMaybe(options.views);
    const conformance = await readJsonMaybe(options.conformance);
    html = buildCycleBriefing({ cycle, views, conformance });
  } else if (mode === 'pilot-recap') {
    const manifest = await readJsonMaybe(options.manifest);
    const report = await readJsonMaybe(options.report);
    html = buildPilotRecap({ manifest, report });
  } else if (mode === 'compatibility-proof') {
    const matrix = await readJsonMaybe(options.matrix || 'protocol/compatibility/compatibility-matrix.json');
    html = buildCompatibilityProof(matrix);
  } else if (mode === 'protocol-explainer') {
    html = buildProtocolExplainer();
  } else {
    throw new Error(`unsupported visual artifact mode: ${mode}`);
  }

  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, html, 'utf8');
  return { out, mode };
}

async function main() {
  const { mode, flags } = parseArgs(process.argv.slice(2));
  if (!mode) {
    throw new Error('usage: npm run visual:artifact -- <mode> [--out file] [--cycle file] [--views file] [--conformance file] [--manifest file] [--report file]');
  }
  const result = await generateArtifact(mode, flags);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
