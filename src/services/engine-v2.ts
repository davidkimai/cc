import {
  contributionUnderstandingSchema,
  defaultDeliberativeCriteria,
  digestSetCritiqueSchema,
  engineCriticSchema,
  engineEscalationSchema,
  engineV2TraceSchema,
  issueMapSchema,
  modelAuditSummarySchema,
  type Contribution,
  type ContributionUnderstanding,
  type CycleRecord,
  type DigestSetCritique,
  type EngineCritic,
  type EngineEscalation,
  type EngineIssueType,
  type EngineV2Trace,
  type IssueCluster,
  type IssueMap,
  type RoutingDecision,
} from '../core/types.js';
import { ModelRuntime } from './model-provider.js';

export const ENGINE_V2_PROMPT_VERSIONS = {
  contributionUnderstanding: 'engine-v2.contribution-understanding.v1',
  pairwiseRoutingJudge: 'engine-v2.pairwise-routing-judge.v1',
  setOptimizationCritic: 'engine-v2.set-optimization-critic.v1',
  omissionCritic: 'engine-v2.omission-critic.v1',
  fairnessCritic: 'engine-v2.fairness-critic.v1',
  explanationSynthesis: 'engine-v2.explanation-synthesis.v1',
  arbitration: 'engine-v2.arbitration.v1',
};

const ISSUE_KEYWORDS: Array<{ issueType: EngineIssueType; terms: string[]; label: string }> = [
  { issueType: 'access', label: 'Access and participation', terms: ['access', 'transit', 'mobility', 'language', 'childcare', 'accessible'] },
  { issueType: 'cost', label: 'Cost and affordability', terms: ['cost', 'rent', 'budget', 'affordable', 'fee', 'funding', 'tax'] },
  { issueType: 'equity', label: 'Equity and minority salience', terms: ['equity', 'minority', 'tenant', 'disabled', 'elder', 'student', 'worker'] },
  { issueType: 'implementation', label: 'Implementation and operations', terms: ['implement', 'timeline', 'staff', 'enforce', 'maintenance', 'monitor'] },
  { issueType: 'legitimacy', label: 'Legitimacy and trust', terms: ['trust', 'transparent', 'accountable', 'notice', 'public record', 'legitimate'] },
  { issueType: 'process', label: 'Process and procedure', terms: ['process', 'hearing', 'agenda', 'comment', 'procedure', 'review'] },
  { issueType: 'safety', label: 'Safety and risk', terms: ['safety', 'risk', 'emergency', 'hazard', 'police', 'fire'] },
  { issueType: 'unresolved_question', label: 'Unresolved questions', terms: ['question', 'unknown', 'unclear', 'whether', 'if ', 'what happens'] },
];

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 2);
}

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

function issueFor(body: string): { issueType: EngineIssueType; label: string } {
  const normalized = body.toLowerCase();
  const match = ISSUE_KEYWORDS.find((entry) => entry.terms.some((term) => normalized.includes(term)));
  return match ? { issueType: match.issueType, label: match.label } : { issueType: 'other', label: 'Other decision-relevant testimony' };
}

function stakeholderFor(body: string): string {
  const normalized = body.toLowerCase();
  if (/(tenant|resident|neighborhood|neighbor)/.test(normalized)) return 'resident';
  if (/(business|merchant|employer|developer)/.test(normalized)) return 'business_or_developer';
  if (/(student|parent|family|teacher)/.test(normalized)) return 'school_or_family';
  if (/(disabled|senior|elder|low-income|worker|minority)/.test(normalized)) return 'potentially_underrepresented';
  if (/(staff|agency|department|operator)/.test(normalized)) return 'institutional_staff';
  return 'general_public';
}

function understandingFor(contribution: Contribution, allBodies: string[]): ContributionUnderstanding {
  const body = contribution.body;
  const tokens = tokenize(body);
  const issue = issueFor(body);
  const duplicateTokens = tokens.filter((token) => allBodies.filter((other) => other.toLowerCase().includes(token)).length > 1).length;
  const novelty = tokens.length ? 1 - duplicateTokens / tokens.length : 0.5;
  const minoritySalience = /(minority|disabled|tenant|low-income|elder|worker|language|accessibility|late|buried)/i.test(body) ? 0.88 : issue.issueType === 'equity' ? 0.7 : 0.25;
  const unresolvedQuestion = /\?|\b(unknown|unclear|whether|question|what happens|how will)\b/i.test(body);
  return contributionUnderstandingSchema.parse({
    contributionId: contribution.id,
    issueType: issue.issueType,
    stakeholderType: stakeholderFor(body),
    urgency: clamp(/\b(now|urgent|before|deadline|emergency|immediate)\b/i.test(body) ? 0.82 : 0.42),
    actionability: clamp(/\b(should|must|need|recommend|require|fund|publish|delay|approve|reject)\b/i.test(body) ? 0.78 : 0.44),
    evidenceStrength: clamp(contribution.evidenceText ? 0.78 : /\b(data|study|report|because|evidence|survey)\b/i.test(body) ? 0.64 : 0.36),
    novelty: clamp(novelty),
    minoritySalience,
    publicInterestRelevance: clamp(issue.issueType === 'other' ? 0.48 : 0.76),
    distortionRisk: clamp(/\b(always|never|everyone|nobody|obvious|guarantee)\b/i.test(body) ? 0.55 : 0.18),
    unresolvedQuestion,
    summary: body.length > 150 ? `${body.slice(0, 147)}...` : body,
    tags: Array.from(new Set([issue.issueType, stakeholderFor(body), unresolvedQuestion ? 'unresolved_question' : 'claim'])),
  });
}

