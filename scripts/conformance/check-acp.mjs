#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const CANONICAL_CYCLE_STATUSES = [
  'draft',
  'scheduled',
  'submission_open',
  'submission_closed',
  'routing_complete',
  'digests_released',
  'reflection_closed',
  'archived',
  'failed',
];

const CANONICAL_CONDITIONS = ['intervention', 'baseline_thread'];
const REPLAY_MODES = ['exact', 'partial', 'diagnostic-only'];

function loadJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function loadJsonl(relativePath) {
  const raw = readFileSync(path.join(repoRoot, relativePath), 'utf8').trim();
  if (!raw) return [];
  return raw.split('\n').map((line) => JSON.parse(line));
}

function addCheck(checks, scope, id, condition, message, details = undefined) {
  const check = {
    id,
    scope,
    status: condition ? 'pass' : 'fail',
    failures: condition ? [] : [message],
  };
  if (details !== undefined) {
    check.details = details;
  }
  checks.push(check);
}

function failuresFrom(checks) {
  return checks.filter((check) => check.status === 'fail').flatMap((check) => check.failures);
}

function arraysEqual(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoTimestamp(value) {
  return isNonEmptyString(value)
    && /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value));
}

function missingFields(object, fields) {
  return fields.filter((field) => object?.[field] === undefined || object?.[field] === null);
}

function checkRequiredFields(checks, scope, id, object, fields) {
  const missing = missingFields(object, fields);
  addCheck(
    checks,
    scope,
    id,
    missing.length === 0,
    `${id}: missing required field(s): ${missing.join(', ')}`,
    missing.length > 0 ? { missingFields: missing } : undefined,
  );
}

function checkUniqueField(checks, scope, id, records, field) {
  const values = (records ?? []).map((record) => record?.[field]).filter(Boolean);
  addCheck(
    checks,
    scope,
    id,
    values.length === new Set(values).size,
    `${id}: duplicate ${field} value`,
  );
}

function checkTimestampField(checks, scope, id, object, field) {
  addCheck(
    checks,
    scope,
    id,
    isIsoTimestamp(object?.[field]),
    `${id}: ${field} must be an ISO 8601 timestamp with timezone`,
  );
}

function countEvents(events) {
  return {
    audit_event: events.filter((event) => event.record_type === 'audit_event').length,
    telemetry_event: events.filter((event) => event.record_type === 'telemetry_event').length,
  };
}

function hasAudit(events, eventType) {
  return events.some((entry) => entry.record_type === 'audit_event' && entry.event?.event_type === eventType);
}

