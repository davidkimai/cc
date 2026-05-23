import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { NormalizedSkillPackage, SkillRegistryRecord } from './types.js';

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T;
}

export async function loadSkillRegistry(repoRoot = process.cwd()): Promise<SkillRegistryRecord> {
  return readJsonFile<SkillRegistryRecord>(path.join(repoRoot, 'skills', 'registry.json'));
}

export async function loadSkillPackageMap(repoRoot = process.cwd()): Promise<Map<string, NormalizedSkillPackage>> {
  const registry = await loadSkillRegistry(repoRoot);
  const entries = await Promise.all(registry.packages.map(async (pkg) => {
    const manifestData = await readJsonFile<NormalizedSkillPackage['manifestData']>(path.join(repoRoot, pkg.manifest));
    return [pkg.name, { ...pkg, manifestData }] as const;
  }));
  return new Map(entries);
}

export function registryPackageNames(registry: SkillRegistryRecord): Set<string> {
  return new Set(registry.packages.map((pkg) => pkg.name));
}
