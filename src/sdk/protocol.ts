import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  AcpProtocolBundleManifest,
  AcpProtocolDiscoveryRegistry,
  AcpSupportLevel,
  AcpValidationReport,
  AcpWorkspaceValidation,
} from './types.js';

const VALID_SUPPORT = new Set<AcpSupportLevel>(['native', 'mapped', 'wrapped', 'assumed']);
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

function buildReport(failures: string[]): AcpValidationReport {
  return {
    status: failures.length === 0 ? 'pass' : 'fail',
    failures,
  };
}

function isRelativeRepoPath(value: string): boolean {
  return value.length > 0 && !path.isAbsolute(value) && !value.startsWith('..');
}

async function readJson<T>(repoRoot: string, relativePath: string): Promise<T> {
  const raw = await readFile(path.resolve(repoRoot, relativePath), 'utf8');
  return JSON.parse(raw) as T;
}

export async function loadProtocolBundleManifest(repoRoot = process.cwd()): Promise<AcpProtocolBundleManifest> {
  return readJson<AcpProtocolBundleManifest>(repoRoot, 'protocol/acp-bundle.manifest.json');
}

export async function loadProtocolDiscoveryRegistry(repoRoot = process.cwd()): Promise<AcpProtocolDiscoveryRegistry> {
  return readJson<AcpProtocolDiscoveryRegistry>(repoRoot, 'protocol/discovery.json');
}

export function validateProtocolBundleManifest(manifest: AcpProtocolBundleManifest): AcpValidationReport {
  const failures: string[] = [];
  const artifactIds = new Set<string>();

  if (manifest.protocolName !== 'ACP') failures.push('manifest protocolName must be ACP');
  if (manifest.artifactKind !== 'protocol_bundle') failures.push('manifest artifactKind must be protocol_bundle');
  if (!SEMVER_PATTERN.test(manifest.protocolVersion)) failures.push('manifest protocolVersion must use semver-style x.y.z');
  if (!SEMVER_PATTERN.test(manifest.artifactVersion)) failures.push('manifest artifactVersion must use semver-style x.y.z');
  if (!isRelativeRepoPath(manifest.bundleRoot)) failures.push('manifest bundleRoot must be a repo-relative path');
  if (!isRelativeRepoPath(manifest.discoveryPath)) failures.push('manifest discoveryPath must be a repo-relative path');
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) {
    failures.push('manifest must declare at least one artifact');
  }

  for (const artifact of manifest.artifacts ?? []) {
    if (!artifact.id) failures.push('manifest artifact is missing id');
    if (artifactIds.has(artifact.id)) failures.push(`manifest artifact id is duplicated: ${artifact.id}`);
    artifactIds.add(artifact.id);
    if (!artifact.kind) failures.push(`manifest artifact ${artifact.id} is missing kind`);
    if (!isRelativeRepoPath(artifact.path)) failures.push(`manifest artifact ${artifact.id} has non-relative path`);
  }

  return buildReport(failures);
}

