import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadCompositionContext } from './compositions.js';
import { loadSkillPackageMap } from './registry.js';
import type { NormalizedSkillPackage, SkillCondition, SkillConditionMaterial, SkillStudyTask } from './types.js';

const NON_CLAIM_BOUNDARY = [
  'Do not claim real-world civic efficacy.',
  'Do not claim fairness solved.',
  'Do not claim institutional legitimacy.',
  'Do not claim field readiness.',
];

export async function materializeCondition(task: SkillStudyTask, condition: SkillCondition, repoRoot = process.cwd()): Promise<SkillConditionMaterial> {
  const base = {
    taskId: task.id,
    family: task.family,
    caseType: task.caseType,
    prompt: task.prompt,
    availableCandidateNames: task.candidateSkills ?? [],
    nonClaimBoundary: NON_CLAIM_BOUNDARY,
  };
  if (condition === 'no_skill') {
    return {
      assignedCondition: condition,
      instruction: 'No ACP skill documentation is available. Solve using only general reasoning and the task prompt.',
      task: base,
      context: {},
      materializedFrom: [],
    };
  }

  const packages = await loadSkillPackageMap(repoRoot);
  const selected = (task.candidateSkills ?? [])
    .map((name) => packages.get(name))
    .filter((pkg): pkg is NormalizedSkillPackage => Boolean(pkg));
  const skillMetadata = selected.map((pkg) => ({
    name: pkg.name,
    category: pkg.category,
    maturity: pkg.maturity,
    summary: pkg.manifestData.summary,
    useWhen: pkg.manifestData.useWhen,
    dontUseWhen: pkg.manifestData.dontUseWhen,
  }));

  if (condition === 'metadata_only') {
    return {
      assignedCondition: condition,
      instruction: 'Only skill metadata is available. Do not assume access to full procedures, examples, checklists, or evaluation hooks.',
      task: base,
      context: { skillMetadata },
      materializedFrom: selected.map((pkg) => pkg.manifest),
    };
  }

  const skillContexts = await Promise.all(selected.map(async (pkg) => {
    const skillFile = pkg.manifestData.skillFile;
    const excerpt = skillFile ? (await readFile(path.join(repoRoot, skillFile), 'utf8')).slice(0, 6500) : '';
    return {
      name: pkg.name,
      category: pkg.category,
      maturity: pkg.maturity,
      manifestPath: pkg.manifest,
      skillFile,
      summary: pkg.manifestData.summary,
      useWhen: pkg.manifestData.useWhen,
      dontUseWhen: pkg.manifestData.dontUseWhen,
      excerpt,
    };
  }));

  if (condition === 'full_skill') {
    return {
      assignedCondition: condition,
      instruction: 'Full candidate skill documentation is available. Use it if relevant, and reject it if this is a negative-control task.',
      task: base,
      context: { skillContexts },
      materializedFrom: skillContexts.map((ctx) => String(ctx.skillFile ?? ctx.manifestPath)),
    };
  }

  const composition = await loadCompositionContext(task.expectedComposition, repoRoot);
  return {
    assignedCondition: condition,
    instruction: 'A composition workflow is available for this task. Use the composition to coordinate skills and evidence surfaces.',
    task: base,
    context: { composition, skillContexts },
    materializedFrom: [
      ...(composition ? [`skills/compositions/${composition.name}`] : []),
      ...skillContexts.map((ctx) => String(ctx.skillFile ?? ctx.manifestPath)),
    ],
  };
}
