import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith('--')) {
      flags[token.slice(2)] = argv[index + 1] || 'true';
      index += 1;
    }
  }
  return {
    outDir: path.resolve(repoRoot, flags.out || path.join('artifacts', 'conference', 'foresight')),
    skipRehearsal: flags['skip-rehearsal'] === 'true',
  };
}

async function runJson(name, command, args) {
  const startedAt = Date.now();
  const result = await execFileAsync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 80,
  });
  return {
    name,
    status: 'pass',
    durationMs: Date.now() - startedAt,
    result: parseLastJsonObject(result.stdout),
  };
}

function parseLastJsonObject(value) {
  let depth = 0;
  let start = -1;
  let last = null;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (inString) {
      escaped = char === '\\' && !escaped;
      if (char === '"' && !escaped) inString = false;
      if (char !== '\\') escaped = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0 && start >= 0) last = value.slice(start, index + 1);
    }
  }
  return last ? JSON.parse(last) : null;
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeText(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value, 'utf8');
}

async function collectArtifacts(rootDir) {
  const artifacts = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(filePath);
        continue;
      }
      const bytes = await readFile(filePath);
      artifacts.push({
        path: path.relative(rootDir, filePath).replaceAll(path.sep, '/'),
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
    }
  }
  await walk(rootDir);
  return artifacts.sort((a, b) => a.path.localeCompare(b.path));
}

function venueFraming() {
  return `# ACP Foresight Supercooperation Framing Memo

Target: Supercooperation: The Future of AI for Democracy

Venue facts used for positioning:

- Date: July 5, 2026
- Location: Grand InterContinental Seoul Parnas, South Korea, as an ICML satellite workshop
- Fit: AI tools for collective deliberation and cooperation; power concentration and governance under rapid AI progress; democratic practice on the ground
- Source: https://foresight.org/events/supercooperation-the-future-of-ai-for-democracy/

## ACP fit

ACP should be presented as constitutional middleware for public reasoning under load.

The core move is not that Relay has a better UI. The core move is that ACP makes attention allocation explicit, auditable, contestable, and portable across implementations.

## One-sentence submission frame

ACP is an open protocol and reference implementation for recursive, defense-in-depth attention coordination in democratic deliberation, preserving pluralism and uncertainty while helping institutions turn overloaded public input into inspectable issue maps and routed briefings.
`;
}

function abstractMemo() {
  return `# Draft Abstract Denominator

We present ACP, an open protocol and reference implementation for bounded collective reasoning under load. ACP treats attention allocation as democratic infrastructure: who gets seen, by whom, under what burden, and with what explanation. Its Relay implementation now includes Engine V2, a recursive constitutional deliberation engine that combines contribution understanding, issue-map construction, recipient-conditioned routing, set-level digest critique, omission and fairness critics, and escalation signals under explicit lifecycle and audit constraints.

Using public-hearing triage as the frozen denominator, the repository generates matched baseline-thread, heuristic-routing, and recursive-engine evidence bundles. The current evidence is prototype and benchmark evidence, not a field-efficacy claim. It demonstrates that ACP can produce inspectable protocol artifacts, explainable routed briefings, critic traces, and scale-band outputs suitable for workshop review and future pilot evaluation.
`;
}

function figurePlan() {
  return `# Figure Plan

1. ACP protocol / Relay / ecosystem stack diagram
2. Engine V2 layer diagram
3. Baseline thread vs heuristic vs recursive Engine V2 ablation chart
4. Omission/fairness/error taxonomy chart
5. Scale-band cost, latency, and issue-coverage chart
6. Public-hearing issue-map case study figure
`;
}

function limitationsMemo() {
  return `# Limitations And Non-Claims

## Current evidence class

Current evidence is prototype and benchmark evidence. It demonstrates artifact integrity, comparison shape, and protocol-operational feasibility. It does not establish field efficacy.

## Do not claim

- statistically significant deliberation-quality improvement
- legal adequacy for public hearing administration
- representative public opinion measurement
- consensus discovery
- neutral routing
- production readiness for consumer social scale

## Main risks

- synthetic scenarios may overfit to the expected routing story
- deterministic offline model passes are not substitutes for live model evaluation
- omission and fairness critics require human review before institutional reliance
- scale-band runs show tractability and artifact shape, not civic legitimacy
`;
}

