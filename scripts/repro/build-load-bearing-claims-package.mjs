#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const flags = {
    out: path.join('artifacts', 'local', 'load-bearing-claims'),
    'measured-budget-usd': '2',
    'judge-budget-usd': '3',
    'live-budget-usd': '1',
    'live-adjudication-budget-usd': '1',
    'measured-max-arbitrations': '6',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[index + 1] : 'true';
    flags[key] = value;
    if (value !== 'true') index += 1;
  }

  const measuredBudgetUsd = Number(flags['measured-budget-usd']);
  const judgeBudgetUsd = Number(flags['judge-budget-usd']);
  const liveBudgetUsd = Number(flags['live-budget-usd']);
  const liveAdjudicationBudgetUsd = Number(flags['live-adjudication-budget-usd']);
  const measuredMaxArbitrations = Number(flags['measured-max-arbitrations']);

  for (const [name, value] of [
    ['measured-budget-usd', measuredBudgetUsd],
    ['judge-budget-usd', judgeBudgetUsd],
    ['live-budget-usd', liveBudgetUsd],
    ['live-adjudication-budget-usd', liveAdjudicationBudgetUsd],
  ]) {
    if (!Number.isFinite(value) || value <= 0) throw new Error(`--${name} must be a positive number`);
  }
  if (!Number.isInteger(measuredMaxArbitrations) || measuredMaxArbitrations < 0) {
    throw new Error('--measured-max-arbitrations must be a nonnegative integer');
  }

  return {
    outDir: path.resolve(repoRoot, flags.out),
    measuredBudgetUsd,
    judgeBudgetUsd,
    liveBudgetUsd,
    liveAdjudicationBudgetUsd,
    measuredMaxArbitrations,
  };
}

async function run(command, args, options = {}) {
  const { allowNonZeroExit = false, ...execOptions } = options;
  const startedAt = Date.now();
  try {
    const result = await execFileAsync(command, args, {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 80,
      ...execOptions,
    });
    return {
      status: 'pass',
      exitCode: 0,
      durationMs: Date.now() - startedAt,
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    };
  } catch (error) {
    if (!allowNonZeroExit) throw error;
    return {
      status: 'nonzero_exit',
      exitCode: typeof error?.code === 'number' ? error.code : 1,
      durationMs: Date.now() - startedAt,
      stdout: String(error?.stdout ?? '').trim(),
      stderr: String(error?.stderr ?? '').trim() || (error instanceof Error ? error.message : String(error)),
    };
  }
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
      if (depth === 0 && start >= 0) {
        last = value.slice(start, index + 1);
      }
    }
  }

  return last ? JSON.parse(last) : null;
}

async function runStep(steps, name, command, args, options = {}) {
  const commandString = [command, ...args].join(' ');
  const result = await run(command, args, options);
  const step = {
    name,
    command: commandString,
    status: result.status,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    stdoutTail: result.stdout.slice(-4000),
    stderrTail: result.stderr.slice(-2000),
  };
  steps.push(step);
  return { step, stdout: result.stdout, stderr: result.stderr };
}

