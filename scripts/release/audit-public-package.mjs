#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const REQUIRED_PATHS = [
  'README.md',
  'REVIEWER_START_HERE.md',
  'SUBMISSION_REPO_MAP.md',
  'CLAIMS_AND_NON_CLAIMS.md',
  'REPRODUCE.md',
  'LICENSE',
  'CITATION.cff',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'AGENTS.md',
  'package.json',
  'protocol/',
  'src/',
  'public/',
  'skills/',
  'benchmarks/',
  'evals/',
  'scripts/',
  'tests/',
  'demo/',
  'runners/',
  'adopters/',
  'artifacts/README.md',
  'artifacts/completion/final/',
  'artifacts/conference/rehearsal/README.md',
  'artifacts/conference/rehearsal/rehearsal-summary.json',
  'artifacts/evals/skills/final/',
  'artifacts/skills/',
];

const PUBLIC_DOCS = [
  'README.md',
  'REVIEWER_START_HERE.md',
  'SUBMISSION_REPO_MAP.md',
  'CLAIMS_AND_NON_CLAIMS.md',
  'REPRODUCE.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'protocol/README.md',
  'benchmarks/README.md',
  'artifacts/README.md',
  'artifacts/conference/rehearsal/README.md',
];

const CURATED_TEXT_SURFACES = [
  'artifacts/completion/final',
  'artifacts/conference/rehearsal/README.md',
  'artifacts/conference/rehearsal/rehearsal-summary.json',
  'artifacts/evals/skills/final',
  'artifacts/skills',
];

const REQUIRED_GITIGNORE_PATTERNS = [
  'artifacts/benchmarks/',
  'artifacts/completion-audit/',
  'artifacts/completion/foresight/',
  'artifacts/conference/foresight/',
  'artifacts/conference/rehearsal/adopter-http-run/',
  'artifacts/conference/rehearsal/dogfood-run/',
  'artifacts/conference/rehearsal/flagship-benchmark/',
  'artifacts/conference/rehearsal/flagship-report/',
  'artifacts/conference/rehearsal/runtime-data/',
  'artifacts/reports/',
  'skills/**/out/',
];

const ABSOLUTE_PATH_MARKERS = ['/Users/', 'C:\\Users\\', '/home/'];
const STAGE_PACKETS = {
  packet_p1_core: [
    '.github/workflows/ci.yml',
    '.gitignore',
    'AGENTS.md',
    'README.md',
    'REVIEWER_START_HERE.md',
    'SUBMISSION_REPO_MAP.md',
    'CLAIMS_AND_NON_CLAIMS.md',
    'REPRODUCE.md',
    'CONTRIBUTING.md',
    'SECURITY.md',
    'CITATION.cff',
    'LICENSE',
    'package.json',
    'docs/README.md',
    'protocol/',
    'src/',
    'public/',
    'scripts/',
    'tests/',
  ],
  packet_p2_eval_ecosystem: [
    'benchmarks/',
    'evals/',
    'fixtures/',
    'runners/',
    'adopters/',
    'demo/',
    'src/sdk/',
    'docs/compatibility/',
    'docs/specs/',
  ],
  packet_p3_skills_and_curated_artifacts: [
    'skills/',
    'src/skills/',
    'docs/strategy/ACP_PUBLIC_REPO_PACKAGING_PLAN.md',
    'docs/strategy/ACP_PUBLIC_RELEASE_STAGING_PLAN.md',
    'docs/strategy/ACP_EXECUTION_STATUS.md',
    'docs/strategy/ACP_SKILLS_V3_STUDY_PROTOCOL.md',
    'docs/strategy/ACP_SKILLS_V3_STATISTICAL_PLAN.md',
    'artifacts/README.md',
    'artifacts/completion/final/',
    'artifacts/conference/rehearsal/README.md',
    'artifacts/conference/rehearsal/rehearsal-summary.json',
    'artifacts/evals/skills/final/',
    'artifacts/skills/',
  ],
};

function repoRelative(value) {
  return path.relative(repoRoot, value).replaceAll(path.sep, '/');
}

