#!/usr/bin/env tsx
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { conditionsForTask, deterministicConditionOrder } from '../../src/skills/conditions.ts';
import { materializeCondition } from '../../src/skills/materialize.ts';
import type { SkillCondition, SkillStudyTask } from '../../src/skills/types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const DEFAULT_OUT = path.join(repoRoot, 'artifacts', 'tmp', 'inspect', 'exports', 'skills-measured.json');
const TASK_SOURCE = path.join(repoRoot, 'evals', 'skills', 'tasks', 'v3-measured-heldout.json');

interface ExportRecord {
  id: string;
  input: string;
  target: string;
  metadata: Record<string, unknown>;
}

function parseArgs(argv: string[]) {
  const flags: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = 'true';
    }
  }
  const requested = (flags.conditions ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean) as SkillCondition[];
  return {
    outPath: path.resolve(repoRoot, flags.out ?? DEFAULT_OUT),
    requestedConditions: requested,
  };
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T;
}

function repoRelative(filePath: string): string {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function asJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function renderPrompt(task: SkillStudyTask, condition: SkillCondition, material: Awaited<ReturnType<typeof materializeCondition>>): string {
  return [
    'You are operating inside ACP\'s Inspect AI mirror for procedural workflow evaluation.',
    'This is a civic / procedural task about bounded-attention public reasoning, not a general marketing or persuasion task.',
    'Return one strict JSON object only with these fields:',
    '{',
    '  "decision": "use_skill" | "do_not_use" | "escalate" | "abstain" | "package_evidence",',
    '  "selectedSkill": string,',
    '  "selectedComposition": string | null,',
    '  "escalation": boolean,',
    '  "detectedFailures": string[],',
    '  "rejectedClaims": string[],',
    '  "producedArtifacts": string[],',
    '  "rationale": string,',
    '  "confidence": number',
    '}',
    '',
    'Preserve ACP claim boundaries:',
    '- Do not claim real-world civic efficacy.',
    '- Do not claim fairness solved.',
    '- Do not claim institutional legitimacy.',
    '- Do not claim field readiness.',
    '',
    `Task id: ${task.id}`,
    `Family: ${task.family}`,
    `Case type: ${task.caseType}`,
    `Assigned condition: ${condition}`,
    `Prompt: ${task.prompt}`,
    '',
    'Condition material:',
    asJson(material),
    '',
    'Evaluation key:',
    asJson({
      expectedSkill: task.expectedSkill,
      expectedComposition: task.expectedComposition ?? null,
      expectedEscalation: task.expectedEscalation ?? null,
      expectedSignals: task.expectedSignals ?? [],
      failureModes: task.failureModes ?? [],
      forbiddenClaims: task.forbiddenClaims ?? [],
      artifactExpectations: task.artifactExpectations ?? [],
    }),
  ].join('\n');
}

async function main() {
  const { outPath, requestedConditions } = parseArgs(process.argv.slice(2));
  const tasks = await readJson<SkillStudyTask[]>(TASK_SOURCE);
  const records: ExportRecord[] = [];

  for (const task of tasks) {
    const conditions = conditionsForTask(task, requestedConditions.length ? requestedConditions : undefined);
    const ordered = deterministicConditionOrder(task.id, conditions);
    for (const condition of ordered) {
      const material = await materializeCondition(task, condition, repoRoot);
      records.push({
        id: `${task.id}--${condition}`,
        input: renderPrompt(task, condition, material),
        target: task.expectedSkill,
        metadata: {
          task_id: task.id,
          family: task.family,
          case_type: task.caseType,
          condition,
          candidate_skills: task.candidateSkills ?? [],
          expected_skill: task.expectedSkill,
          expected_composition: task.expectedComposition ?? null,
          expected_escalation: task.expectedEscalation ?? null,
          expected_signals: task.expectedSignals ?? [],
          failure_modes: task.failureModes ?? [],
          forbidden_claims: task.forbiddenClaims ?? [],
          artifact_expectations: task.artifactExpectations ?? [],
          source_task_file: repoRelative(TASK_SOURCE),
          materialized_from: material.materializedFrom,
          condition_material: material,
        },
      });
    }
  }

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');

  process.stdout.write(`${JSON.stringify({
    ok: true,
    outPath: repoRelative(outPath),
    taskSource: repoRelative(TASK_SOURCE),
    taskCount: tasks.length,
    recordCount: records.length,
    conditions: [...new Set(records.map((record) => String(record.metadata.condition)))],
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