function buildIssueMap(records: ContributionUnderstanding[]): IssueMap {
  const grouped = new Map<EngineIssueType, ContributionUnderstanding[]>();
  for (const record of records) {
    grouped.set(record.issueType, [...(grouped.get(record.issueType) ?? []), record]);
  }
  const clusters: IssueCluster[] = Array.from(grouped.entries()).map(([issueType, entries], index) => {
    const label = ISSUE_KEYWORDS.find((item) => item.issueType === issueType)?.label ?? 'Other decision-relevant testimony';
    return {
      id: `issue_${index + 1}_${issueType}`,
      label,
      issueType,
      contributionIds: entries.map((entry) => entry.contributionId),
      summary: `${entries.length} contribution${entries.length === 1 ? '' : 's'} about ${label.toLowerCase()}.`,
      minoritySignalCount: entries.filter((entry) => entry.minoritySalience >= 0.65).length,
      unresolvedQuestionCount: entries.filter((entry) => entry.unresolvedQuestion).length,
    };
  });
  return issueMapSchema.parse({
    clusters,
    unresolvedQuestionCount: records.filter((entry) => entry.unresolvedQuestion).length,
    minoritySignalCount: records.filter((entry) => entry.minoritySalience >= 0.65).length,
  });
}

function critiqueDigestSet(cycle: CycleRecord, records: ContributionUnderstanding[], issueMap: IssueMap, decisions: RoutingDecision[]): DigestSetCritique {
  const selectedIds = new Set(decisions.map((decision) => decision.contributionId));
  const selectedClusters = new Set(
    records
      .filter((record) => selectedIds.has(record.contributionId))
      .map((record) => issueMap.clusters.find((cluster) => cluster.contributionIds.includes(record.contributionId))?.id)
      .filter(Boolean),
  );
  const missingIssueLabels = issueMap.clusters
    .filter((cluster) => !selectedClusters.has(cluster.id))
    .map((cluster) => cluster.label);
  const selectedStakeholders = new Set(records.filter((record) => selectedIds.has(record.contributionId)).map((record) => record.stakeholderType));
  const allStakeholders = new Set(records.map((record) => record.stakeholderType));
  const unresolvedTotal = records.filter((record) => record.unresolvedQuestion).length;
  const unresolvedSelected = records.filter((record) => record.unresolvedQuestion && selectedIds.has(record.contributionId)).length;
  const uniqueSelected = selectedIds.size;
  const redundancyRisk = decisions.length ? 1 - uniqueSelected / decisions.length : 0;
  return digestSetCritiqueSchema.parse({
    issueCoverageRate: issueMap.clusters.length ? clamp(selectedClusters.size / issueMap.clusters.length) : 1,
    stakeholderDiversityRate: allStakeholders.size ? clamp(selectedStakeholders.size / allStakeholders.size) : 1,
    redundancyRisk: clamp(redundancyRisk),
    unresolvedQuestionRetentionRate: unresolvedTotal ? clamp(unresolvedSelected / unresolvedTotal) : 1,
    missingIssueLabels,
    notes: [
      `Digest budget ${cycle.config.maxDigestItems} with bridge budget ${cycle.config.maxBridgeItems}.`,
      `Selected ${uniqueSelected} unique contribution${uniqueSelected === 1 ? '' : 's'} across ${selectedClusters.size} issue cluster${selectedClusters.size === 1 ? '' : 's'}.`,
    ],
  });
}

function buildCritics(issueMap: IssueMap, critique: DigestSetCritique): EngineCritic[] {
  const omissionSeverity = critique.issueCoverageRate < 0.5 ? 'high' : critique.issueCoverageRate < 0.8 ? 'medium' : 'low';
  const fairnessSeverity = issueMap.minoritySignalCount > 0 && critique.stakeholderDiversityRate < 0.6 ? 'high' : critique.stakeholderDiversityRate < 0.8 ? 'medium' : 'low';
  return [
    engineCriticSchema.parse({
      criticType: 'omission',
      severity: omissionSeverity,
      findings: critique.missingIssueLabels.length
        ? [`Missing issue clusters: ${critique.missingIssueLabels.join(', ')}.`]
        : ['No major issue cluster omission detected under the current digest budget.'],
      recommendedAction: omissionSeverity === 'high' ? 'escalate' : omissionSeverity === 'medium' ? 'revise_digest' : 'release',
    }),
    engineCriticSchema.parse({
      criticType: 'fairness',
      severity: fairnessSeverity,
      findings: [
        issueMap.minoritySignalCount > 0
          ? `${issueMap.minoritySignalCount} minority-salience signal${issueMap.minoritySignalCount === 1 ? '' : 's'} detected; bridge exposure must remain bounded and justified.`
          : 'No explicit minority-salience signal detected in this fixture.',
      ],
      recommendedAction: fairnessSeverity === 'high' ? 'escalate' : fairnessSeverity === 'medium' ? 'revise_digest' : 'release',
    }),
  ];
}