async function pathExists(relativePath) {
  try {
    await stat(path.resolve(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(relativePath) {
  const absolutePath = path.resolve(repoRoot, relativePath);
  const info = await stat(absolutePath);
  if (info.isFile()) return [repoRelative(absolutePath)];
  const out = [];
  const entries = await readdir(absolutePath, { withFileTypes: true });
  for (const entry of entries) {
    const child = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      out.push(...await collectFiles(child));
    } else if (entry.isFile()) {
      out.push(child.replaceAll(path.sep, '/'));
    }
  }
  return out;
}

function extractRelativeLinks(markdown) {
  const matches = [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)];
  return matches
    .map((match) => match[1])
    .filter((link) => !link.startsWith('http') && !link.startsWith('mailto:') && !link.startsWith('#'));
}

async function fileSize(relativePath) {
  const info = await stat(path.resolve(repoRoot, relativePath));
  return info.size;
}

async function auditRelativeLinks() {
  const failures = [];
  for (const relativePath of PUBLIC_DOCS) {
    const content = await readFile(path.resolve(repoRoot, relativePath), 'utf8');
    for (const link of extractRelativeLinks(content)) {
      const target = path.resolve(path.dirname(path.resolve(repoRoot, relativePath)), link);
      try {
        await stat(target);
      } catch {
        failures.push({ file: relativePath, link });
      }
    }
  }
  return failures;
}

async function auditAbsolutePathLeaks() {
  const leaks = [];
  const files = [];
  for (const surface of CURATED_TEXT_SURFACES) {
    if (!(await pathExists(surface))) continue;
    files.push(...await collectFiles(surface));
  }
  for (const relativePath of files) {
    const content = await readFile(path.resolve(repoRoot, relativePath), 'utf8');
    const hit = ABSOLUTE_PATH_MARKERS.find((marker) => content.includes(marker));
    if (hit) leaks.push({ file: relativePath, marker: hit });
  }
  return leaks;
}

async function auditRequiredPaths() {
  const missing = [];
  for (const relativePath of REQUIRED_PATHS) {
    if (!(await pathExists(relativePath))) missing.push(relativePath);
  }
  return missing;
}

async function auditGitignore() {
  const gitignore = await readFile(path.resolve(repoRoot, '.gitignore'), 'utf8');
  return REQUIRED_GITIGNORE_PATTERNS.filter((pattern) => !gitignore.includes(pattern));
}

async function curatedArtifactSizes() {
  const result = {};
  for (const surface of [
    'artifacts/completion/final',
    'artifacts/conference/rehearsal/README.md',
    'artifacts/conference/rehearsal/rehearsal-summary.json',
    'artifacts/evals/skills/final',
    'artifacts/skills',
  ]) {
    if (!(await pathExists(surface))) continue;
    const files = await collectFiles(surface);
    let bytes = 0;
    for (const file of files) {
      bytes += await fileSize(file);
    }
    result[surface] = {
      fileCount: files.length,
      totalBytes: bytes,
    };
  }
  return result;
}

async function gitStatusSample() {
  try {
    const { stdout } = await execFileAsync('git', ['status', '--short'], {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10,
    });
    const lines = stdout.trim().split('\n').filter(Boolean);
    return {
      entryCount: lines.length,
      sample: lines.slice(0, 40),
    };
  } catch {
    return { entryCount: 0, sample: [] };
  }
}

async function main() {
  const missingPaths = await auditRequiredPaths();
  const brokenLinks = await auditRelativeLinks();
  const absoluteLeaks = await auditAbsolutePathLeaks();
  const missingIgnorePatterns = await auditGitignore();
  const artifactSizes = await curatedArtifactSizes();
  const gitStatus = await gitStatusSample();

  const ok = missingPaths.length === 0
    && brokenLinks.length === 0
    && absoluteLeaks.length === 0
    && missingIgnorePatterns.length === 0;

  const report = {
    ok,
    generatedAt: new Date().toISOString(),
    missingPaths,
    brokenLinks,
    absoluteLeaks,
    missingIgnorePatterns,
    curatedArtifactSizes: artifactSizes,
    gitStatus,
    stagePackets: STAGE_PACKETS,
    releaseDiscipline: {
      principle: 'Commit public-core, public-curated, and local-only surfaces as separate packets; do not push bulky regenerated trees or local runtime data.',
      commands: [
        'npm run build',
        'npm run typecheck',
        'npm test',
        'npm run release:gate',
        'npm run public:package:audit',
      ],
    },
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!ok) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