function checkSchemaBundle() {
  const checks = [];
  const schema = loadJson('protocol/acp-canonical.schema.json');
  const interventionExample = loadJson('protocol/examples/intervention-cycle.example.json');
  const baselineExample = loadJson('protocol/examples/baseline-cycle.example.json');
  const defs = schema.$defs ?? {};

  addCheck(checks, 'schema_bundle', 'schema.defs.present', Boolean(schema.$defs && typeof schema.$defs === 'object'), 'schema bundle is missing $defs');
  for (const def of [
    'CycleRecord',
    'Participant',
    'Contribution',
    'RoutingDecision',
    'Digest',
    'DigestItem',
    'ResponseRecord',
    'TelemetryEvent',
    'AuditEvent',
    'ExportArtifact',
    'CycleMetrics',
  ]) {
    addCheck(checks, 'schema_bundle', `schema.defs.${def}`, Boolean(defs[def]), `schema bundle missing $defs.${def}`);
  }

  addCheck(
    checks,
    'schema_bundle',
    'schema.enum.CycleStatus.canonical',
    arraysEqual(defs.CycleStatus?.enum, CANONICAL_CYCLE_STATUSES),
    'CycleStatus enum does not match canonical ACP lifecycle vocabulary',
    { expected: CANONICAL_CYCLE_STATUSES, actual: defs.CycleStatus?.enum ?? null },
  );
  addCheck(
    checks,
    'schema_bundle',
    'schema.enum.CycleCondition.canonical',
    arraysEqual(defs.CycleCondition?.enum, CANONICAL_CONDITIONS),
    'CycleCondition enum does not match canonical ACP conditions',
    { expected: CANONICAL_CONDITIONS, actual: defs.CycleCondition?.enum ?? null },
  );
  addCheck(
    checks,
    'schema_bundle',
    'schema.enum.OperatorEventType.routing_completed-preserved',
    (defs.OperatorEventType?.enum ?? []).includes('routing_completed'),
    'OperatorEventType must preserve routing_completed as event vocabulary',
  );
  addCheck(
    checks,
    'schema_bundle',
    'schema.examples.intervention.condition',
    interventionExample.condition === 'intervention',
    'intervention example has wrong condition',
  );
  addCheck(
    checks,
    'schema_bundle',
    'schema.examples.baseline.condition',
    baselineExample.condition === 'baseline_thread',
    'baseline example has wrong condition',
  );
  addCheck(
    checks,
    'schema_bundle',
    'schema.examples.intervention.routingDecisions-array',
    Array.isArray(interventionExample.routingDecisions),
    'intervention example missing routingDecisions',
  );
  addCheck(
    checks,
    'schema_bundle',
    'schema.examples.baseline.routingDecisions-array',
    Array.isArray(baselineExample.routingDecisions),
    'baseline example missing routingDecisions',
  );

  return {
    scope: 'schema_bundle',
    status: checks.every((check) => check.status === 'pass') ? 'pass' : 'fail',
    failures: failuresFrom(checks),
    checks,
  };
}

function checkReplayReferences(checks, scope, state) {
  const cycleId = state.cycle?.cycle_id;
  const participantIds = new Set((state.participants ?? []).map((item) => item.participant_id));
  const contributionIds = new Set((state.contributions ?? []).map((item) => item.contribution_id));

  for (const contribution of state.contributions ?? []) {
    addCheck(
      checks,
      scope,
      `${scope}.reference.contribution.${contribution.contribution_id}.cycle`,
      contribution.cycle_id === cycleId,
      `contribution ${contribution.contribution_id} has wrong cycle_id`,
    );
    addCheck(
      checks,
      scope,
      `${scope}.reference.contribution.${contribution.contribution_id}.participant`,
      participantIds.has(contribution.participant_id),
      `contribution ${contribution.contribution_id} references unknown participant`,
    );
  }

  for (const decision of state.routing_decisions ?? []) {
    addCheck(
      checks,
      scope,
      `${scope}.reference.routing_decision.${decision.routing_decision_id}.cycle`,
      decision.cycle_id === cycleId,
      `routing decision ${decision.routing_decision_id} has wrong cycle_id`,
    );
    addCheck(
      checks,
      scope,
      `${scope}.reference.routing_decision.${decision.routing_decision_id}.recipient`,
      participantIds.has(decision.recipient_id),
      `routing decision ${decision.routing_decision_id} references unknown recipient`,
    );
    addCheck(
      checks,
      scope,
      `${scope}.reference.routing_decision.${decision.routing_decision_id}.contribution`,
      contributionIds.has(decision.contribution_id),
      `routing decision ${decision.routing_decision_id} references unknown contribution`,
    );
  }

  for (const digest of state.digests ?? []) {
    addCheck(
      checks,
      scope,
      `${scope}.reference.digest.${digest.digest_id}.cycle`,
      digest.cycle_id === cycleId,
      `digest ${digest.digest_id} has wrong cycle_id`,
    );
    addCheck(
      checks,
      scope,
      `${scope}.reference.digest.${digest.digest_id}.recipient`,
      participantIds.has(digest.recipient_id),
      `digest ${digest.digest_id} references unknown recipient`,
    );
    for (const item of digest.items ?? []) {
      addCheck(
        checks,
        scope,
        `${scope}.reference.digest.${digest.digest_id}.item.${item.contribution_id}`,
        contributionIds.has(item.contribution_id),
        `digest ${digest.digest_id} references unknown contribution ${item.contribution_id}`,
      );
    }
  }

  for (const response of state.responses ?? []) {
    addCheck(
      checks,
      scope,
      `${scope}.reference.response.${response.response_id}.cycle`,
      response.cycle_id === cycleId,
      `response ${response.response_id} has wrong cycle_id`,
    );
    addCheck(
      checks,
      scope,
      `${scope}.reference.response.${response.response_id}.participant`,
      participantIds.has(response.participant_id),
      `response ${response.response_id} references unknown participant`,
    );
    addCheck(
      checks,
      scope,
      `${scope}.reference.response.${response.response_id}.parent_contribution`,
      contributionIds.has(response.parent_contribution_id),
      `response ${response.response_id} references unknown parent contribution`,
    );
  }
}