export function validateProtocolDiscoveryRegistry(
  discovery: AcpProtocolDiscoveryRegistry,
  manifest: AcpProtocolBundleManifest,
): AcpValidationReport {
  const failures: string[] = [];
  const manifestArtifactIds = new Set((manifest.artifacts ?? []).map((artifact) => artifact.id));
  const registryArtifactIds = new Set<string>();
  const implementationIds = new Set<string>();

  if (discovery.protocolName !== 'ACP') failures.push('discovery protocolName must be ACP');
  if (discovery.artifactKind !== 'discovery_registry') failures.push('discovery artifactKind must be discovery_registry');
  if (discovery.protocolVersion !== manifest.protocolVersion) {
    failures.push('discovery protocolVersion must match bundle manifest');
  }
  if (discovery.bundleManifestPath !== 'protocol/acp-bundle.manifest.json') {
    failures.push('discovery bundleManifestPath must point to protocol/acp-bundle.manifest.json');
  }

  for (const artifact of discovery.artifactRegistry ?? []) {
    if (!manifestArtifactIds.has(artifact.artifactId)) {
      failures.push(`discovery artifactRegistry references unknown manifest artifact: ${artifact.artifactId}`);
    }
    if (registryArtifactIds.has(artifact.artifactId)) {
      failures.push(`discovery artifactRegistry duplicates artifactId: ${artifact.artifactId}`);
    }
    registryArtifactIds.add(artifact.artifactId);
    if (!isRelativeRepoPath(artifact.path)) failures.push(`discovery artifact ${artifact.artifactId} has non-relative path`);
    if (!VALID_SUPPORT.has(artifact.support)) failures.push(`discovery artifact ${artifact.artifactId} has invalid support ${artifact.support}`);
  }

  for (const artifactId of manifestArtifactIds) {
    if (!registryArtifactIds.has(artifactId)) {
      failures.push(`discovery artifactRegistry is missing manifest artifact: ${artifactId}`);
    }
  }

  for (const implementation of discovery.implementations ?? []) {
    if (!implementation.id) failures.push('discovery implementation is missing id');
    if (implementationIds.has(implementation.id)) failures.push(`discovery implementation id is duplicated: ${implementation.id}`);
    implementationIds.add(implementation.id);
    if (!VALID_SUPPORT.has(implementation.support)) {
      failures.push(`discovery implementation ${implementation.id} has invalid support ${implementation.support}`);
    }
    if (!Array.isArray(implementation.entrypoints) || implementation.entrypoints.length === 0) {
      failures.push(`discovery implementation ${implementation.id} must declare entrypoints`);
    }
    for (const entrypoint of implementation.entrypoints ?? []) {
      if (!entrypoint.id) failures.push(`discovery implementation ${implementation.id} has entrypoint without id`);
      if (!entrypoint.kind) failures.push(`discovery implementation ${implementation.id} has entrypoint without kind`);
      if (!isRelativeRepoPath(entrypoint.path)) {
        failures.push(`discovery implementation ${implementation.id} entrypoint ${entrypoint.id} has non-relative path`);
      }
    }
    for (const artifactId of implementation.artifactIds ?? []) {
      if (!manifestArtifactIds.has(artifactId)) {
        failures.push(`discovery implementation ${implementation.id} references unknown artifactId ${artifactId}`);
      }
    }
    for (const docPath of implementation.docs ?? []) {
      if (!isRelativeRepoPath(docPath)) {
        failures.push(`discovery implementation ${implementation.id} has non-relative doc path ${docPath}`);
      }
    }
  }

  if (discovery.agentRuntimeDistribution) {
    if (!isRelativeRepoPath(discovery.agentRuntimeDistribution.registryPath)) {
      failures.push('discovery agentRuntimeDistribution.registryPath must be repo-relative');
    }
    if (!isRelativeRepoPath(discovery.agentRuntimeDistribution.builderPath)) {
      failures.push('discovery agentRuntimeDistribution.builderPath must be repo-relative');
    }
    for (const runtime of discovery.agentRuntimeDistribution.runtimes ?? []) {
      if (!runtime.runtime) failures.push('discovery agentRuntimeDistribution runtime is missing runtime');
      if (!VALID_SUPPORT.has(runtime.support)) {
        failures.push(`discovery agentRuntimeDistribution runtime ${runtime.runtime} has invalid support ${runtime.support}`);
      }
      if (!runtime.discoveryRoot) failures.push(`discovery agentRuntimeDistribution runtime ${runtime.runtime} is missing discoveryRoot`);
    }
  }

  return buildReport(failures);
}

export async function validateProtocolWorkspace(repoRoot = process.cwd()): Promise<AcpWorkspaceValidation> {
  const manifest = await loadProtocolBundleManifest(repoRoot);
  const discovery = await loadProtocolDiscoveryRegistry(repoRoot);
  const manifestValidation = validateProtocolBundleManifest(manifest);
  const discoveryValidation = validateProtocolDiscoveryRegistry(discovery, manifest);
  const fileFailures: string[] = [];

  const filePaths = [
    manifest.discoveryPath,
    ...manifest.artifacts.map((artifact) => artifact.path),
    discovery.bundleManifestPath,
    ...discovery.artifactRegistry.map((artifact) => artifact.path),
    ...discovery.implementations.flatMap((implementation) => [
      ...implementation.entrypoints.map((entrypoint) => entrypoint.path),
      ...(implementation.docs ?? []),
    ]),
    ...(discovery.agentRuntimeDistribution
      ? [discovery.agentRuntimeDistribution.registryPath, discovery.agentRuntimeDistribution.builderPath]
      : []),
  ];

  for (const filePath of filePaths) {
    try {
      await access(path.resolve(repoRoot, filePath));
    } catch {
      fileFailures.push(`missing protocol workspace path: ${filePath}`);
    }
  }

  const fileValidation = buildReport(fileFailures);
  const status =
    manifestValidation.status === 'pass' &&
    discoveryValidation.status === 'pass' &&
    fileValidation.status === 'pass'
      ? 'pass'
      : 'fail';

  return {
    status,
    manifest,
    discovery,
    manifestValidation,
    discoveryValidation,
    fileValidation,
  };
}
