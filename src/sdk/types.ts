export type AcpSupportLevel = 'native' | 'mapped' | 'wrapped' | 'assumed';

export interface AcpProtocolArtifactRecord {
  id: string;
  kind: string;
  path: string;
  required: boolean;
  description?: string;
}

export interface AcpProtocolBundleManifest {
  schemaVersion: string;
  protocolName: 'ACP';
  protocolVersion: string;
  artifactKind: 'protocol_bundle';
  artifactVersion: string;
  bundleId: string;
  bundleRoot: string;
  discoveryPath: string;
  artifacts: AcpProtocolArtifactRecord[];
}

export interface AcpDiscoveryArtifactRecord {
  artifactId: string;
  kind: string;
  path: string;
  support: AcpSupportLevel;
}

export interface AcpImplementationEntrypoint {
  id: string;
  kind: string;
  path: string;
}

export interface AcpImplementationRecord {
  id: string;
  kind: string;
  support: AcpSupportLevel;
  entrypoints: AcpImplementationEntrypoint[];
  artifactIds: string[];
  docs?: string[];
}

export interface AcpRuntimeDistributionRecord {
  runtime: string;
  support: AcpSupportLevel;
  discoveryRoot: string;
}

export interface AcpProtocolDiscoveryRegistry {
  schemaVersion: string;
  protocolName: 'ACP';
  protocolVersion: string;
  artifactKind: 'discovery_registry';
  artifactVersion: string;
  bundleManifestPath: string;
  artifactRegistry: AcpDiscoveryArtifactRecord[];
  implementations: AcpImplementationRecord[];
  agentRuntimeDistribution?: {
    registryPath: string;
    builderPath: string;
    runtimes: AcpRuntimeDistributionRecord[];
  };
  extensionPolicy?: {
    allowedScopes: string[];
    forbiddenScopes: string[];
  };
}

export interface AcpValidationReport {
  status: 'pass' | 'fail';
  failures: string[];
}

export interface AcpWorkspaceValidation {
  status: 'pass' | 'fail';
  manifest: AcpProtocolBundleManifest;
  discovery: AcpProtocolDiscoveryRegistry;
  manifestValidation: AcpValidationReport;
  discoveryValidation: AcpValidationReport;
  fileValidation: AcpValidationReport;
}

export interface AcpConformanceReport {
  protocolVersion: string;
  generatedAt: string;
  status: 'pass' | 'fail';
  schemaBundle: {
    scope: string;
    status: 'pass' | 'fail';
    failures: string[];
  };
  replayCases: Array<{
    scope: string;
    caseId: string;
    condition: string;
    replayMode: string;
    status: 'pass' | 'fail';
    failures: string[];
  }>;
}

export interface AcpHttpRunOptions {
  scenarioPath: string;
  baseUrl: string;
  outDir?: string;
  actorId?: string;
  repoRoot?: string;
}

export interface AcpHttpRunResult {
  scenarioId: string;
  cycleId: string;
  outDir: string;
  baseUrl: string;
}