function checkReplayObjectShapes(checks, scope, state, events) {
  const cycle = state.cycle ?? {};
  checkRequiredFields(checks, scope, `${scope}.state.required-fields`, state, ['acp_protocol_version', 'cycle', 'participants', 'contributions', 'responses']);
  checkRequiredFields(checks, scope, `${scope}.cycle.required-fields`, cycle, [
    'cycle_id',
    'condition',
    'prompt_id',
    'title',
    'prompt_text',
    'status',
    'submission_open_at',
    'submission_close_at',
    'digest_release_at',
    'reflection_close_at',
    'created_by',
    'created_at',
    'config',
  ]);
  addCheck(checks, scope, `${scope}.cycle.status.canonical`, CANONICAL_CYCLE_STATUSES.includes(cycle.status), `${scope}: cycle status is not canonical`);
  addCheck(checks, scope, `${scope}.cycle.condition.canonical`, CANONICAL_CONDITIONS.includes(cycle.condition), `${scope}: cycle condition is not canonical`);

  for (const field of ['created_at', 'submission_open_at', 'submission_close_at', 'digest_release_at', 'reflection_close_at']) {
    checkTimestampField(checks, scope, `${scope}.cycle.timestamp.${field}`, cycle, field);
  }
  const lifecycleTimes = [
    cycle.created_at,
    cycle.submission_open_at,
    cycle.submission_close_at,
    cycle.digest_release_at,
    cycle.reflection_close_at,
  ].map((value) => Date.parse(value));
  addCheck(
    checks,
    scope,
    `${scope}.cycle.lifecycle-order`,
    lifecycleTimes.every(Number.isFinite) && lifecycleTimes.every((value, index) => index === 0 || value >= lifecycleTimes[index - 1]),
    `${scope}: cycle lifecycle timestamps are not ordered`,
  );

  addCheck(checks, scope, `${scope}.participants.array`, Array.isArray(state.participants), `${scope}: participants must be an array`);
  addCheck(checks, scope, `${scope}.participants.non-empty`, (state.participants ?? []).length > 0, `${scope}: participants must not be empty`);
  checkUniqueField(checks, scope, `${scope}.participants.unique`, state.participants ?? [], 'participant_id');
  for (const participant of state.participants ?? []) {
    checkRequiredFields(checks, scope, `${scope}.participant.${participant.participant_id}.required-fields`, participant, [
      'participant_id',
      'display_name',
      'status',
      'consent_flags',
      'created_at',
    ]);
    checkTimestampField(checks, scope, `${scope}.participant.${participant.participant_id}.created_at`, participant, 'created_at');
  }

  addCheck(checks, scope, `${scope}.contributions.array`, Array.isArray(state.contributions), `${scope}: contributions must be an array`);
  addCheck(checks, scope, `${scope}.contributions.non-empty`, (state.contributions ?? []).length > 0, `${scope}: contributions must not be empty`);
  checkUniqueField(checks, scope, `${scope}.contributions.unique`, state.contributions ?? [], 'contribution_id');
  for (const contribution of state.contributions ?? []) {
    checkRequiredFields(checks, scope, `${scope}.contribution.${contribution.contribution_id}.required-fields`, contribution, [
      'contribution_id',
      'cycle_id',
      'participant_id',
      'body',
      'created_at',
      'submission_status',
    ]);
    checkTimestampField(checks, scope, `${scope}.contribution.${contribution.contribution_id}.created_at`, contribution, 'created_at');
  }

  checkUniqueField(checks, scope, `${scope}.routing_decisions.unique`, state.routing_decisions ?? [], 'routing_decision_id');
  for (const decision of state.routing_decisions ?? []) {
    checkRequiredFields(checks, scope, `${scope}.routing_decision.${decision.routing_decision_id}.required-fields`, decision, [
      'routing_decision_id',
      'cycle_id',
      'recipient_id',
      'contribution_id',
      'score',
      'factors',
      'bridge_flag',
      'load_cost',
      'explanation_basis',
      'created_at',
    ]);
    addCheck(checks, scope, `${scope}.routing_decision.${decision.routing_decision_id}.factors.non-empty`, Array.isArray(decision.factors) && decision.factors.length > 0, `${scope}: routing decision ${decision.routing_decision_id} must include factors`);
    addCheck(checks, scope, `${scope}.routing_decision.${decision.routing_decision_id}.bridge_flag.boolean`, typeof decision.bridge_flag === 'boolean', `${scope}: routing decision ${decision.routing_decision_id} bridge_flag must be boolean`);
    checkTimestampField(checks, scope, `${scope}.routing_decision.${decision.routing_decision_id}.created_at`, decision, 'created_at');
  }

  checkUniqueField(checks, scope, `${scope}.digests.unique`, state.digests ?? [], 'digest_id');
  for (const digest of state.digests ?? []) {
    checkRequiredFields(checks, scope, `${scope}.digest.${digest.digest_id}.required-fields`, digest, [
      'digest_id',
      'cycle_id',
      'recipient_id',
      'items',
      'summary',
      'routing_explanations',
      'estimated_read_time',
      'created_at',
      'released_at',
    ]);
    addCheck(checks, scope, `${scope}.digest.${digest.digest_id}.items.non-empty`, Array.isArray(digest.items) && digest.items.length > 0, `${scope}: digest ${digest.digest_id} must include items`);
    addCheck(checks, scope, `${scope}.digest.${digest.digest_id}.routing_explanations.non-empty`, Array.isArray(digest.routing_explanations) && digest.routing_explanations.length > 0, `${scope}: digest ${digest.digest_id} must include routing_explanations`);
    checkTimestampField(checks, scope, `${scope}.digest.${digest.digest_id}.created_at`, digest, 'created_at');
    checkTimestampField(checks, scope, `${scope}.digest.${digest.digest_id}.released_at`, digest, 'released_at');
    for (const [index, item] of (digest.items ?? []).entries()) {
      checkRequiredFields(checks, scope, `${scope}.digest.${digest.digest_id}.item.${index}.required-fields`, item, [
        'contribution_id',
        'author_label',
        'body',
        'explanation_text',
        'bridge_flag',
      ]);
      addCheck(checks, scope, `${scope}.digest.${digest.digest_id}.item.${index}.explanation_text.non-empty`, isNonEmptyString(item.explanation_text), `${scope}: digest ${digest.digest_id} item ${index} explanation_text must be non-empty`);
      addCheck(checks, scope, `${scope}.digest.${digest.digest_id}.item.${index}.bridge_flag.boolean`, typeof item.bridge_flag === 'boolean', `${scope}: digest ${digest.digest_id} item ${index} bridge_flag must be boolean`);
    }
  }

  checkUniqueField(checks, scope, `${scope}.responses.unique`, state.responses ?? [], 'response_id');
  for (const response of state.responses ?? []) {
    checkRequiredFields(checks, scope, `${scope}.response.${response.response_id}.required-fields`, response, [
      'response_id',
      'cycle_id',
      'participant_id',
      'body',
      'created_at',
      'parent_contribution_id',
    ]);
    checkTimestampField(checks, scope, `${scope}.response.${response.response_id}.created_at`, response, 'created_at');
  }

  for (const [index, entry] of events.entries()) {
    addCheck(checks, scope, `${scope}.event.${index}.record_type`, ['audit_event', 'telemetry_event'].includes(entry.record_type), `${scope}: event ${index} has invalid record_type`);
    checkRequiredFields(checks, scope, `${scope}.event.${index}.common-fields`, entry.event, ['event_id', 'cycle_id', 'event_type', 'created_at']);
    addCheck(checks, scope, `${scope}.event.${index}.cycle-reference`, entry.event?.cycle_id === cycle.cycle_id, `${scope}: event ${index} has wrong cycle_id`);
    checkTimestampField(checks, scope, `${scope}.event.${index}.created_at`, entry.event ?? {}, 'created_at');
    if (entry.record_type === 'audit_event') {
      checkRequiredFields(checks, scope, `${scope}.event.${index}.audit-fields`, entry.event, ['actor_type', 'actor_id', 'payload']);
    }
    if (entry.record_type === 'telemetry_event') {
      checkRequiredFields(checks, scope, `${scope}.event.${index}.telemetry-fields`, entry.event, ['participant_id', 'metadata']);
    }
  }
}