function demoScript() {
  return `# Foresight Demo Script

1. Open the protocol framing: ACP is the protocol, Relay is the first implementation.
2. Show the public-hearing triage benchmark pair.
3. Open the recursive Engine V2 report and point to issue clusters, critic findings, and escalation confidence.
4. Show the ablation summary: baseline thread, heuristic routing, recursive Engine V2.
5. Open the scale-band summary for Band B and Band C.
6. Close on limitations: benchmark evidence, not field-efficacy evidence.
`;
}

function reviewerStartHere() {
  return `# Reviewer Start Here

This packet is a pre-submission evidence bundle for the Foresight Supercooperation workshop target.

## What to read first

1. \`venue-framing-memo.md\` for venue fit and the one-sentence frame.
2. \`draft-abstract.md\` for the paper denominator.
3. \`contribution-list.md\` for the claimed technical contributions.
4. \`limitations-and-non-claims.md\` before interpreting any benchmark result.
5. \`artifact-index.json\` for exact artifact paths and hashes.

## What the evidence supports

- ACP can be framed as an open protocol for attention coordination under deliberative load.
- Relay demonstrates ACP as a recursive, defense-in-depth engine rather than a generic chat product.
- The public-hearing triage denominator now has baseline, heuristic, recursive-engine, and scale-band evidence.

## What the evidence does not support yet

- Field efficacy in live public institutions.
- Statistical superiority claims.
- Legal adequacy for public-hearing administration.
- Claims that the engine discovers consensus.
`;
}

function contributionList() {
  return `# Contribution List

## C1. Protocol-bounded deliberation engine

ACP defines attention allocation as a protocol object: lifecycle state, contribution records, routing decisions, digest items, explanations, audit events, and evidence exports remain inspectable outside the Relay UI.

## C2. Recursive constitutional Engine V2

Engine V2 implements contribution understanding, issue-map construction, recipient-conditioned judging, set-level digest critique, omission critique, fairness critique, explanation synthesis, and escalation signals under explicit constraints.

## C3. Defense-in-depth evidence trace

Every recursive run emits an evidence trace with prompt versions, model policy, critic severities, issue coverage, stakeholder diversity, escalation recommendation, and model-audit metadata.

## C4. Frozen public-hearing denominator

\`public-hearing-triage\` is the paper denominator. It gives the project a stable scenario family for baseline-thread, heuristic-routing, recursive-engine, and scale-band comparison.

## C5. Conference-ready artifact system

The package generator produces a reviewable bundle with benchmark summaries, report outputs, rehearsal evidence, Foresight framing, limitations, demo script, figure plan, and artifact hashes.

## C6. Skill-native operating layer

ACP Skills V2 turns Relay Blocks into a mature procedural layer with S4 flagship skills, S3 operational skills, composition workflows, and a machine-checkable skill maturity gate.
`;
}

function omissionFairnessCasebook() {
  return `# Omission And Fairness Casebook

This casebook summarizes the current structured critic evidence. It is designed for paper drafting and reviewer triage, not as a field-efficacy claim.

## Case 1. Omission risk

- Evidence source: \`flagship-benchmark/comparison-summary.json\`
- Current signal: recursive Engine V2 trace present, omission critic severity reported.
- Interpretation: the engine exposes likely missing-issue risk before release instead of silently treating top-k routing as complete.
- Current limitation: critic judgments are benchmark-structured and deterministic in this bundle; live human/operator review remains required before institutional claims.

## Case 2. Fairness risk

- Evidence source: \`flagship-benchmark/comparison-summary.json\`
- Current signal: fairness critic severity reported, bridge exposure and stakeholder diversity metrics emitted.
- Interpretation: minority-erasure and tokenistic-bridge risks are first-class review objects rather than post hoc prose.
- Current limitation: fairness labels are not yet validated against independent human adjudication.

## Case 3. Low-confidence escalation

- Evidence source: \`engine-ablation/ablation-summary.json\` and scale-band summaries.
- Current signal: recursive mode emits escalation action, confidence, abstention flag, and reasons.
- Interpretation: ACP is allowed to say that a digest needs review instead of presenting all routed outputs as equally ready.
- Current limitation: current public-hearing runs recommend release; stress cases should be added before claiming robust abstention behavior.

## Case 4. False-consensus boundary

- Evidence source: \`limitations-and-non-claims.md\`, \`draft-abstract.md\`, and Engine V2 critic traces.
- Current signal: the package explicitly forbids consensus-discovery claims and frames compression around issue coverage, stakeholder representation, and unresolved questions.
- Interpretation: the research object is pluralism-preserving compression, not persuasion or consensus generation.
`;
}

