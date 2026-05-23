import { describe, expect, it } from 'vitest';

import { CycleService } from '../src/services/cycle-service.js';
import { FileStore } from '../src/services/file-store.js';

describe('Engine V2 recursive trace', () => {
  it('records issue maps, critics, escalation, and model audit data during routing', async () => {
    const service = new CycleService(new FileStore(await import('node:fs/promises').then(({ mkdtemp }) => mkdtemp('/tmp/acp-engine-v2-'))));
    let cycle = await service.createCycle({
      title: 'Public hearing triage',
      prompt: 'How should a planning board preserve minority testimony while preparing an issue map?',
      condition: 'intervention',
      participants: [
        { id: 'p1', name: 'Ari', role: 'participant' },
        { id: 'p2', name: 'Bea', role: 'participant' },
        { id: 'p3', name: 'Cam', role: 'participant' },
        { id: 'p4', name: 'Dee', role: 'participant' },
      ],
      config: { maxDigestItems: 3, maxBridgeItems: 1, engineMode: 'recursive_engine_v2' },
    });
    cycle = await service.openCycle(cycle.id);
    cycle = await service.submitContribution(cycle.id, {
      participantId: 'p1',
      body: 'The process needs a transparent issue map before the hearing closes.',
    });
    cycle = await service.submitContribution(cycle.id, {
      participantId: 'p2',
      body: 'Transit access and language access are the buried minority concern.',
    });
    cycle = await service.submitContribution(cycle.id, {
      participantId: 'p3',
      body: 'The implementation timeline should name staff owners and enforcement milestones.',
    });
    cycle = await service.submitContribution(cycle.id, {
      participantId: 'p4',
      body: 'What happens to unresolved questions if the agenda packet is compressed?',
    });
    cycle = await service.closeSubmissions(cycle.id);
    cycle = await service.runRouting(cycle.id);

    expect(cycle.engineV2?.engineMode).toBe('recursive_engine_v2');
    expect(cycle.engineV2?.modelPolicy.primaryModel).toBe('gpt-5.4-mini');
    expect(cycle.engineV2?.modelPolicy.arbitrationModel).toBe('gpt-5.4');
    expect(cycle.engineV2?.issueMap.clusters.length).toBeGreaterThan(1);
    expect(cycle.engineV2?.critics.map((critic) => critic.criticType).sort()).toEqual(['fairness', 'omission']);
    expect(cycle.engineV2?.escalation.recommendedAction).toMatch(/release|review|revise_digest|abstain/);
    expect(cycle.engineV2?.modelAudit.calls).toBeGreaterThan(0);
    expect(cycle.routingDecisions.every((decision) => decision.engineVersion === 'engine-v2')).toBe(true);
    expect(cycle.digests[0].routingExplanations?.length).toBeGreaterThan(0);
    expect(cycle.proceduralLayer?.references.length).toBeGreaterThanOrEqual(5);
    expect(cycle.proceduralLayer?.contestPoints.length).toBeGreaterThan(0);
    expect(cycle.proceduralLayer?.execution?.selectedProcedureIds).toContain('epistemic-routing');
    expect(cycle.proceduralLayer?.execution?.escalation?.source).toBe('engine_v2');
  });
});