function checkReplayCase(relativePath, manifestCase, protocolVersion) {
  const checks = [];
  const scope = `replay_case.${manifestCase.case_id}`;
  const state = loadJson(path.join(relativePath, 'state.json'));
  const events = loadJsonl(path.join(relativePath, 'events.jsonl'));
  const expected = loadJson(path.join(relativePath, 'replay_expected.json'));
  const cycle = state.cycle ?? {};
  const eventCounts = countEvents(events);

  addCheck(checks, scope, `${scope}.manifest.condition`, CANONICAL_CONDITIONS.includes(manifestCase.condition), `${manifestCase.case_id}: manifest condition is not canonical`);
  addCheck(checks, scope, `${scope}.manifest.replay_mode`, REPLAY_MODES.includes(manifestCase.replay_mode), `${manifestCase.case_id}: manifest replay mode is invalid`);
  addCheck(checks, scope, `${scope}.version.state`, state.acp_protocol_version === protocolVersion, `${manifestCase.case_id}: state protocol version mismatch`);
  addCheck(checks, scope, `${scope}.version.expected`, expected.acp_protocol_version === protocolVersion, `${manifestCase.case_id}: expected protocol version mismatch`);
  addCheck(checks, scope, `${scope}.expected.case_id`, expected.case_id === manifestCase.case_id, `${manifestCase.case_id}: expected case_id mismatch`);
  addCheck(checks, scope, `${scope}.condition.state`, cycle.condition === manifestCase.condition, `${manifestCase.case_id}: state condition mismatch`);
  addCheck(checks, scope, `${scope}.condition.expected`, expected.condition === manifestCase.condition, `${manifestCase.case_id}: expected condition mismatch`);
  addCheck(checks, scope, `${scope}.replay_mode.expected`, expected.replay_mode === manifestCase.replay_mode, `${manifestCase.case_id}: replay mode mismatch`);
  addCheck(checks, scope, `${scope}.expected.status`, expected.status === 'pass', `${manifestCase.case_id}: expected status must be pass`);

  checkReplayObjectShapes(checks, scope, state, events);
  checkReplayReferences(checks, scope, state);

  const objectCounts = {
    cycle: cycle.cycle_id ? 1 : 0,
    participant: (state.participants ?? []).length,
    contribution: (state.contributions ?? []).length,
    routing_decision: (state.routing_decisions ?? []).length,
    digest: (state.digests ?? []).length,
    response: (state.responses ?? []).length,
  };

  for (const [key, value] of Object.entries(expected.object_counts ?? {})) {
    addCheck(checks, scope, `${scope}.object_count.${key}`, objectCounts[key] === value, `${manifestCase.case_id}: object count mismatch for ${key}`, { expected: value, actual: objectCounts[key] ?? null });
  }
  for (const [key, value] of Object.entries(expected.event_counts ?? {})) {
    addCheck(checks, scope, `${scope}.event_count.${key}`, eventCounts[key] === value, `${manifestCase.case_id}: event count mismatch for ${key}`, { expected: value, actual: eventCounts[key] ?? null });
  }

  for (const eventType of ['cycle_created', 'cycle_opened', 'submissions_closed', 'digests_released', 'cycle_archived']) {
    addCheck(checks, scope, `${scope}.audit.${eventType}`, hasAudit(events, eventType), `${manifestCase.case_id}: missing ${eventType} audit event`);
  }

  if (manifestCase.condition === 'intervention') {
    addCheck(checks, scope, `${scope}.intervention.routing_decisions.present`, objectCounts.routing_decision > 0, `${manifestCase.case_id}: intervention case missing routing decisions`);
    addCheck(checks, scope, `${scope}.intervention.digests.present`, objectCounts.digest > 0, `${manifestCase.case_id}: intervention case missing digests`);
    addCheck(checks, scope, `${scope}.intervention.bridge_item.present`, (state.digests ?? []).some((digest) => (digest.items ?? []).some((item) => item.bridge_flag === true)), `${manifestCase.case_id}: intervention case missing bridge digest item`);
    for (const eventType of ['routing_started', 'routing_completed', 'digest_generated']) {
      addCheck(checks, scope, `${scope}.intervention.audit.${eventType}`, hasAudit(events, eventType), `${manifestCase.case_id}: intervention case missing ${eventType}`);
    }
  }

  if (manifestCase.condition === 'baseline_thread') {
    addCheck(checks, scope, `${scope}.baseline.routing_decisions.absent`, objectCounts.routing_decision === 0, `${manifestCase.case_id}: baseline case must not contain routing decisions`);
    addCheck(checks, scope, `${scope}.baseline.digests.absent`, objectCounts.digest === 0, `${manifestCase.case_id}: baseline case must not contain digests`);
  }

  return {
    scope: 'replay_case',
    caseId: manifestCase.case_id,
    condition: manifestCase.condition,
    replayMode: manifestCase.replay_mode,
    status: checks.every((check) => check.status === 'pass') ? 'pass' : 'fail',
    failures: failuresFrom(checks),
    objectCounts,
    eventCounts,
    checks,
  };
}

