#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[index + 1] : 'true';
    flags[key] = value;
    if (value !== 'true') index += 1;
  }
  return {
    outDir: path.resolve(repoRoot, flags.out || path.join('artifacts', 'skills')),
  };
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), 'utf8'));
}

async function readText(relativePath) {
  return readFile(path.join(repoRoot, relativePath), 'utf8');
}

function parseSimpleYaml(content) {
  const result = {};
  let currentListKey = null;
  for (const rawLine of content.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const listMatch = line.match(/^\s*-\s+(.*)$/);
    if (listMatch && currentListKey) {
      result[currentListKey] ??= [];
      result[currentListKey].push(listMatch[1].trim());
      continue;
    }
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) continue;
    const [, key, rest] = keyMatch;
    if (!rest) {
      currentListKey = key;
      result[currentListKey] ??= [];
      continue;
    }
    currentListKey = null;
    result[key] = rest.trim();
  }
  return result;
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

async function main() {
  const { outDir } = parseArgs(process.argv.slice(2));
  const registry = await readJson('skills/registry.json');
  const packageByName = new Map((registry.packages || []).map((pkg) => [pkg.name, pkg]));
  const constitutionalCore = registry.constitutionalCore || { skills: [], primaryOutcomes: [], nonClaims: [], flagshipCompositions: [] };

  const skills = [];
  for (const item of constitutionalCore.skills || []) {
    const pkg = packageByName.get(item.name);
    if (!pkg) continue;
    const manifest = await readJson(pkg.manifest);
    skills.push({
      ...item,
      category: manifest.category,
      maturity: manifest.maturity,
      useWhen: manifest.useWhen || [],
      dontUseWhen: manifest.dontUseWhen || [],
      outputsPromised: manifest.outputsPromised || [],
      surfaces: manifest.surfaces || [],
      skillFile: manifest.skillFile,
    });
  }

  const compositions = [];
  for (const compositionName of constitutionalCore.flagshipCompositions || []) {
    const composition = (registry.compositions || []).find((item) => item.name === compositionName);
    if (!composition) continue;
    const yaml = parseSimpleYaml(await readText(path.join('skills', 'compositions', compositionName, 'composition.yaml')));
    compositions.push({
      name: composition.name,
      maturity: composition.maturity,
      intent: yaml.intent || 'unknown',
      blocks: yaml.blocks || [],
      outputs: yaml.outputs || [],
      entrypoint: composition.entrypoint,
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    thesis: constitutionalCore.thesis,
    primaryOutcomes: constitutionalCore.primaryOutcomes || [],
    nonClaims: constitutionalCore.nonClaims || [],
    skills,
    compositions,
  };

  const skillRows = skills.map((skill) => [
    `\`${skill.name}\``,
    skill.maturity || 'unknown',
    skill.constitutionalPurpose,
    (skill.failureModesTargeted || []).join(', '),
    (skill.humanOverridePoints || []).join(', '),
  ]);
  const compositionRows = compositions.map((composition) => [
    `\`${composition.name}\``,
    composition.maturity || 'unknown',
    composition.intent,
    String((composition.blocks || []).length),
    (composition.outputs || []).join(', '),
  ]);

  const markdown = `# ACP Constitutional Skills Map

Generated: ${payload.generatedAt}

## Thesis

${payload.thesis}

## Primary outcomes

${payload.primaryOutcomes.map((item) => `- ${item}`).join('\n')}

## Constitutional core skills

${mdTable(
    ['Skill', 'Maturity', 'Constitutional purpose', 'Failure modes targeted', 'Human override points'],
    skillRows,
  )}

## Flagship civic compositions

${mdTable(
    ['Composition', 'Maturity', 'Intent', 'Blocks', 'Outputs'],
    compositionRows,
  )}

## Non-claims

${payload.nonClaims.map((item) => `- ${item}`).join('\n')}
`;

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'constitutional-skills-map.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outDir, 'constitutional-skills-map.md'), markdown, 'utf8');
  process.stdout.write(`${JSON.stringify({ outDir, skills: skills.length, compositions: compositions.length }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
