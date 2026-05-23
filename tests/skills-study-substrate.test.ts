import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { evaluateAdherence } from '../src/skills/adherence.js';
import { blindOutputId } from '../src/skills/blinding.js';
import { conditionsForTask, deterministicConditionOrder } from '../src/skills/conditions.js';
import { materializeCondition } from '../src/skills/materialize.js';
import { loadSkillPackageMap } from '../src/skills/registry.js';
import type { SkillStudyOutput, SkillStudyTask } from '../src/skills/types.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function studyTask(taskId: string): Promise<SkillStudyTask> {
  const tasks = JSON.parse(await readFile(path.join(repoRoot, 'evals/skills/studies/v3-study-program.json'), 'utf8'));
  for (const sourceFile of tasks.studyA.sourceFiles) {
    const sourceTasks = JSON.parse(await readFile(path.join(repoRoot, sourceFile), 'utf8')) as SkillStudyTask[];
    const task = sourceTasks.find((candidate) => candidate.id === taskId);
    if (task) return task;
  }
  throw new Error(`Missing task ${taskId}`);
}

describe('Skills V3 study substrate', () => {
  it('loads the canonical skill registry without making src/skills a second content source', async () => {
    const packages = await loadSkillPackageMap(repoRoot);
    expect(packages.size).toBeGreaterThanOrEqual(17);
    expect(packages.get('epistemic-routing')?.manifestData.summary).toBeTruthy();
    expect(packages.get('digest-and-explanation')?.manifest).toContain('skills/packages/digest-and-explanation');
  });

  it('materializes no-skill, metadata, full-skill, and composition conditions with increasing exposure', async () => {
    const task = await studyTask('public-hearing-001');
    const noSkill = await materializeCondition(task, 'no_skill', repoRoot);
    const metadata = await materializeCondition(task, 'metadata_only', repoRoot);
    const fullSkill = await materializeCondition(task, 'full_skill', repoRoot);
    const composition = await materializeCondition(task, 'composition', repoRoot);

    expect(noSkill.context).toEqual({});
    expect(metadata.context.skillMetadata).toBeTruthy();
    expect(String(JSON.stringify(metadata.context))).not.toContain('## Workflow');
    expect(fullSkill.context.skillContexts).toBeTruthy();
    expect(JSON.stringify(fullSkill.context)).toContain('excerpt');
    expect(composition.context.composition).toBeTruthy();
    expect(composition.materializedFrom.some((item) => item.includes('skills/compositions'))).toBe(true);
  });

  it('keeps deterministic condition ordering stable and omits composition when it does not apply', async () => {
    const compositionTask = await studyTask('public-hearing-001');
    const nonCompositionTask = await studyTask('routing-selection-001');

    expect(deterministicConditionOrder(compositionTask.id, conditionsForTask(compositionTask))).toEqual(
      deterministicConditionOrder(compositionTask.id, conditionsForTask(compositionTask)),
    );
    expect(conditionsForTask(compositionTask)).toContain('composition');
    expect(conditionsForTask(nonCompositionTask)).not.toContain('composition');
  });

  it('tracks assigned-vs-received condition adherence and prohibited leakage', async () => {
    const task = await studyTask('routing-selection-001');
    const leakedOutput: SkillStudyOutput = {
      outputId: `${task.id}--no_skill`,
      caseId: task.id,
      family: task.family,
      caseType: task.caseType,
      assignedCondition: 'no_skill',
      model: 'test',
      status: 'generated',
      output: {
        selectedSkill: 'epistemic-routing',
        selectedComposition: null,
        producedArtifacts: task.artifactExpectations ?? [],
      },
    };
    const adherence = evaluateAdherence(task, leakedOutput);
    expect(adherence.conditionAdhered).toBe(false);
    expect(adherence.prohibitedSkillLeakage).toBe(true);
    expect(adherence.deviationReasons).toContain('assigned condition not followed by selected skill/composition');
  });

  it('creates stable blind IDs that do not expose condition names', () => {
    const blindA = blindOutputId('study-a-experimental:routing-selection-001--full_skill');
    const blindB = blindOutputId('study-a-experimental:routing-selection-001--full_skill');
    expect(blindA).toBe(blindB);
    expect(blindA).toMatch(/^blind-[a-f0-9]{12}$/);
    expect(blindA).not.toContain('full_skill');
  });
});