export function runAcpChecks() {
  const manifest = loadJson('fixtures/replay/manifest.json');
  const protocolVersion = manifest.acp_protocol_version;
  const schemaBundle = checkSchemaBundle();
  const replayCases = (manifest.cases ?? []).map((entry) => checkReplayCase(entry.path, entry, protocolVersion));
  const checks = [
    ...schemaBundle.checks,
    ...replayCases.flatMap((entry) => entry.checks),
  ];
  const passed = checks.filter((check) => check.status === 'pass').length;
  const failed = checks.length - passed;

  return {
    protocolVersion,
    generatedAt: new Date().toISOString(),
    status: failed === 0 ? 'pass' : 'fail',
    summary: {
      totalChecks: checks.length,
      passed,
      failed,
    },
    checks,
    results: checks,
    schemaBundle,
    replayCases,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runAcpChecks();
  const asJson = process.argv.includes('--json');
  if (asJson) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`ACP conformance: ${report.status}\n`);
    process.stdout.write(`ACP version: ${report.protocolVersion}\n`);
    process.stdout.write(`Checks: ${report.summary.passed}/${report.summary.totalChecks} passed\n`);
    process.stdout.write(`Schema bundle: ${report.schemaBundle.status}\n`);
    for (const item of report.replayCases) {
      process.stdout.write(`- ${item.caseId}: ${item.status} (${item.condition}, ${item.replayMode}; ${item.checks.filter((check) => check.status === 'pass').length}/${item.checks.length} checks)\n`);
      if (item.failures.length > 0) {
        for (const failure of item.failures) {
          process.stdout.write(`  * ${failure}\n`);
        }
      }
    }
  }
  if (report.status !== 'pass') {
    process.exitCode = 1;
  }
}
