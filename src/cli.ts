#!/usr/bin/env node
import { exportModeSchema } from './core/types.js';
import { CycleService } from './services/cycle-service.js';

function parseJson(value: string | undefined): unknown {
  if (!value) {
    return undefined;
  }
  return JSON.parse(value);
}

function print(value: unknown): void {
  process.stdout.write(`${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}\n`);
}

async function main(): Promise<void> {
  const service = new CycleService();
  const [domain, action, ...rest] = process.argv.slice(2);

  if (domain === 'cycle' && action === 'create') {
    const payload = parseJson(rest[0]);
    print(await service.createCycle(payload));
    return;
  }
  if (domain === 'cycle' && action === 'list') {
    print(await service.listCycles());
    return;
  }
  if (domain === 'cycle' && action === 'show') {
    print(await service.getCycle(rest[0]));
    return;
  }
  if (domain === 'cycle' && action === 'open') {
    print(await service.openCycle(rest[0]));
    return;
  }
  if (domain === 'cycle' && action === 'close-submissions') {
    print(await service.closeSubmissions(rest[0]));
    return;
  }
  if (domain === 'cycle' && action === 'run-routing') {
    print(await service.runRouting(rest[0]));
    return;
  }
  if (domain === 'cycle' && action === 'release') {
    print(await service.releaseCycle(rest[0]));
    return;
  }
  if (domain === 'cycle' && action === 'close-reflection') {
    print(await service.closeReflection(rest[0]));
    return;
  }
  if (domain === 'cycle' && action === 'archive') {
    print(await service.archiveCycle(rest[0]));
    return;
  }
  if (domain === 'cycle' && action === 'replay') {
    print(await service.replayCycle(rest[0]));
    return;
  }
  if (domain === 'cycle' && action === 'export') {
    print(await service.exportCycle(rest[0], exportModeSchema.parse(rest[1] ?? 'analysis')));
    return;
  }
  if (domain === 'participant' && action === 'view') {
    print(await service.getParticipantView(rest[0], rest[1]));
    return;
  }
  if (domain === 'contribution' && action === 'submit') {
    print(await service.submitContribution(rest[0], parseJson(rest[1])));
    return;
  }
  if (domain === 'response' && action === 'submit') {
    print(await service.submitResponse(rest[0], parseJson(rest[1])));
    return;
  }
  if (domain === 'feedback' && action === 'submit') {
    print(await service.submitFeedback(rest[0], parseJson(rest[1])));
    return;
  }
  if (domain === 'event' && action === 'record') {
    print(await service.recordParticipantEvent(rest[0], parseJson(rest[1])));
    return;
  }

  print({
    usage: [
      'node dist/cli.js cycle create "{...json...}"',
      'node dist/cli.js cycle list',
      'node dist/cli.js cycle show <cycleId>',
      'node dist/cli.js cycle open <cycleId>',
      'node dist/cli.js cycle close-submissions <cycleId>',
      'node dist/cli.js cycle run-routing <cycleId>',
      'node dist/cli.js cycle release <cycleId>',
      'node dist/cli.js cycle close-reflection <cycleId>',
      'node dist/cli.js cycle archive <cycleId>',
      'node dist/cli.js cycle export <cycleId> [analysis|audit|minimal]',
      'node dist/cli.js participant view <cycleId> <participantId>',
      'node dist/cli.js contribution submit <cycleId> "{...json...}"',
      'node dist/cli.js response submit <cycleId> "{...json...}"',
      'node dist/cli.js feedback submit <cycleId> "{...json...}"',
      'node dist/cli.js event record <cycleId> "{...json...}"',
    ],
  });
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