async function runJsonStep(steps, name, command, args, options = {}) {
  const { step, stdout } = await runStep(steps, name, command, args, options);
  step.result = parseLastJsonObject(stdout);
  return step;
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function relativeToOut(outDir, filePath) {
  return path.relative(outDir, filePath).replaceAll(path.sep, '/');
}

function fmtUsd(value) {
  return `$${Number(value || 0).toFixed(6)}`;
}

function fmtBool(value) {
  return value ? 'true' : 'false';
}

function claimRow(claim) {
  return `| ${claim.id} | ${claim.status} | ${claim.statement} | ${claim.evidence.join('<br>')} |`;
}

function renderReadme(summary) {
  const stepsTable = [
    '| Step | Status | Duration (s) | Command |',
    '| --- | --- | ---: | --- |',
    ...summary.steps.map((step) => `| ${step.name} | ${step.status} | ${(step.durationMs / 1000).toFixed(1)} | \`${step.command}\` |`),
  ].join('\n');

  const claimsTable = [
    '| Claim | Status | Statement | Evidence |',
    '| --- | --- | --- | --- |',
    ...summary.claims.map(claimRow),
  ].join('\n');

  return `# ACP Load-Bearing Claims Reproduction Package

Generated: ${summary.generatedAt}

- Commit: \`${summary.repo.commit}\`
- Repository: ${summary.repo.repository}
- Output directory: \`${summary.outDir}\`
- Real provider calls used: ${fmtBool(summary.provider.realProviderCalls)}
- Dry runs used: ${fmtBool(summary.provider.dryRunUsed)}
- API key required: ${fmtBool(summary.provider.apiKeyRequired)}
- Total estimated provider spend observed in this run: ${fmtUsd(summary.costs.totalActualEstimatedUsd)}
- Total configured provider cap for this run: ${fmtUsd(summary.costs.totalConfiguredCapUsd)}

## What this package reproduces

This package is the paper-companion reproduction bundle for ACP's load-bearing claims. It preserves both:

1. the **core ACP / Relay claims** around protocol legibility, conformance, out-of-browser execution, adopter path, inspectable evidence, and production discipline
2. the **skills-layer claims** around bounded measured evidence, blinded surrogate adjudication, and narrow live-provider portability

No dry-run path is used here. Provider-backed steps require a real \`OPENAI_API_KEY\`.

## High-signal outcomes

### Core ACP

- Conformance status: **${summary.highlights.conformance.status}**
- Completion audit: **${summary.highlights.completion.status}** with **${summary.highlights.completion.passingClaims}/${summary.highlights.completion.totalClaims}** claims passing
- Rehearsal bundle ok: **${fmtBool(summary.highlights.rehearsal.ok)}**
- Flagship criteria evidence present: **${fmtBool(summary.highlights.rehearsal.criteriaEvidencePresent)}**
- Dogfood findings: **${summary.highlights.rehearsal.dogfoodFindings}**
- Adopter status: **${summary.highlights.rehearsal.adopterStatus}**
- Release smoke in rehearsal: **${fmtBool(summary.highlights.rehearsal.releaseSmokeOk)}**

### ACP skills / procedural interventions

- Skills audit: **${summary.highlights.skillsAudit.status}** with **${summary.highlights.skillsAudit.skillsPassing}/${summary.highlights.skillsAudit.skillsTotal}** skills and **${summary.highlights.skillsAudit.compositionsPassing}/${summary.highlights.skillsAudit.compositionsTotal}** compositions passing
- Deterministic harness: **${summary.highlights.skillsDeterministic.status}** with **${summary.highlights.skillsDeterministic.passingCases}/${summary.highlights.skillsDeterministic.totalCases}** cases passing
- Proxy comparative comparator: **${summary.highlights.skillsComparative.status}** (truthfully labeled proxy / fixture-policy surface)
- Measured generation: **${summary.highlights.skillsMeasured.totalCases}** held-out cases, **${summary.highlights.skillsMeasured.totalOutputs}** outputs, observed spend **${fmtUsd(summary.highlights.skillsMeasured.costUsd)}**
- Measured adjudication: **${summary.highlights.skillsMeasuredAdjudication.totalOutputs}** outputs, **${summary.highlights.skillsMeasuredAdjudication.arbitrationUsed}** arbitrations, observed spend **${fmtUsd(summary.highlights.skillsMeasuredAdjudication.costUsd)}**
- Live portability: **${summary.highlights.skillsLive.passCases}** pass / **${summary.highlights.skillsLive.reviewCases}** review / **${summary.highlights.skillsLive.failCases}** fail, observed spend **${fmtUsd(summary.highlights.skillsLive.costUsd)}**
- Live surrogate adjudication: **${summary.highlights.skillsLiveAdjudication.reviewCasesAdjudicated}** review divergences adjudicated, **${summary.highlights.skillsLiveAdjudication.arbitrationUsed}** arbitrations, observed spend **${fmtUsd(summary.highlights.skillsLiveAdjudication.costUsd)}**

## Load-bearing claims

${claimsTable}

## Output map

- Conformance report: \`${summary.paths.conformanceReport}\`
- Completion audit: \`${summary.paths.completionAudit}\`
- Rehearsal summary: \`${summary.paths.rehearsalSummary}\`
- Skills audit: \`${summary.paths.skillsAudit}\`
- Deterministic skills summary: \`${summary.paths.skillsDeterministic}\`
- Comparative skills summary: \`${summary.paths.skillsComparative}\`
- Measured generation summary: \`${summary.paths.skillsMeasured}\`
- Measured adjudication summary: \`${summary.paths.skillsMeasuredAdjudication}\`
- Live portability summary: \`${summary.paths.skillsLive}\`
- Operator review packet: \`${summary.paths.skillsOperatorReview}\`
- Final skills claims memo: \`${summary.paths.skillsClaimsMemo}\`

## Commands executed

${stepsTable}

## Notes for reviewers

- The measured and live-provider steps in this package use **real provider calls** and therefore require your own API key.
- A substep may show **\`nonzero_exit\`** when the reproduced evidence itself lands in a review/fail state. The package preserves that outcome instead of forcing an artificial green result.
- The skills evidence remains **bounded**: surrogate adjudication is not human operator review, and the package does not establish field efficacy, fairness solved, institutional legitimacy, or broad comparative superiority.
- For the bounded interpretation, read:\n  - \`${summary.paths.skillsClaimsMemo}\`\n  - \`${summary.paths.skillsNonClaims}\`
`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required. This reproduction path uses real provider calls and intentionally does not support dry runs.');
  }

  await mkdir(opts.outDir, { recursive: true });
  const steps = [];
  const startedAt = Date.now();

  const { step: gitStep, stdout: gitStdout } = await runStep(steps, 'git-commit', 'git', ['rev-parse', '--short', 'HEAD']);
  const commit = gitStdout.trim() || gitStep.stdoutTail.trim() || 'unknown';

  await runStep(steps, 'build', 'npm', ['run', 'build']);
  await runStep(steps, 'typecheck', 'npm', ['run', 'typecheck']);
  await runStep(steps, 'test', 'npm', ['test']);
  await runStep(steps, 'demo-bootstrap', 'npm', ['run', 'demo:bootstrap']);

  const jsonStepOptions = { allowNonZeroExit: true };

  const conformanceStep = await runJsonStep(steps, 'conformance-check', 'npm', ['run', '--silent', 'conformance:check', '--', '--json'], jsonStepOptions);
  await writeJson(path.join(opts.outDir, 'conformance', 'report.json'), conformanceStep.result);

  await runJsonStep(steps, 'completion-audit', 'npm', ['run', '--silent', 'completion:audit', '--', '--out', path.join(opts.outDir, 'completion')], jsonStepOptions);
  await runJsonStep(steps, 'conference-rehearsal', 'npm', ['run', '--silent', 'conference:rehearsal', '--', '--out', path.join(opts.outDir, 'conference-rehearsal')], jsonStepOptions);

  await runJsonStep(steps, 'skills-audit', 'npm', ['run', '--silent', 'skills:audit', '--', '--out', path.join(opts.outDir, 'skills', 'audit')], jsonStepOptions);
  await runJsonStep(steps, 'skills-deterministic', 'npm', ['run', '--silent', 'skills:eval', '--', '--mode', 'deterministic', '--out', path.join(opts.outDir, 'skills', 'deterministic')], jsonStepOptions);
  await runJsonStep(steps, 'skills-comparative', 'npm', ['run', '--silent', 'skills:compare', '--', '--out', path.join(opts.outDir, 'skills', 'comparative')], jsonStepOptions);
  await runJsonStep(steps, 'skills-measured-generate', 'npm', ['run', '--silent', 'skills:measured-generate', '--', '--out', path.join(opts.outDir, 'skills', 'measured-comparative'), '--max-budget-usd', String(opts.measuredBudgetUsd)], jsonStepOptions);
  await runJsonStep(steps, 'skills-measured-judge', 'npm', ['run', '--silent', 'skills:measured-judge', '--', '--source', path.join(opts.outDir, 'skills', 'measured-comparative', 'summary.json'), '--out', path.join(opts.outDir, 'skills', 'measured-comparative', 'adjudication'), '--max-budget-usd', String(opts.judgeBudgetUsd), '--max-arbitrations', String(opts.measuredMaxArbitrations)], jsonStepOptions);
  await runJsonStep(steps, 'skills-live-pilot', 'npm', ['run', '--silent', 'skills:live-pilot', '--', '--out', path.join(opts.outDir, 'skills', 'live-provider'), '--max-budget-usd', String(opts.liveBudgetUsd)], jsonStepOptions);
  await runJsonStep(steps, 'skills-live-portability', 'npm', ['run', '--silent', 'skills:live-portability', '--', '--source', path.join(opts.outDir, 'skills', 'live-provider', 'pilot-summary.json'), '--out', path.join(opts.outDir, 'skills', 'live-provider')], jsonStepOptions);
  await runJsonStep(steps, 'skills-live-adjudicate', 'npm', ['run', '--silent', 'skills:live-adjudicate', '--', '--source', path.join(opts.outDir, 'skills', 'live-provider', 'portability-summary.json'), '--pilot', path.join(opts.outDir, 'skills', 'live-provider', 'pilot-summary.json'), '--out', path.join(opts.outDir, 'skills', 'live-provider'), '--max-budget-usd', String(opts.liveAdjudicationBudgetUsd)], jsonStepOptions);
  await runJsonStep(steps, 'skills-operator-review', 'npm', ['run', '--silent', 'skills:operator-review', '--', '--out', path.join(opts.outDir, 'skills', 'operator-review'), '--deterministic', path.join(opts.outDir, 'skills', 'deterministic', 'summary.json'), '--comparative', path.join(opts.outDir, 'skills', 'comparative', 'deterministic-comparison.json'), '--live', path.join(opts.outDir, 'skills', 'live-provider', 'portability-summary.json')], jsonStepOptions);
  await runJsonStep(steps, 'skills-claims-package', 'npm', ['run', '--silent', 'skills:claims-package', '--', '--out', path.join(opts.outDir, 'skills', 'final'), '--deterministic', path.join(opts.outDir, 'skills', 'deterministic', 'summary.json'), '--comparative', path.join(opts.outDir, 'skills', 'comparative', 'deterministic-comparison.json'), '--measured', path.join(opts.outDir, 'skills', 'measured-comparative', 'summary.json'), '--measured-adjudication', path.join(opts.outDir, 'skills', 'measured-comparative', 'adjudication', 'summary.json'), '--live', path.join(opts.outDir, 'skills', 'live-provider', 'portability-summary.json'), '--operator-review', path.join(opts.outDir, 'skills', 'operator-review')], jsonStepOptions);

  const completionAudit = await readJson(path.join(opts.outDir, 'completion', 'technical-completion-audit.json'));
  const rehearsalSummary = await readJson(path.join(opts.outDir, 'conference-rehearsal', 'rehearsal-summary.json'));
  const skillsAudit = await readJson(path.join(opts.outDir, 'skills', 'audit', 'skills-maturity-report.json'));
  const deterministicSummary = await readJson(path.join(opts.outDir, 'skills', 'deterministic', 'summary.json'));
  const comparativeSummary = await readJson(path.join(opts.outDir, 'skills', 'comparative', 'deterministic-comparison.json'));
  const measuredSummary = await readJson(path.join(opts.outDir, 'skills', 'measured-comparative', 'summary.json'));
  const measuredAdjudication = await readJson(path.join(opts.outDir, 'skills', 'measured-comparative', 'adjudication', 'summary.json'));
  const livePortability = await readJson(path.join(opts.outDir, 'skills', 'live-provider', 'portability-summary.json'));
  const operatorReview = await readJson(path.join(opts.outDir, 'skills', 'operator-review', 'review-results.json'));

  const completionClaims = Object.fromEntries((completionAudit.claims || []).map((claim) => [claim.id, claim]));
  const measuredLiveCostTotal = Number((
    (measuredSummary.costs?.actualEstimatedCostUsd ?? 0)
    + (measuredAdjudication.costs?.actualEstimatedCostUsd ?? 0)
    + (livePortability.costEnvelope?.actualEstimatedCostUsd ?? 0)
    + (livePortability.surrogateAdjudication?.costs?.actualEstimatedCostUsd ?? 0)
  ).toFixed(6));
  const configuredCapTotal = Number((opts.measuredBudgetUsd + opts.judgeBudgetUsd + opts.liveBudgetUsd + opts.liveAdjudicationBudgetUsd).toFixed(6));

  const claims = [
    {
      id: 'explainable-without-relay-ui',
      status: completionClaims['explainable-without-relay']?.status ?? 'unknown',
      statement: 'ACP can be explained without opening Relay UI code.',
      evidence: [
        relativeToOut(opts.outDir, path.join(opts.outDir, 'completion', 'technical-completion-audit.md')),
        'protocol/README.md',
        'protocol/discovery.json',
        'protocol/EXTERNAL_IMPLEMENTER_GUIDE.md',
      ],
    },
    {
      id: 'checkable-without-trust',
      status: conformanceStep.result?.status === 'pass' && completionClaims['checkable-without-trust']?.status === 'pass' ? 'pass' : 'fail',
      statement: 'ACP can be checked without trusting the authors via a machine-readable conformance path.',
      evidence: [
        relativeToOut(opts.outDir, path.join(opts.outDir, 'conformance', 'report.json')),
        relativeToOut(opts.outDir, path.join(opts.outDir, 'completion', 'technical-completion-audit.md')),
        'scripts/conformance/check-acp.mjs',
      ],
    },
    {
      id: 'runs-outside-browser',
      status: rehearsalSummary.adopter?.status === 'pass' ? 'pass' : 'fail',
      statement: 'ACP can run outside the main Relay browser surface through batch and HTTP boundaries.',
      evidence: [
        relativeToOut(opts.outDir, path.join(opts.outDir, 'conference-rehearsal', 'rehearsal-summary.json')),
        'runners/batch/README.md',
        'runners/http-client/README.md',
        'adopters/typescript-http-starter/README.md',
      ],
    },
    {
      id: 'clear-outside-adoption-path',
      status: completionClaims['clear-outside-adoption-path']?.status ?? 'unknown',
      statement: 'ACP has a clear outside adoption path for external implementers.',
      evidence: [
        relativeToOut(opts.outDir, path.join(opts.outDir, 'conference-rehearsal', 'rehearsal-summary.json')),
        'protocol/compatibility/compatibility-matrix.json',
        'protocol/EXTERNAL_IMPLEMENTER_GUIDE.md',
        'adopters/typescript-http-starter/README.md',
      ],
    },
    {
      id: 'inspectable-evidence',
      status: rehearsalSummary.flagship?.comparisonSummary?.pairSignals?.criteriaEvidencePresent && completionClaims['inspectable-evidence']?.status === 'pass' ? 'pass' : 'fail',
      statement: 'ACP can produce inspectable benchmark, report, and rehearsal evidence.',
      evidence: [
        relativeToOut(opts.outDir, path.join(opts.outDir, 'conference-rehearsal', 'rehearsal-summary.json')),
        relativeToOut(opts.outDir, path.join(opts.outDir, 'conference-rehearsal', 'flagship-benchmark', 'comparison-summary.json')),
        relativeToOut(opts.outDir, path.join(opts.outDir, 'conference-rehearsal', 'flagship-report', 'evidence-index.json')),
      ],
    },
    {
      id: 'production-discipline',
      status: rehearsalSummary.releaseSmoke?.result?.ok && completionClaims['production-discipline']?.status === 'pass' ? 'pass' : 'fail',
      statement: 'Relay can be exercised with credible production and release discipline.',
      evidence: [
        relativeToOut(opts.outDir, path.join(opts.outDir, 'conference-rehearsal', 'rehearsal-summary.json')),
        relativeToOut(opts.outDir, path.join(opts.outDir, 'completion', 'technical-completion-audit.md')),
        'scripts/release/run-release-gate.mjs',
      ],
    },
    {
      id: 'skills-structural-maturity',
      status: skillsAudit.status,
      statement: 'The ACP skills suite can be structurally audited as a bounded procedural layer.',
      evidence: [
        relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'audit', 'skills-maturity-report.md')),
        'docs/specs/RELAY_BLOCKS_SKILL_MATURITY_STANDARD.md',
      ],
    },
    {
      id: 'skills-measured-surrogate-evidence-surface-reproduced',
      status: measuredSummary.totalOutputs > 0 && measuredAdjudication.totalOutputs > 0 ? 'pass' : 'fail',
      statement: 'ACP can reproduce a bounded measured skills evidence surface with separated generation and blinded surrogate adjudication.',
      evidence: [
        relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'measured-comparative', 'summary.json')),
        relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'measured-comparative', 'adjudication', 'summary.json')),
        relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'final', 'skills-v3-claims-memo.md')),
      ],
    },
    {
      id: 'skills-live-portability-surface-reproduced',
      status: livePortability.totalCases > 0 && (livePortability.surrogateAdjudication?.reviewCasesAdjudicated ?? 0) >= 0 ? 'pass' : 'fail',
      statement: 'ACP can reproduce a narrow live-provider portability evidence surface under bounded cost, preserving both passes and divergences for later adjudication.',
      evidence: [
        relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'live-provider', 'pilot-summary.json')),
        relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'live-provider', 'portability-summary.json')),
        relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'final', 'skills-v3-results-overview.md')),
      ],
    },
  ];

  const summary = {
    generatedAt: new Date().toISOString(),
    outDir: opts.outDir,
    repo: {
      commit,
      repository: 'https://github.com/davidkimai/acp',
    },
    provider: {
      apiKeyRequired: true,
      realProviderCalls: true,
      dryRunUsed: false,
      primaryModel: 'gpt-5.4-mini',
      arbitrationModel: 'gpt-5.4',
    },
    costs: {
      measuredGenerationUsd: measuredSummary.costs?.actualEstimatedCostUsd ?? 0,
      measuredAdjudicationUsd: measuredAdjudication.costs?.actualEstimatedCostUsd ?? 0,
      livePilotUsd: livePortability.costEnvelope?.actualEstimatedCostUsd ?? 0,
      liveAdjudicationUsd: livePortability.surrogateAdjudication?.costs?.actualEstimatedCostUsd ?? 0,
      totalActualEstimatedUsd: measuredLiveCostTotal,
      totalConfiguredCapUsd: configuredCapTotal,
    },
    highlights: {
      conformance: {
        status: conformanceStep.result?.status ?? 'unknown',
        totalChecks: conformanceStep.result?.summary?.totalChecks ?? null,
        passedChecks: conformanceStep.result?.summary?.passed ?? null,
      },
      completion: {
        status: completionAudit.status,
        passingClaims: completionAudit.claims.filter((claim) => claim.status === 'pass').length,
        totalClaims: completionAudit.claims.length,
      },
      rehearsal: {
        ok: rehearsalSummary.ok,
        criteriaEvidencePresent: rehearsalSummary.flagship?.comparisonSummary?.pairSignals?.criteriaEvidencePresent ?? false,
        dogfoodFindings: rehearsalSummary.dogfood?.findings ?? null,
        adopterStatus: rehearsalSummary.adopter?.status ?? 'unknown',
        releaseSmokeOk: rehearsalSummary.releaseSmoke?.result?.ok ?? false,
      },
      skillsAudit: {
        status: skillsAudit.status,
        skillsPassing: skillsAudit.summary?.skillsPassing ?? null,
        skillsTotal: skillsAudit.summary?.skillsTotal ?? null,
        compositionsPassing: skillsAudit.summary?.compositionsPassing ?? null,
        compositionsTotal: skillsAudit.summary?.compositionsTotal ?? null,
      },
      skillsDeterministic: {
        status: deterministicSummary.status,
        passingCases: deterministicSummary.passingCases,
        totalCases: deterministicSummary.totalCases,
      },
      skillsComparative: {
        status: comparativeSummary.status,
        fullSkill: comparativeSummary.aggregate?.full_skill ?? null,
        noSkill: comparativeSummary.aggregate?.no_skill ?? null,
        metadataOnly: comparativeSummary.aggregate?.metadata_only ?? null,
        composition: comparativeSummary.aggregate?.composition ?? null,
      },
      skillsMeasured: {
        totalCases: measuredSummary.totalCases,
        totalOutputs: measuredSummary.totalOutputs,
        costUsd: measuredSummary.costs?.actualEstimatedCostUsd ?? 0,
      },
      skillsMeasuredAdjudication: {
        totalOutputs: measuredAdjudication.totalOutputs,
        arbitrationUsed: measuredAdjudication.arbitration?.arbitrationUsed ?? 0,
        costUsd: measuredAdjudication.costs?.actualEstimatedCostUsd ?? 0,
      },
      skillsLive: {
        passCases: livePortability.passCases,
        reviewCases: livePortability.reviewCases,
        failCases: livePortability.failCases,
        costUsd: livePortability.costEnvelope?.actualEstimatedCostUsd ?? 0,
      },
      skillsLiveAdjudication: {
        status: livePortability.surrogateAdjudication?.status ?? 'unknown',
        reviewCasesAdjudicated: livePortability.surrogateAdjudication?.reviewCasesAdjudicated ?? 0,
        arbitrationUsed: livePortability.surrogateAdjudication?.arbitrationUsed ?? 0,
        costUsd: livePortability.surrogateAdjudication?.costs?.actualEstimatedCostUsd ?? 0,
      },
      operatorReview: {
        status: operatorReview.status,
        actualReviewerEvidence: operatorReview.actualReviewerEvidence,
      },
    },
    claims,
    paths: {
      conformanceReport: relativeToOut(opts.outDir, path.join(opts.outDir, 'conformance', 'report.json')),
      completionAudit: relativeToOut(opts.outDir, path.join(opts.outDir, 'completion', 'technical-completion-audit.md')),
      rehearsalSummary: relativeToOut(opts.outDir, path.join(opts.outDir, 'conference-rehearsal', 'rehearsal-summary.json')),
      skillsAudit: relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'audit', 'skills-maturity-report.json')),
      skillsDeterministic: relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'deterministic', 'summary.json')),
      skillsComparative: relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'comparative', 'deterministic-comparison.json')),
      skillsMeasured: relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'measured-comparative', 'summary.json')),
      skillsMeasuredAdjudication: relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'measured-comparative', 'adjudication', 'summary.json')),
      skillsLive: relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'live-provider', 'portability-summary.json')),
      skillsOperatorReview: relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'operator-review', 'review-results.json')),
      skillsClaimsMemo: relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'final', 'skills-v3-claims-memo.md')),
      skillsNonClaims: relativeToOut(opts.outDir, path.join(opts.outDir, 'skills', 'final', 'skills-v3-non-claims.md')),
    },
    steps: steps.map(({ result, ...step }) => step),
    totalDurationMs: Date.now() - startedAt,
  };

  await writeJson(path.join(opts.outDir, 'summary.json'), summary);
  await writeFile(path.join(opts.outDir, 'README.md'), renderReadme(summary), 'utf8');

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