function skillsV2Memo() {
  return `# Skills V2 Operating Layer

ACP now includes a skill-native operating layer for agents, operators, and external implementers.

## Why it matters for Foresight

The protocol explains meaning, Relay computes and exposes behavior, and Skills V2 teaches agents and operators how to apply ACP safely under real workflow pressure.

## Current skill evidence

- Skill standard: \`docs/specs/RELAY_BLOCKS_SKILL_MATURITY_STANDARD.md\`
- Registry: \`skills/registry.json\`
- Audit command: \`npm run skills:audit\`
- Maturity report: \`artifacts/skills/skills-maturity-report.json\`

## Flagship skills

- \`epistemic-routing\`
- \`digest-and-explanation\`
- \`public-hearing-triage\`

## Claim boundary

Skills are procedural judgment, not protocol truth. They help agents perform ACP workflows, but canonical semantics remain in specs, protocol bundles, and typed implementation models.
`;
}

async function main() {
  const { outDir, skipRehearsal } = parseArgs(process.argv.slice(2));
  await mkdir(outDir, { recursive: true });
  const checks = [];

  checks.push(await runJson('flagship-benchmark', 'npm', [
    'run',
    '--silent',
    'benchmark:compare',
    '--',
    '--class',
    'public-hearing-triage',
    '--out',
    path.join(outDir, 'flagship-benchmark'),
  ]));
  checks.push(await runJson('engine-ablation', 'npm', [
    'run',
    '--silent',
    'benchmark:ablation',
    '--',
    '--class',
    'public-hearing-triage',
    '--out',
    path.join(outDir, 'engine-ablation'),
  ]));
  checks.push(await runJson('scale-bands', 'npm', [
    'run',
    '--silent',
    'benchmark:scale',
    '--',
    '--out',
    path.join(outDir, 'scale-bands'),
  ]));
  checks.push(await runJson('flagship-report', 'npm', [
    'run',
    '--silent',
    'report:bundle',
    '--',
    '--source',
    path.join(outDir, 'flagship-benchmark'),
    '--out',
    path.join(outDir, 'flagship-report'),
  ]));

  if (!skipRehearsal) {
    checks.push(await runJson('conference-rehearsal', 'npm', [
      'run',
      '--silent',
      'conference:rehearsal',
      '--',
      '--skip-build',
      '--out',
      path.join(outDir, 'rehearsal'),
    ]));
  }

  await writeText(path.join(outDir, 'venue-framing-memo.md'), venueFraming());
  await writeText(path.join(outDir, 'draft-abstract.md'), abstractMemo());
  await writeText(path.join(outDir, 'figure-plan.md'), figurePlan());
  await writeText(path.join(outDir, 'limitations-and-non-claims.md'), limitationsMemo());
  await writeText(path.join(outDir, 'demo-script.md'), demoScript());
  await writeText(path.join(outDir, 'reviewer-start-here.md'), reviewerStartHere());
  await writeText(path.join(outDir, 'contribution-list.md'), contributionList());
  await writeText(path.join(outDir, 'omission-fairness-casebook.md'), omissionFairnessCasebook());
  await writeText(path.join(outDir, 'skills-v2-operating-layer.md'), skillsV2Memo());

  const artifactIndex = await collectArtifacts(outDir);
  await writeJson(path.join(outDir, 'artifact-index.json'), {
    generatedAt: new Date().toISOString(),
    outDir,
    artifactCount: artifactIndex.length,
    artifacts: artifactIndex,
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    outDir,
    ok: checks.every((check) => check.status === 'pass') && artifactIndex.length > 0,
    checks,
    requiredMemos: [
      'venue-framing-memo.md',
      'draft-abstract.md',
      'figure-plan.md',
      'limitations-and-non-claims.md',
      'demo-script.md',
      'reviewer-start-here.md',
      'contribution-list.md',
      'omission-fairness-casebook.md',
      'skills-v2-operating-layer.md',
      'artifact-index.json',
    ],
    artifactCount: artifactIndex.length,
  };
  await writeJson(path.join(outDir, 'foresight-package-summary.json'), summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.ok) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
