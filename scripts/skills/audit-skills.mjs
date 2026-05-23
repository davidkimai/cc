import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const REQUIRED_MANIFEST_FIELDS = [
  'name',
  'category',
  'maturity',
  'useWhen',
  'dontUseWhen',
  'inputsExpected',
  'outputsPromised',
  'surfaces',
  'scripts',
  'references',
  'examples',
  'evals',
  'trustLevel',
  'sideEffects',
  'dependsOn',
];

const REQUIRED_S3_SECTIONS = [
  'What this skill is for',
  'When to use it',
  'When not to use it',
  'Inputs expected',
  'Preflight / prerequisites',
  'Workflow',
  'Decision rules / judgment criteria',
  'Escalation rules',
  'Available scripts',
  'Outputs',
  'Failure handling',
  'Trust / safety notes',
  'Composition notes',
  'Examples to inspect next',
  'Evaluation hooks',
];

const REQUIRED_EXAMPLE_MARKERS = ['Happy path', 'Failure path', 'Ambiguity', 'Anti-pattern'];
const REQUIRED_CONSTITUTIONAL_SECTIONS = [
  'Constitutional purpose',
  'Failure modes targeted',
  'Required evidence for valid use',
  'Produced artifacts',
  'Allowed claims',
  'Forbidden claims',
  'Human override points',
];
const ROBUST_DIRS = ['references', 'scripts', 'examples', 'evals', 'checklists'];

function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith('--')) {
      flags[token.slice(2)] = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[index + 1] : 'true';
      if (flags[token.slice(2)] !== 'true') index += 1;
    }
  }
  return {
    outDir: path.resolve(repoRoot, flags.out || path.join('artifacts', 'skills')),
  };
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), 'utf8'));
}

