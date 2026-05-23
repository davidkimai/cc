import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadSkillRegistry } from './registry.js';

export interface MaterializedComposition {
  name: string;
  maturity?: string;
  entrypoint: string;
  readme: string;
  yaml: string;
}

export async function loadCompositionContext(name: string | null | undefined, repoRoot = process.cwd()): Promise<MaterializedComposition | null> {
  if (!name) return null;
  const registry = await loadSkillRegistry(repoRoot);
  const record = registry.compositions?.find((composition) => composition.name === name);
  if (!record) return null;
  const root = path.join(repoRoot, 'skills', 'compositions', name);
  const [readme, yaml] = await Promise.all([
    readFile(path.join(root, 'README.md'), 'utf8'),
    readFile(path.join(root, 'composition.yaml'), 'utf8'),
  ]);
  return {
    ...record,
    readme: readme.slice(0, 5000),
    yaml: yaml.slice(0, 5000),
  };
}
