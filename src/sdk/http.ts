import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

import type { AcpConformanceReport, AcpHttpRunOptions, AcpHttpRunResult } from './types.js';

const execFileAsync = promisify(execFile);

export async function runReplayConformance(repoRoot = process.cwd()): Promise<AcpConformanceReport> {
  const { stdout } = await execFileAsync('node', ['scripts/conformance/check-acp.mjs', '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  return JSON.parse(stdout) as AcpConformanceReport;
}

export async function runHttpScenario(options: AcpHttpRunOptions): Promise<AcpHttpRunResult> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const args = ['scripts/http-client/run-http-scenario.mjs', options.scenarioPath, '--base-url', options.baseUrl];

  if (options.outDir) {
    args.push('--out', options.outDir);
  }
  if (options.actorId) {
    args.push('--actor-id', options.actorId);
  }

  const { stdout } = await execFileAsync('node', args, {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  const payload = JSON.parse(stdout) as AcpHttpRunResult;
  payload.outDir = path.resolve(repoRoot, payload.outDir);
  return payload;
}