async function exists(relativePath) {
  try {
    await stat(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function hasFiles(relativePath) {
  try {
    const entries = await readdir(path.join(repoRoot, relativePath), { withFileTypes: true });
    return entries.some((entry) => entry.isFile());
  } catch {
    return false;
  }
}

function maturityRank(value) {
  const match = String(value || '').match(/^S([0-4])$/);
  return match ? Number(match[1]) : -1;
}

function frontMatterFields(content) {
  if (!content.startsWith('---\n')) return {};
  const end = content.indexOf('\n---', 4);
  if (end < 0) return {};
  const body = content.slice(4, end);
  const fields = {};
  for (const line of body.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) fields[match[1]] = match[2];
  }
  return fields;
}

function checkSkillSections(content) {
  return REQUIRED_S3_SECTIONS.filter((section) => !content.includes(`# ${section}`) && !content.includes(`## ${section}`));
}

function checkConstitutionalSections(content) {
  return REQUIRED_CONSTITUTIONAL_SECTIONS.filter((section) => !content.includes(`# ${section}`) && !content.includes(`## ${section}`));
}

async function inspectSkill(pkg, constitutionalSkills) {
  const failures = [];
  const warnings = [];
  if (!(await exists(pkg.manifest))) {
    return { name: pkg.name, status: 'fail', failures: [`missing manifest ${pkg.manifest}`], warnings };
  }
  const manifest = await readJson(pkg.manifest);
  for (const field of REQUIRED_MANIFEST_FIELDS) {
    const value = manifest[field];
    if (value === undefined || value === null || value === '') {
      failures.push(`manifest missing required field: ${field}`);
    }
  }
  if (manifest.name !== pkg.name) failures.push(`manifest name ${manifest.name} does not match registry name ${pkg.name}`);
  if (pkg.maturity && manifest.maturity !== pkg.maturity) failures.push(`registry maturity ${pkg.maturity} does not match manifest maturity ${manifest.maturity}`);
  if (!(await exists(manifest.skillFile))) failures.push(`missing skill file ${manifest.skillFile}`);

  const rank = maturityRank(manifest.maturity);
  let skillContent = '';
  if (await exists(manifest.skillFile)) {
    skillContent = await readFile(path.join(repoRoot, manifest.skillFile), 'utf8');
    const metadata = frontMatterFields(skillContent);
    for (const field of ['name', 'description', 'category', 'maturity']) {
      if (!metadata[field]) failures.push(`SKILL.md front matter missing ${field}`);
    }
    if (rank >= 3) {
      const missingSections = checkSkillSections(skillContent);
      for (const section of missingSections) failures.push(`SKILL.md missing section: ${section}`);
    }
    if (constitutionalSkills.has(pkg.name)) {
      const missingConstitutionalSections = checkConstitutionalSections(skillContent);
      for (const section of missingConstitutionalSections) failures.push(`constitutional-core SKILL.md missing section: ${section}`);
    }
  }

  for (const relativePath of [...(manifest.scripts || []), ...(manifest.references || []), ...(manifest.examples || []), ...(manifest.evals || [])]) {
    if (!(await exists(relativePath))) failures.push(`manifest path missing: ${relativePath}`);
  }

  if (rank >= 3) {
    for (const dir of ROBUST_DIRS) {
      const relativeDir = path.posix.join(manifest.blockRoot, dir);
      if (!(await hasFiles(relativeDir))) failures.push(`S3+ directory missing files: ${relativeDir}`);
    }
    const exampleTexts = [];
    for (const examplePath of manifest.examples || []) {
      if (await exists(examplePath)) exampleTexts.push(await readFile(path.join(repoRoot, examplePath), 'utf8'));
    }
    const examples = exampleTexts.join('\n');
    for (const marker of REQUIRED_EXAMPLE_MARKERS) {
      if (!examples.includes(marker)) failures.push(`examples missing marker: ${marker}`);
    }
    if (!skillContent.includes('Escalation rules')) failures.push('S3+ skill lacks escalation section');
    if (!skillContent.includes('Trust / safety notes')) failures.push('S3+ skill lacks trust section');
  }

  if (rank >= 4) {
    const flagshipText = [
      skillContent,
      ...await Promise.all((manifest.examples || []).map(async (examplePath) => (await exists(examplePath) ? readFile(path.join(repoRoot, examplePath), 'utf8') : ''))),
      ...await Promise.all((manifest.evals || []).map(async (evalPath) => (await exists(evalPath) ? readFile(path.join(repoRoot, evalPath), 'utf8') : ''))),
    ].join('\n');
    if (!/Flagship|casebook|golden|benchmark|operator relevance|adopter relevance/i.test(flagshipText)) {
      failures.push('S4 skill lacks flagship casebook, golden, benchmark, operator, or adopter relevance');
    }
  }

  return {
    name: pkg.name,
    maturity: manifest.maturity,
    category: manifest.category,
    status: failures.length ? 'fail' : 'pass',
    failures,
    warnings,
  };
}

async function inspectComposition(composition) {
  const base = path.join('skills', 'compositions', composition.name);
  const failures = [];
  for (const file of ['README.md', 'composition.yaml', 'run.sh']) {
    if (!(await exists(path.join(base, file)))) failures.push(`missing ${base}/${file}`);
  }
  const readmePath = path.join(base, 'README.md');
  if (await exists(readmePath)) {
    const readme = await readFile(path.join(repoRoot, readmePath), 'utf8');
    for (const marker of ['Workflow', 'Failure handling', 'Evaluation hooks', 'Outputs']) {
      if (!readme.includes(marker)) failures.push(`composition README missing ${marker}`);
    }
  }
  return {
    name: composition.name,
    status: failures.length ? 'fail' : 'pass',
    failures,
  };
}

function markdownReport(report) {
  const lines = [
    '# ACP Skills Maturity Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Status: ${report.status}`,
    '',
    `Skills: ${report.summary.skillsPassing}/${report.summary.skillsTotal} passing`,
    `Compositions: ${report.summary.compositionsPassing}/${report.summary.compositionsTotal} passing`,
    '',
    '## Skills',
    '',
    '| Skill | Maturity | Status | Failures |',
    '| --- | --- | --- | --- |',
  ];
  for (const skill of report.skills) {
    lines.push(`| \`${skill.name}\` | ${skill.maturity || 'unknown'} | ${skill.status} | ${skill.failures.length ? skill.failures.join('<br>') : 'none'} |`);
  }
  lines.push('', '## Compositions', '', '| Composition | Status | Failures |', '| --- | --- | --- |');
  for (const composition of report.compositions) {
    lines.push(`| \`${composition.name}\` | ${composition.status} | ${composition.failures.length ? composition.failures.join('<br>') : 'none'} |`);
  }
  return `${lines.join('\n')}\n`;
}

function overviewMarkdown(report) {
  const constitutionalCore = report.skills.filter((skill) => skill.constitutionalCore).map((skill) => `- \`${skill.name}\``).join('\n');
  const flagship = report.skills.filter((skill) => skill.maturity === 'S4').map((skill) => `- \`${skill.name}\``).join('\n');
  const robust = report.skills.filter((skill) => maturityRank(skill.maturity) >= 3 && skill.maturity !== 'S4').map((skill) => `- \`${skill.name}\``).join('\n');
  const compositions = report.compositions.map((composition) => `- \`${composition.name}\` (${composition.status})`).join('\n');
  return `# ACP Skills Suite Overview

Status: ${report.status}

ACP Skills packages Relay Blocks as a constitutional procedural intelligence layer over ACP.

## Constitutional Core

${constitutionalCore}

## Flagship S4 Skills

${flagship}

## Robust S3 Skills

${robust}

## Compositions

${compositions}

## Audit Summary

- Skills passing: ${report.summary.skillsPassing}/${report.summary.skillsTotal}
- Compositions passing: ${report.summary.compositionsPassing}/${report.summary.compositionsTotal}
- S3 or better: ${report.summary.s3OrBetter}
- S4: ${report.summary.s4}

Use this overview as the human-readable entrypoint; use \`skills-maturity-report.json\` for machine review.
`;
}

async function main() {
  const { outDir } = parseArgs(process.argv.slice(2));
  const registry = await readJson('skills/registry.json');
  const constitutionalSkills = new Set((registry.constitutionalCore?.skills || []).map((skill) => skill.name));
  const skills = [];
  for (const pkg of registry.packages || []) {
    const inspected = await inspectSkill(pkg, constitutionalSkills);
    inspected.constitutionalCore = constitutionalSkills.has(pkg.name);
    skills.push(inspected);
  }
  const compositions = [];
  for (const composition of registry.compositions || []) {
    compositions.push(await inspectComposition(composition));
  }
  const report = {
    generatedAt: new Date().toISOString(),
    status: skills.every((skill) => skill.status === 'pass') && compositions.every((composition) => composition.status === 'pass') ? 'pass' : 'fail',
    standard: registry.maturityStandard,
    summary: {
      skillsTotal: skills.length,
      skillsPassing: skills.filter((skill) => skill.status === 'pass').length,
      compositionsTotal: compositions.length,
      compositionsPassing: compositions.filter((composition) => composition.status === 'pass').length,
      s3OrBetter: skills.filter((skill) => maturityRank(skill.maturity) >= 3).length,
      s4: skills.filter((skill) => maturityRank(skill.maturity) >= 4).length,
      constitutionalCore: skills.filter((skill) => skill.constitutionalCore).length,
    },
    skills,
    compositions,
  };
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'skills-maturity-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'skills-maturity-report.md'), markdownReport(report), 'utf8');
  await writeFile(path.join(outDir, 'skill-suite-overview.md'), overviewMarkdown(report), 'utf8');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== 'pass') process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
