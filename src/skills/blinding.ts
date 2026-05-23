import { createHash } from 'node:crypto';

export function blindOutputId(outputId: string, salt = 'acp-skills-v3-study'): string {
  return `blind-${createHash('sha256').update(`${salt}:${outputId}`).digest('hex').slice(0, 12)}`;
}

export function blindCaseId(caseId: string, salt = 'acp-skills-v3-study'): string {
  return `case-${createHash('sha256').update(`${salt}:${caseId}`).digest('hex').slice(0, 10)}`;
}
