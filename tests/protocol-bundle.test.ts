import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  loadProtocolBundleManifest,
  loadProtocolDiscoveryRegistry,
  validateProtocolBundleManifest,
  validateProtocolDiscoveryRegistry,
  validateProtocolWorkspace,
} from '../src/sdk/index.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('ACP protocol bundle and discovery registry', () => {
  it('ships a versioned bundle manifest and discovery registry that validate cleanly', async () => {
    const manifest = await loadProtocolBundleManifest(repoRoot);
    const discovery = await loadProtocolDiscoveryRegistry(repoRoot);

    expect(validateProtocolBundleManifest(manifest).status).toBe('pass');
    expect(validateProtocolDiscoveryRegistry(discovery, manifest).status).toBe('pass');
    expect(manifest.bundleId).toBe('acp-core-v0.1.0');
    expect(discovery.bundleManifestPath).toBe('protocol/acp-bundle.manifest.json');
    expect(manifest.artifacts.map((item) => item.id)).toEqual(
      expect.arrayContaining(['constitutional-skills-doc', 'constitutional-skills-map']),
    );
    expect(discovery.implementations.map((item) => item.id)).toEqual(
      expect.arrayContaining(['relay', 'batch-runner', 'http-api-runner']),
    );
  });

  it('keeps every protocol registry path resolvable inside the repo', async () => {
    const report = await validateProtocolWorkspace(repoRoot);

    expect(report.status).toBe('pass');
    expect(report.fileValidation.failures).toEqual([]);
    expect(report.discovery.agentRuntimeDistribution?.runtimes).toHaveLength(4);
  });
});
