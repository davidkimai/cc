import type { SkillCondition, SkillStudyTask } from './types.js';

export const STUDY_CONDITIONS: readonly SkillCondition[] = ['no_skill', 'metadata_only', 'full_skill', 'composition'];

export function conditionsForTask(task: SkillStudyTask, requested: readonly SkillCondition[] = STUDY_CONDITIONS): SkillCondition[] {
  return requested.filter((condition) => condition !== 'composition' || Boolean(task.expectedComposition));
}

export function deterministicConditionOrder(taskId: string, conditions: readonly SkillCondition[]): SkillCondition[] {
  return [...conditions].sort((left, right) => orderKey(taskId, left) - orderKey(taskId, right));
}

function orderKey(taskId: string, condition: SkillCondition): number {
  let hash = 2166136261;
  for (const char of `${taskId}:${condition}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
