#!/usr/bin/env node
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const runtimeLayouts = {
  'claude-code': '.claude/skills',
  opencode: '.opencode/skills',
  openclaw: 'skills',
  'codex-compatible': '.agents/skills',
};

function parseArgs(argv) {
  let runtime = 'all';
  let out = path.join(repoRoot, 'dist', 'agent-bundles');
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--runtime') {
      runtime = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === '--out') {
      out = path.resolve(repoRoot, argv[i + 1]);
      i += 1;
      continue;
    }
  }
  return { runtime, out };
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), 'utf8'));
}

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

function wrapperFrontmatter(name, description, runtime) {
  return `---\nname: ${name}\ndescription: ${description} This wrapper is generated for ${runtime} from the canonical ACP Relay Blocks suite.\n---\n`;
}

function wrapperBody(name, runtime, manifestPath) {
  return `\n# ACP Relay Block Wrapper\n\nThis is a generated runtime wrapper for the \`${name}\` Relay Block.\n\nRuntime target: \`${runtime}\`\nCanonical manifest: \`${manifestPath}\`\n\nUse the ACP repo \`skills/\` tree as the source of truth for:\n- operational instructions\n- references\n- helper scripts\n- composition relationships\n\nThis wrapper exists only to make the current Relay Block suite discoverable in a runtime-specific skills location.\n`;
}

async function buildRuntime(runtime, outRoot, registry) {
  const runtimeRoot = path.join(outRoot, runtime, runtimeLayouts[runtime]);
  await ensureDir(runtimeRoot);

  for (const pkg of registry.packages) {
    const manifest = await readJson(pkg.manifest);
    const skillDir = path.join(runtimeRoot, pkg.name);
    await ensureDir(skillDir);
    const contents = `${wrapperFrontmatter(pkg.name, manifest.summary, runtime)}${wrapperBody(pkg.name, runtime, pkg.manifest)}`;
    await writeFile(path.join(skillDir, 'SKILL.md'), contents, 'utf8');
    await writeFile(
      path.join(skillDir, 'WRAPPER.json'),
      `${JSON.stringify({
        runtime,
        name: pkg.name,
        sourceManifest: pkg.manifest,
        sourceSkillFile: manifest.skillFile,
        category: pkg.category,
        framing: registry.framing,
      }, null, 2)}\n`,
      'utf8',
    );
  }

  await writeFile(
    path.join(outRoot, runtime, 'bundle-manifest.json'),
    `${JSON.stringify({
      runtime,
      root: runtimeLayouts[runtime],
      generatedFrom: 'skills/registry.json',
      packageCount: registry.packages.length,
      framing: registry.framing,
    }, null, 2)}\n`,
    'utf8',
  );
}

async function main() {
  const { runtime, out } = parseArgs(process.argv.slice(2));
  const registry = await readJson('skills/registry.json');
  const runtimes = runtime === 'all' ? Object.keys(runtimeLayouts) : [runtime];

  for (const item of runtimes) {
    if (!runtimeLayouts[item]) {
      throw new Error(`unsupported runtime: ${item}`);
    }
  }

  await rm(out, { recursive: true, force: true });
  await ensureDir(out);

  for (const item of runtimes) {
    await buildRuntime(item, out, registry);
  }

  process.stdout.write(`${JSON.stringify({ out, runtimes }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