function escalationFor(critics: EngineCritic[], critique: DigestSetCritique): EngineEscalation {
  const high = critics.some((critic) => critic.severity === 'high');
  const medium = critics.some((critic) => critic.severity === 'medium');
  const confidence = clamp((critique.issueCoverageRate + critique.stakeholderDiversityRate + (1 - critique.redundancyRisk)) / 3);
  return engineEscalationSchema.parse({
    confidence,
    abstain: high || confidence < 0.45,
    recommendedAction: high || confidence < 0.45 ? 'abstain' : medium || confidence < 0.7 ? 'review' : 'release',
    reasons: [
      `Issue coverage ${critique.issueCoverageRate}.`,
      `Stakeholder diversity ${critique.stakeholderDiversityRate}.`,
      `Redundancy risk ${critique.redundancyRisk}.`,
    ],
  });
}

export async function buildEngineV2Trace(cycle: CycleRecord, decisions: RoutingDecision[]): Promise<EngineV2Trace> {
  const runtime = new ModelRuntime();
  const allBodies = cycle.contributions.map((contribution) => contribution.body);
  const contributionRecords = await Promise.all(
    cycle.contributions.map((contribution) =>
      runtime.run(
        {
          passId: 'contribution-understanding',
          promptVersion: ENGINE_V2_PROMPT_VERSIONS.contributionUnderstanding,
          model: 'gpt-5.4-mini',
          schemaName: 'ContributionUnderstanding',
          input: understandingFor(contribution, allBodies),
        },
        contributionUnderstandingSchema,
      ),
    ),
  );
  const issueMap = await runtime.run(
    {
      passId: 'set-optimization-critic',
      promptVersion: ENGINE_V2_PROMPT_VERSIONS.setOptimizationCritic,
      model: 'gpt-5.4-mini',
      schemaName: 'IssueMap',
      input: buildIssueMap(contributionRecords),
    },
    issueMapSchema,
  );
  const digestSetCritique = await runtime.run(
    {
      passId: 'set-optimization-critic',
      promptVersion: ENGINE_V2_PROMPT_VERSIONS.setOptimizationCritic,
      model: 'gpt-5.4-mini',
      schemaName: 'DigestSetCritique',
      input: critiqueDigestSet(cycle, contributionRecords, issueMap, decisions),
    },
    digestSetCritiqueSchema,
  );
  const critics = buildCritics(issueMap, digestSetCritique);
  const omission = await runtime.run(
    {
      passId: 'omission-critic',
      promptVersion: ENGINE_V2_PROMPT_VERSIONS.omissionCritic,
      model: 'gpt-5.4-mini',
      schemaName: 'EngineCritic',
      input: critics[0],
    },
    engineCriticSchema,
  );
  const fairness = await runtime.run(
    {
      passId: 'fairness-critic',
      promptVersion: ENGINE_V2_PROMPT_VERSIONS.fairnessCritic,
      model: 'gpt-5.4-mini',
      schemaName: 'EngineCritic',
      input: critics[1],
    },
    engineCriticSchema,
  );
  const escalation = await runtime.run(
    {
      passId: 'arbitration',
      promptVersion: ENGINE_V2_PROMPT_VERSIONS.arbitration,
      model: 'gpt-5.4',
      schemaName: 'EngineEscalation',
      input: escalationFor([omission, fairness], digestSetCritique),
    },
    engineEscalationSchema,
  );
  const modelAudit = modelAuditSummarySchema.parse(runtime.auditSummary());
  return engineV2TraceSchema.parse({
    engineVersion: 'engine-v2',
    engineMode: 'recursive_engine_v2',
    provider: modelAudit.provider,
    modelPolicy: {
      primaryModel: 'gpt-5.4-mini',
      arbitrationModel: 'gpt-5.4',
    },
    promptVersions: ENGINE_V2_PROMPT_VERSIONS,
    contributionRecords,
    issueMap,
    digestSetCritique,
    critics: [omission, fairness],
    escalation,
    modelAudit,
    createdAt: new Date().toISOString(),
  });
}

export function issueClusterForContribution(trace: EngineV2Trace | undefined, contributionId: string): string | undefined {
  return trace?.issueMap.clusters.find((cluster) => cluster.contributionIds.includes(contributionId))?.id;
}

export function engineWeights(cycle: CycleRecord) {
  return cycle.config.deliberativeCriteria?.length ? cycle.config.deliberativeCriteria : defaultDeliberativeCriteria;
}

