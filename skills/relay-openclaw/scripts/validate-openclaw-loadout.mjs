#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsRoot = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(skillsRoot, '..');
const highValueBlocks = new Set([
  'research-cli-operator',
  'pilot-analysis',
  'participant-web-operator',
  'relay-openclaw',
]);

function listDirectories(root) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function parseDescription(skillPath) {
  const content = fs.readFileSync(skillPath, 'utf8');
  const match = content.match(/^---[\s\S]*?description:\s*(.+)\n---/m);
  return match ? match[1].trim() : null;
}

const blocks = listDirectories(skillsRoot).map((name) => {
  const blockRoot = path.join(skillsRoot, name);
  const skillPath = path.join(blockRoot, 'SKILL.md');
  const referencesPath = path.join(blockRoot, 'references');
  const scriptsPath = path.join(blockRoot, 'scripts');
  const references = fs.existsSync(referencesPath)
    ? fs.readdirSync(referencesPath).filter((entry) => !entry.startsWith('.')).sort()
    : [];
  const scripts = fs.existsSync(scriptsPath)
    ? fs.readdirSync(scriptsPath).filter((entry) => !entry.startsWith('.')).sort()
    : [];

  return {
    name,
    hasSkill: fs.existsSync(skillPath),
    description: fs.existsSync(skillPath) ? parseDescription(skillPath) : null,
    references,
    scripts,
    highValue: highValueBlocks.has(name),
  };
});

const registryPath = path.join(skillsRoot, 'registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const registryPackages = registry.packages.map((pkg) => {
  const manifestPath = path.join(repoRoot, pkg.manifest);
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : null;
  return {
    name: pkg.name,
    manifest: pkg.manifest,
    manifestExists: fs.existsSync(manifestPath),
    skillFileExists: manifest ? fs.existsSync(path.join(repoRoot, manifest.skillFile)) : false,
    scriptFilesExist: manifest ? (manifest.scripts ?? []).every((script) => fs.existsSync(path.join(repoRoot, script))) : false,
    status: manifest?.status ?? null,
  };
});

const summary = {
  skillsRoot,
  blockCount: blocks.length,
  blocks,
  registryPackageCount: registryPackages.length,
  registryPackages,
  missingSkillFiles: blocks.filter((block) => !block.hasSkill).map((block) => block.name),
  registryPackagingGaps: registryPackages.filter((pkg) => !pkg.manifestExists || !pkg.skillFileExists || !pkg.scriptFilesExist),
  highValuePackagingGaps: blocks
    .filter((block) => block.highValue)
    .filter((block) => block.references.length === 0 || block.scripts.length === 0)
    .map((block) => ({
      name: block.name,
      missingReferences: block.references.length === 0,
      missingScripts: block.scripts.length === 0,
    })),
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
