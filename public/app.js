const state = {
  session: null,
  viewMode: 'operator',
  cycles: [],
  selectedCycleId: null,
  participantCycleId: null,
  participantId: null,
  participantView: null,
  operatorDetailTab: 'overview',
  operatorError: null,
  participantError: null,
  cycleLoadError: null,
  isBootstrapping: true,
  isRefreshingCycles: false,
  isLoadingParticipantView: false,
  isRenderingOperatorDetail: false,
  draftStarted: false,
  responseStarted: false,
  caches: {
    auditEvents: new Map(),
    telemetryEvents: new Map(),
    metrics: new Map(),
    routingDecisions: new Map(),
    digests: new Map(),
    exports: new Map(),
  },
};

const els = {
  connection: document.querySelector('#connection-state'),
  route: document.querySelector('#route-state'),
  toast: document.querySelector('#toast'),
  cycleCount: document.querySelector('#cycle-count'),
  surfaceCaption: document.querySelector('#surface-caption'),
  modeOperator: document.querySelector('#mode-operator'),
  modeParticipant: document.querySelector('#mode-participant'),
  createCycleForm: document.querySelector('#create-cycle-form'),
  cycleList: document.querySelector('#cycle-list'),
  refreshCycles: document.querySelector('#refresh-cycles'),
  operatorSurface: document.querySelector('#operator-surface'),
  operatorDetail: document.querySelector('#operator-detail'),
  participantSurface: document.querySelector('#participant-surface'),
  participantCycleSelect: document.querySelector('#participant-cycle-select'),
  participantSelect: document.querySelector('#participant-select'),
  participantSelectionStatus: document.querySelector('#participant-selection-status'),
  loadParticipantView: document.querySelector('#load-participant-view'),
  participantDetail: document.querySelector('#participant-detail'),
  cycleCardTemplate: document.querySelector('#cycle-card-template'),
  digestItemTemplate: document.querySelector('#digest-item-template'),
  auditItemTemplate: document.querySelector('#audit-item-template'),
};

const detailTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'routing', label: 'Routing' },
  { id: 'digests', label: 'Digests' },
  { id: 'telemetry', label: 'Telemetry' },
  { id: 'exports', label: 'Exports' },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function showToast(message, tone = 'neutral') {
  els.toast.hidden = false;
  els.toast.textContent = message;
  els.toast.dataset.tone = tone;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.hidden = true;
  }, 2600);
}

function unwrapCycle(payload) {
  return payload?.cycle || payload;
}

function statusChipHtml(value, tone = 'neutral') {
  const normalized = String(value || 'unknown');
  let cls = 'status-chip status-chip--neutral';
  if (tone === 'accent') {
    cls = 'status-chip status-chip--accent';
  } else if (tone === 'danger') {
    cls = 'status-chip status-chip--danger';
  } else if (
    normalized.includes('open') ||
    normalized.includes('completed') ||
    normalized.includes('released') ||
    normalized === 'digest'
  ) {
    cls = 'status-chip status-chip--ok';
  } else if (normalized.includes('closed') || normalized.includes('waiting') || normalized === 'thread') {
    cls = 'status-chip status-chip--warn';
  }
  return `<span class="${cls}">${escapeHtml(normalized)}</span>`;
}

function formatNumber(value) {
  if (value == null || value === '') return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return escapeHtml(value);
  return numeric.toFixed(2);
}

function parseParticipants(text) {
  return String(text || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, name] = line.split(',').map((part) => part.trim());
      return { id, name: name || id, role: 'participant' };
    })
    .filter((participant) => participant.id);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  const payload = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })()
    : null;
  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.error || response.statusText;
    const error = new Error(message);
    error.code = payload?.code;
    throw error;
  }
  return payload;
}

function setHash(mode, cycleId = null, participantId = null) {
  if (mode === 'participant') {
    const safeCycleId = cycleId || state.participantCycleId || '';
    const safeParticipantId = participantId || state.participantId || '';
    window.location.hash = `#/participant/${safeCycleId}/${safeParticipantId}`;
    return;
  }
  const safeCycleId = cycleId || state.selectedCycleId || '';
  window.location.hash = `#/operator/${safeCycleId}`;
}

function applyHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash ? hash.split('/') : [];
  const mode = parts[0] === 'participant' ? 'participant' : 'operator';
  state.viewMode = mode;
  if (mode === 'participant') {
    state.participantCycleId = parts[1] || state.participantCycleId;
    state.participantId = parts[2] || state.participantId;
  } else {
    state.selectedCycleId = parts[1] || state.selectedCycleId;
  }
  renderSurfaceMode();
}

function cycleById(cycleId) {
  return state.cycles.find((cycle) => cycle.id === cycleId) || null;
}

function participantOptionsForCycle(cycleId) {
  const cycle = cycleById(cycleId);
  return cycle?.participants?.filter((participant) => participant.role === 'participant') || [];
}

function renderSurfaceMode() {
  const operatorActive = state.viewMode === 'operator';
  els.modeOperator.classList.toggle('is-active', operatorActive);
  els.modeOperator.setAttribute('aria-selected', String(operatorActive));
  els.modeParticipant.classList.toggle('is-active', !operatorActive);
  els.modeParticipant.setAttribute('aria-selected', String(!operatorActive));
  els.operatorSurface.hidden = !operatorActive;
  els.participantSurface.hidden = operatorActive;
  els.route.textContent = operatorActive ? `operator${state.selectedCycleId ? `:${state.selectedCycleId}` : ''}` : `participant${state.participantCycleId ? `:${state.participantCycleId}` : ''}`;
  els.surfaceCaption.textContent = operatorActive ? 'Operator workspace active.' : 'Participant workspace active.';
}

function renderCycleList() {
  els.cycleList.innerHTML = '';
  if (state.isRefreshingCycles && state.cycles.length === 0) {
    els.cycleList.innerHTML = `
      <div class="loading-card">
        <div class="loading-copy">
          <span class="loading-spinner" aria-hidden="true"></span>
          <h3>Loading cycles</h3>
          <p>Relay is syncing the shared cycle model.</p>
        </div>
      </div>
    `;
    return;
  }
  if (state.cycleLoadError && state.cycles.length === 0) {
    els.cycleList.innerHTML = `
      <div class="error-card">
        <div class="error-copy">
          <p class="eyebrow">Cycle loading failed</p>
          <h3>${escapeHtml(state.cycleLoadError)}</h3>
          <p>Refresh the cycle list once the API is reachable again.</p>
        </div>
      </div>
    `;
    return;
  }
  if (state.cycles.length === 0) {
    els.cycleList.innerHTML = `
      <div class="empty-card">
        <div class="empty-copy">
          <p class="eyebrow">No cycles yet</p>
          <h3>Create the first cycle.</h3>
          <p>Relay will show intervention and baseline cycles here once they exist.</p>
        </div>
      </div>
    `;
    return;
  }

  state.cycles.forEach((cycle) => {
    const node = els.cycleCardTemplate.content.firstElementChild.cloneNode(true);
    node.classList.toggle('is-selected', cycle.id === state.selectedCycleId || cycle.id === state.participantCycleId);
    node.querySelector('[data-role="title"]').textContent = cycle.title;
    const participantCount = cycle.participants.filter((participant) => participant.role === 'participant').length;
    node.querySelector('[data-role="meta"]').textContent = `${participantCount} participants · ${cycle.status.replaceAll('_', ' ')}`;
    node.querySelector('[data-role="condition"]').outerHTML = statusChipHtml(cycle.condition, 'accent');
    node.querySelector('[data-role="status"]').outerHTML = statusChipHtml(cycle.status);
    const activate = () => {
      if (state.viewMode === 'participant') {
        state.participantCycleId = cycle.id;
        hydrateParticipantSelectors();
        renderParticipantSelectorStatus();
        setHash('participant', cycle.id, state.participantId);
      } else {
        state.selectedCycleId = cycle.id;
        setHash('operator', cycle.id);
        renderOperatorDetail();
      }
      renderCycleList();
    };
    node.addEventListener('click', activate);
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
    els.cycleList.append(node);
  });
}

function hydrateParticipantSelectors() {
  els.participantCycleSelect.innerHTML = state.cycles
    .map((cycle) => `<option value="${escapeHtml(cycle.id)}" ${cycle.id === state.participantCycleId ? 'selected' : ''}>${escapeHtml(cycle.title)}</option>`)
    .join('');
  const participants = participantOptionsForCycle(state.participantCycleId);
  if (!participants.some((participant) => participant.id === state.participantId)) {
    state.participantId = participants[0]?.id || null;
  }
  els.participantSelect.innerHTML = participants
    .map(
      (participant) =>
        `<option value="${escapeHtml(participant.id)}" ${participant.id === state.participantId ? 'selected' : ''}>${escapeHtml(participant.name)}</option>`,
    )
    .join('');
  els.loadParticipantView.disabled = !state.participantCycleId || !state.participantId;
}

function renderParticipantSelectorStatus() {
  if (!state.participantCycleId) {
    els.participantSelectionStatus.textContent = 'Pick a cycle to load the ACP-derived participant mode.';
    return;
  }
  if (!state.participantId) {
    els.participantSelectionStatus.textContent = 'This cycle has no participant identity available yet.';
    return;
  }
  const cycle = cycleById(state.participantCycleId);
  const participant = participantOptionsForCycle(state.participantCycleId).find((item) => item.id === state.participantId);
  els.participantSelectionStatus.textContent = participant
    ? `${participant.name} will load against ${cycle?.condition === 'baseline_thread' ? 'Baseline Thread' : 'Intervention'} mode rules.`
    : 'Pick a participant to continue.';
}

function renderSharedStatus() {
  const total = state.cycles.length;
  els.cycleCount.textContent = total === 0 ? 'No cycles loaded.' : `${total} cycle${total === 1 ? '' : 's'} loaded.`;
  renderSurfaceMode();
  renderCycleList();
  hydrateParticipantSelectors();
  renderParticipantSelectorStatus();
}

async function bootstrap() {
  state.isBootstrapping = true;
  state.isRefreshingCycles = true;
  try {
    state.session = await api('/v1/session');
    els.connection.textContent = 'Connected';
    els.connection.className = 'status-chip status-chip--ok';
    applyHash();
    await loadCycles({ preserveSelection: true });
  } catch (error) {
    els.connection.textContent = 'Disconnected';
    els.connection.className = 'status-chip status-chip--danger';
    state.cycleLoadError = error.message;
    renderSharedStatus();
    renderOperatorDetail();
    renderParticipantView();
    showToast(error.message, 'danger');
  } finally {
    state.isBootstrapping = false;
    state.isRefreshingCycles = false;
  }
}

async function loadCycles({ preserveSelection = false } = {}) {
  state.isRefreshingCycles = true;
  state.cycleLoadError = null;
  renderSharedStatus();
  try {
    const payload = await api('/v1/cycles');
    state.cycles = payload.cycles || [];
    if (!preserveSelection || !cycleById(state.selectedCycleId)) {
      state.selectedCycleId = state.selectedCycleId && cycleById(state.selectedCycleId) ? state.selectedCycleId : state.cycles[0]?.id || null;
    }
    if (!state.selectedCycleId && state.cycles[0]) {
      state.selectedCycleId = state.cycles[0].id;
    }
    if (!state.participantCycleId || !cycleById(state.participantCycleId)) {
      state.participantCycleId = state.cycles[0]?.id || null;
    }
    hydrateParticipantSelectors();
    renderSharedStatus();
    await renderOperatorDetail();
  } catch (error) {
    state.cycleLoadError = error.message;
    renderSharedStatus();
    renderOperatorDetail();
    throw error;
  } finally {
    state.isRefreshingCycles = false;
    renderSharedStatus();
  }
}

function actionConfig(cycle) {
  return [
    { label: 'Open submissions', path: `/v1/cycles/${cycle.id}/open`, enabled: cycle.status === 'draft', tone: 'default' },
    {
      label: 'Close submissions',
      path: `/v1/cycles/${cycle.id}/close-submissions`,
      enabled: cycle.status === 'submission_open',
      tone: 'warn',
    },
    {
      label: 'Run routing',
      path: `/v1/cycles/${cycle.id}/routing`,
      enabled: cycle.condition === 'intervention' && cycle.status === 'submission_closed',
      tone: 'default',
    },
    {
      label: 'Release outputs',
      path: `/v1/cycles/${cycle.id}/release`,
      enabled:
        (cycle.condition === 'intervention' && cycle.status === 'routing_completed') ||
        (cycle.condition === 'baseline_thread' && cycle.status === 'submission_closed'),
      tone: 'default',
    },
    {
      label: 'Close reflection',
      path: `/v1/cycles/${cycle.id}/close-reflection`,
      enabled: cycle.status === 'digests_released',
      tone: 'warn',
    },
    {
      label: 'Archive',
      path: `/v1/cycles/${cycle.id}/archive`,
      enabled: cycle.status === 'reflection_closed',
      tone: 'danger',
    },
    { label: 'Replay', path: `/v1/cycles/${cycle.id}/replay`, enabled: true, tone: 'ghost' },
  ];
}

async function readInspection(path, fallbackKey) {
  try {
    return await api(path);
  } catch (error) {
    return { [fallbackKey]: [], __error: error.message };
  }
}

function operatorLoadingMarkup() {
  return `
    <div class="loading-copy">
      <span class="loading-spinner" aria-hidden="true"></span>
      <div>
        <p class="eyebrow">Operator detail</p>
        <h3>Loading cycle detail</h3>
        <p>Relay is resolving audit, telemetry, routing, digest, and export state.</p>
      </div>
    </div>
  `;
}

function renderInspectionTabButtons() {
  return detailTabs
    .map(
      (tab) =>
        `<button class="button ${state.operatorDetailTab === tab.id ? '' : 'button--ghost'}" type="button" data-detail-tab="${tab.id}">${tab.label}</button>`,
    )
    .join('');
}

function renderOperatorOverview(cycle) {
  const auditEvents = state.caches.auditEvents.get(cycle.id) || [];
  const metrics = state.caches.metrics.get(cycle.id) || null;
  const telemetryEvents = state.caches.telemetryEvents.get(cycle.id) || [];
  const routingDecisions = state.caches.routingDecisions.get(cycle.id) || [];
  const digests = state.caches.digests.get(cycle.id) || [];
  const exports = state.caches.exports.get(cycle.id) || [];
  const metricCards = [
    ['Exposure Gini', metrics?.exposureConcentrationGini],
    ['Reply Gini', metrics?.replyConcentrationGini],
    ['Coverage', metrics?.averageContributorCoverage],
    ['Bridge rate', metrics?.bridgeExposureRate],
    ['Explanation rate', metrics?.explanationEngagementRate],
    ['Abandonment', metrics?.abandonmentRate],
  ]
    .map(([label, value]) => `<article class="metric-card"><span>${label}</span><strong>${formatNumber(value)}</strong></article>`)
    .join('');
  const summaries = [
    ['Audit events', auditEvents.length],
    ['Telemetry events', telemetryEvents.length],
    ['Routing decisions', routingDecisions.length],
    ['Digests', digests.length],
    ['Exports', exports.length],
  ]
    .map(
      ([label, value]) =>
        `<article class="summary-card"><h4>${escapeHtml(label)}</h4><p>${escapeHtml(value)}</p></article>`,
    )
    .join('');
  const recentAudit = auditEvents
    .slice()
    .reverse()
    .slice(0, 5)
    .map((event) => {
      const node = els.auditItemTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector('[data-role="action"]').textContent = event.action;
      node.querySelector('[data-role="meta"]').textContent = `${event.createdAt} · ${event.actorType}:${event.actorId}`;
      return node.outerHTML;
    })
    .join('');

  return `
    <div class="detail-stack">
      <div class="metric-grid">${metricCards}</div>
      <div class="inspection-grid">${summaries}</div>
      <div class="inline-message inline-message--info">
        <p class="eyebrow">Condition-aware release logic</p>
        <h4>${cycle.condition === 'intervention' ? 'Intervention cycles require routing before release.' : 'Baseline thread cycles release without routing.'}</h4>
        <p>${cycle.condition === 'intervention' ? 'Operators can inspect routing and explanation outputs before releasing digests.' : 'Relay preserves the same cycle shell while making clear that baseline thread items were not intentionally routed.'}</p>
      </div>
      <div>
        <p class="eyebrow">Recent audit</p>
        <ul class="audit-list">${recentAudit || '<li class="empty-card"><div class="empty-copy"><h3>No audit events yet.</h3><p>Lifecycle changes will appear here.</p></div></li>'}</ul>
      </div>
    </div>
  `;
}

function renderRoutingTab(cycle) {
  const routingDecisions = state.caches.routingDecisions.get(cycle.id) || [];
  if (cycle.condition !== 'intervention') {
    return `
      <div class="inline-message inline-message--warn">
        <p class="eyebrow">Baseline thread</p>
        <h4>No routing inspection for this condition.</h4>
        <p>Baseline thread cycles intentionally avoid routed delivery and explanation logic.</p>
      </div>
    `;
  }
  if (routingDecisions.length === 0) {
    return `
      <div class="empty-card">
        <div class="empty-copy">
          <p class="eyebrow">Routing</p>
          <h3>No routing decisions yet.</h3>
          <p>Run routing after submissions close to inspect recipient allocation and bridge flags.</p>
        </div>
      </div>
    `;
  }
  return `
    <div class="inspection-grid">
      ${routingDecisions
        .slice(0, 18)
        .map(
          (decision) => `
            <article class="inspection-card">
              <h4>${escapeHtml(decision.recipientParticipantId)}</h4>
              <p>Contribution: ${escapeHtml(decision.contributionId)}</p>
              <p>Reason: ${escapeHtml(decision.reason || 'No reason recorded')}</p>
              <p>Score: ${formatNumber(decision.score)}</p>
              <p>${decision.bridgeFlag ? 'Bridge exposure candidate.' : 'Core relevance candidate.'}</p>
            </article>
          `,
        )
        .join('')}
    </div>
  `;
}

function renderDigestsTab(cycle) {
  const digests = state.caches.digests.get(cycle.id) || [];
  if (cycle.condition !== 'intervention') {
    return `
      <div class="inline-message inline-message--warn">
        <p class="eyebrow">Baseline thread</p>
        <h4>Baseline cycles do not generate routed digests.</h4>
        <p>Participants receive a chronological thread instead of explained digest packets.</p>
      </div>
    `;
  }
  if (digests.length === 0) {
    return `
      <div class="empty-card">
        <div class="empty-copy">
          <p class="eyebrow">Digests</p>
          <h3>No digests available.</h3>
          <p>Digests appear after routing and release.</p>
        </div>
      </div>
    `;
  }
  return `
    <div class="inspection-grid">
      ${digests
        .slice(0, 12)
        .map(
          (digest) => `
            <article class="inspection-card">
              <h4>${escapeHtml(digest.participantId)}</h4>
              <p>${escapeHtml(digest.summary || 'No digest summary recorded.')}</p>
              <p>Items: ${escapeHtml(digest.items?.length || 0)}</p>
              <p>Created: ${escapeHtml(digest.createdAt || 'Unknown')}</p>
            </article>
          `,
        )
        .join('')}
    </div>
  `;
}

function renderTelemetryTab(cycle) {
  const telemetryEvents = state.caches.telemetryEvents.get(cycle.id) || [];
  const auditEvents = state.caches.auditEvents.get(cycle.id) || [];
  if (telemetryEvents.length === 0 && auditEvents.length === 0) {
    return `
      <div class="empty-card">
        <div class="empty-copy">
          <p class="eyebrow">Telemetry</p>
          <h3>No telemetry yet.</h3>
          <p>Participant interactions and operator events will appear here once the cycle is active.</p>
        </div>
      </div>
    `;
  }
  return `
    <div class="detail-stack">
      <div>
        <p class="eyebrow">Participant events</p>
        <ul class="audit-list">
          ${telemetryEvents
            .slice()
            .reverse()
            .slice(0, 10)
            .map(
              (event) => `
                <li class="audit-item">
                  <strong>${escapeHtml(event.eventType)}</strong>
                  <span>${escapeHtml(event.createdAt)} · ${escapeHtml(event.participantId || 'operator')}</span>
                </li>
              `,
            )
            .join('')}
        </ul>
      </div>
      <div>
        <p class="eyebrow">Operator audit</p>
        <ul class="audit-list">
          ${auditEvents
            .slice()
            .reverse()
            .slice(0, 10)
            .map(
              (event) => `
                <li class="audit-item">
                  <strong>${escapeHtml(event.action)}</strong>
                  <span>${escapeHtml(event.createdAt)} · ${escapeHtml(event.actorType)}:${escapeHtml(event.actorId)}</span>
                </li>
              `,
            )
            .join('')}
        </ul>
      </div>
    </div>
  `;
}

function renderExportsTab(cycle) {
  const exports = state.caches.exports.get(cycle.id) || [];
  if (exports.length === 0) {
    return `
      <div class="empty-card">
        <div class="empty-copy">
          <p class="eyebrow">Exports</p>
          <h3>No exports generated yet.</h3>
          <p>Create an analysis, audit, or minimal export from the operator action row.</p>
        </div>
      </div>
    `;
  }
  return `
    <div class="inspection-grid">
      ${exports
        .map(
          (artifact) => `
            <article class="inspection-card">
              <h4>${escapeHtml(artifact.mode)}</h4>
              <p>Created: ${escapeHtml(artifact.createdAt || 'Unknown')}</p>
              <p>Cycle: ${escapeHtml(artifact.cycleId || cycle.id)}</p>
            </article>
          `,
        )
        .join('')}
    </div>
  `;
}

function renderOperatorTabContent(cycle) {
  if (state.operatorDetailTab === 'routing') return renderRoutingTab(cycle);
  if (state.operatorDetailTab === 'digests') return renderDigestsTab(cycle);
  if (state.operatorDetailTab === 'telemetry') return renderTelemetryTab(cycle);
  if (state.operatorDetailTab === 'exports') return renderExportsTab(cycle);
  return renderOperatorOverview(cycle);
}

async function renderOperatorDetail() {
  const cycle = cycleById(state.selectedCycleId);
  if (!cycle) {
    els.operatorDetail.className = 'card empty-card';
    els.operatorDetail.innerHTML = `
      <div class="empty-copy">
        <p class="eyebrow">Operator detail</p>
        <h3>Select or create a cycle.</h3>
        <p>The operator panel will show lifecycle actions, metrics, inspection data, and exports for the selected cycle.</p>
      </div>
    `;
    return;
  }

  state.isRenderingOperatorDetail = true;
  els.operatorDetail.className = 'card loading-card';
  els.operatorDetail.innerHTML = operatorLoadingMarkup();

  const [auditPayload, telemetryPayload, metricsPayload, routingPayload, digestsPayload, exportsPayload] = await Promise.all([
    readInspection(`/v1/cycles/${cycle.id}/audit-events`, 'auditEvents'),
    readInspection(`/v1/cycles/${cycle.id}/telemetry-events`, 'telemetryEvents'),
    readInspection(`/v1/cycles/${cycle.id}/metrics`, 'metrics'),
    readInspection(`/v1/cycles/${cycle.id}/routing-decisions`, 'routingDecisions'),
    readInspection(`/v1/cycles/${cycle.id}/digests`, 'digests'),
    readInspection(`/v1/cycles/${cycle.id}/exports`, 'exports'),
  ]);

  state.caches.auditEvents.set(cycle.id, auditPayload.auditEvents || []);
  state.caches.telemetryEvents.set(cycle.id, telemetryPayload.telemetryEvents || []);
  state.caches.metrics.set(cycle.id, metricsPayload.metrics || null);
  state.caches.routingDecisions.set(cycle.id, routingPayload.routingDecisions || []);
  state.caches.digests.set(cycle.id, digestsPayload.digests || []);
  state.caches.exports.set(cycle.id, exportsPayload.exports || []);

  const warnings = [auditPayload, telemetryPayload, metricsPayload, routingPayload, digestsPayload, exportsPayload]
    .map((payload) => payload.__error)
    .filter(Boolean);

  const actionButtons = actionConfig(cycle)
    .map(({ label, path, enabled, tone }) => {
      const className = tone === 'warn' ? 'button button--warn' : tone === 'danger' ? 'button button--danger' : tone === 'ghost' ? 'button button--ghost' : 'button';
      return `<button class="${className}" type="button" data-path="${path}" data-action-label="${escapeHtml(label)}" ${enabled ? '' : 'disabled'}>${escapeHtml(label)}</button>`;
    })
    .join('');

  els.operatorDetail.className = 'card';
  els.operatorDetail.innerHTML = `
    <div class="detail-stack">
      <div class="detail-meta">
        <div>
          <p class="eyebrow">Selected cycle</p>
          <h3>${escapeHtml(cycle.title)}</h3>
          <p class="detail-copy">${escapeHtml(cycle.prompt)}</p>
        </div>
        <div class="card-chips">
          ${statusChipHtml(cycle.condition, 'accent')}
          ${statusChipHtml(cycle.status)}
        </div>
      </div>
      ${warnings.length ? `
        <div class="inline-message inline-message--warn">
          <p class="eyebrow">Partial inspection load</p>
          <h4>Some inspection endpoints were unavailable.</h4>
          <p>${escapeHtml(warnings.join(' · '))}</p>
        </div>
      ` : ''}
      <div class="action-row">
        ${actionButtons}
        <button class="button button--ghost" type="button" data-export="analysis">Export analysis</button>
        <button class="button button--ghost" type="button" data-export="audit">Export audit</button>
        <button class="button button--ghost" type="button" data-export="minimal">Export minimal</button>
      </div>
      <div class="inspection-tabs">${renderInspectionTabButtons()}</div>
      <div id="operator-tab-content">${renderOperatorTabContent(cycle)}</div>
    </div>
  `;

  els.operatorDetail.querySelectorAll('button[data-path]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await api(button.dataset.path, { method: 'POST' });
        showToast(`${button.dataset.actionLabel} complete`, 'ok');
        await loadCycles({ preserveSelection: true });
        if (state.participantCycleId === cycle.id && state.participantId) {
          await loadParticipantView({ silent: true });
        }
      } catch (error) {
        showToast(error.message, 'warn');
      }
    });
  });

  els.operatorDetail.querySelectorAll('button[data-export]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        const payload = await api(`/v1/cycles/${cycle.id}/exports`, {
          method: 'POST',
          body: JSON.stringify({ mode: button.dataset.export }),
        });
        const existing = state.caches.exports.get(cycle.id) || [];
        state.caches.exports.set(cycle.id, [...existing.filter((item) => item.mode !== payload.export.mode), payload.export]);
        showToast(`${button.dataset.export} export generated`, 'ok');
        await renderOperatorDetail();
      } catch (error) {
        showToast(error.message, 'warn');
      }
    });
  });

  els.operatorDetail.querySelectorAll('button[data-detail-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      state.operatorDetailTab = button.dataset.detailTab;
      renderOperatorDetail();
    });
  });

  state.isRenderingOperatorDetail = false;
}

async function emitParticipantEvent(eventType, metadata = {}, targetId = undefined) {
  if (!state.participantCycleId || !state.participantId) return;
  try {
    await api(`/v1/cycles/${state.participantCycleId}/participants/${state.participantId}/events`, {
      method: 'POST',
      body: JSON.stringify({ eventType, targetId, surface: 'web', metadata }),
    });
  } catch {
    // Web telemetry should not break the user flow.
  }
}

function contributionFormMarkup(view) {
  return `
    <form id="contribution-form" class="stack">
      <div class="inline-message inline-message--info">
        <p class="eyebrow">Submission mode</p>
        <h4>One primary contribution per participant.</h4>
        <p>Relay keeps the submission loop bounded before any routing or release occurs.</p>
      </div>
      <label class="field">
        <span>Your contribution</span>
        <textarea name="body" rows="6" required placeholder="Contribute one considered perspective for this cycle.">${escapeHtml(view.contribution?.body || '')}</textarea>
      </label>
      <div class="split">
        <label class="field">
          <span>Confidence</span>
          <select name="confidenceLabel">
            <option value="">None</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label class="field">
          <span>Evidence</span>
          <input name="evidenceText" placeholder="Optional evidence or reference" />
        </label>
      </div>
      <button class="button" type="submit">Submit contribution</button>
    </form>
  `;
}

function waitingMarkup(view) {
  return `
    <div class="inline-message inline-message--info">
      <p class="eyebrow">Waiting mode</p>
      <h4>${view.contribution ? 'Your contribution is stored.' : 'This cycle is not accepting a submission from you right now.'}</h4>
      <p>${view.cycle.condition === 'intervention' ? 'Relay is waiting for routing and release before generating your digest.' : 'Relay is waiting for the baseline thread release window.'}</p>
    </div>
  `;
}

function completeMarkup(view) {
  return `
    <div class="inline-message inline-message--info">
      <p class="eyebrow">Complete mode</p>
      <h4>This cycle is complete for participant review.</h4>
      <p>You can still inspect what was released and any feedback you submitted, but the active exchange window has ended.</p>
    </div>
    ${view.feedback ? '<div class="summary-card"><h4>Feedback stored</h4><p>Your post-cycle feedback is already recorded for this run.</p></div>' : ''}
  `;
}

function buildItemNode(item, mode) {
  const node = els.digestItemTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector('[data-role="author"]').textContent = item.authorParticipantId;
  node.querySelector('[data-role="reason"]').textContent = item.reason || (mode === 'digest' ? `Digest position ${Number(item.position ?? 0) + 1}` : 'Chronological thread item');
  node.querySelector('[data-role="bridge"]').outerHTML = item.bridgeFlag ? statusChipHtml('bridge', 'accent') : statusChipHtml(mode, mode === 'digest' ? 'accent' : 'neutral');
  node.querySelector('[data-role="body"]').textContent = item.body;
  const explanation = node.querySelector('[data-role="explanation"]');
  const explanationButton = node.querySelector('[data-action="toggle-explanation"]');
  if (mode !== 'digest') {
    explanationButton.hidden = true;
    explanation.textContent = 'Baseline thread items are shown chronologically and do not include routing explanations.';
  } else {
    explanation.textContent = item.explanation || 'No explanation available.';
  }

  node.querySelector('[data-action="open-item"]').addEventListener('click', async () => {
    const eventType = mode === 'digest' ? 'digest_item_opened' : 'thread_item_opened';
    await emitParticipantEvent(eventType, { bridge_flag: !!item.bridgeFlag, item_position: Number(item.position ?? 0) }, item.contributionId);
    if (item.bridgeFlag) {
      await emitParticipantEvent('bridge_item_engaged', { engagement_type: 'opened' }, item.contributionId);
    }
    showToast(`Opened ${item.contributionId}`, 'neutral');
  });

  explanationButton.addEventListener('click', async () => {
    explanation.hidden = !explanation.hidden;
    if (!explanation.hidden && mode === 'digest') {
      await emitParticipantEvent('routing_explanation_viewed', { bridge_flag: !!item.bridgeFlag }, item.contributionId);
    }
  });

  node.querySelector('[data-action="reply"]').addEventListener('click', async () => {
    const responseForm = document.querySelector('#response-form');
    if (!responseForm) return;
    responseForm.querySelector('[name="parentContributionId"]').value = item.contributionId;
    responseForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (item.bridgeFlag) {
      await emitParticipantEvent('bridge_item_engaged', { engagement_type: 'responded' }, item.contributionId);
    }
  });

  return node;
}

function interactionMarkup(view) {
  const introChip = view.mode === 'digest' ? 'Digest mode' : 'Baseline thread mode';
  const description =
    view.mode === 'digest'
      ? 'These items were routed for relevance, diversity, and bounded load. Open explanations to see why Relay showed them.'
      : 'These items are shown chronologically. Relay does not claim that any baseline thread item was intentionally routed.';
  return `
    <div class="inline-message ${view.mode === 'digest' ? 'inline-message--info' : 'inline-message--warn'}">
      <p class="eyebrow">${introChip}</p>
      <h4>${view.mode === 'digest' ? 'Read your routed packet.' : 'Read the released thread.'}</h4>
      <p>${description}</p>
    </div>
    ${view.mode === 'digest' ? `<div class="summary-card"><h4>Digest summary</h4><p>${escapeHtml(view.digest?.summary || 'No digest summary recorded.')}</p></div>` : ''}
    <div id="participant-items" class="item-stack"></div>
    <form id="response-form" class="stack">
      <div class="card__header">
        <div>
          <p class="eyebrow">Response</p>
          <h3>Submit a reflection or reply</h3>
        </div>
      </div>
      <input type="hidden" name="parentContributionId" />
      <label class="field">
        <span>Response body</span>
        <textarea name="body" rows="4" required placeholder="Respond to one contribution or reflect on the cycle."></textarea>
      </label>
      <button class="button" type="submit">Submit response</button>
    </form>
    <form id="feedback-form" class="stack">
      <div class="card__header">
        <div>
          <p class="eyebrow">Feedback</p>
          <h3>Post-cycle ratings</h3>
          <p class="feedback-help">Use the 1-5 scale to capture overload, usefulness, exchange quality, explanation clarity, and willingness to return.</p>
        </div>
      </div>
      <div class="feedback-grid">
        <label class="field"><span>Overload</span><input type="number" name="overload" min="1" max="5" value="3" /></label>
        <label class="field"><span>Usefulness</span><input type="number" name="usefulness" min="1" max="5" value="3" /></label>
        <label class="field"><span>Exchange quality</span><input type="number" name="exchangeQuality" min="1" max="5" value="3" /></label>
        <label class="field"><span>Explanation clarity</span><input type="number" name="explanationClarity" min="1" max="5" value="3" /></label>
        <label class="field"><span>Return willingness</span><input type="number" name="returnWillingness" min="1" max="5" value="3" /></label>
      </div>
      <button class="button" type="submit">Submit feedback</button>
    </form>
  `;
}

function participantLoadingMarkup() {
  return `
    <div class="loading-copy">
      <span class="loading-spinner" aria-hidden="true"></span>
      <div>
        <p class="eyebrow">Participant detail</p>
        <h3>Loading participant view</h3>
        <p>Relay is resolving the ACP-derived mode for this participant.</p>
      </div>
    </div>
  `;
}

async function loadParticipantView({ silent = false } = {}) {
  if (!state.participantCycleId || !state.participantId) {
    renderParticipantSelectorStatus();
    renderParticipantView();
    return;
  }
  state.isLoadingParticipantView = true;
  state.participantError = null;
  if (!silent) {
    renderParticipantView();
  }
  try {
    const payload = await api(`/v1/cycles/${state.participantCycleId}/participants/${state.participantId}/view`);
    state.participantView = payload.view;
    state.draftStarted = false;
    state.responseStarted = false;
    setHash('participant', state.participantCycleId, state.participantId);
    await emitParticipantEvent('prompt_viewed', { condition: payload.view.cycle.condition });
    if (payload.view.mode === 'digest' && payload.view.digest) {
      await emitParticipantEvent('digest_opened', { estimated_read_time: payload.view.digest.estimatedReadTime || null, item_count: payload.view.digest.items.length }, payload.view.digest.id);
    }
    if (payload.view.mode === 'thread' && payload.view.thread) {
      await emitParticipantEvent('thread_opened', { contribution_count_visible: payload.view.thread.length });
    }
    renderParticipantView();
  } catch (error) {
    state.participantError = error.message;
    renderParticipantView();
    showToast(error.message, 'warn');
  } finally {
    state.isLoadingParticipantView = false;
  }
}

function renderParticipantView() {
  if (state.isLoadingParticipantView) {
    els.participantDetail.className = 'card loading-card';
    els.participantDetail.innerHTML = participantLoadingMarkup();
    return;
  }

  if (state.participantError) {
    els.participantDetail.className = 'card error-card';
    els.participantDetail.innerHTML = `
      <div class="error-copy">
        <p class="eyebrow">Participant view error</p>
        <h3>${escapeHtml(state.participantError)}</h3>
        <p>Confirm the selected cycle and participant, then try loading the view again.</p>
      </div>
    `;
    return;
  }

  const view = state.participantView;
  if (!view) {
    els.participantDetail.className = 'card empty-card';
    els.participantDetail.innerHTML = `
      <div class="empty-copy">
        <p class="eyebrow">Participant detail</p>
        <h3>Load a participant view.</h3>
        <p>Choose a cycle and participant, then load the canonical participant mode for that cycle.</p>
      </div>
    `;
    return;
  }

  const intro = `
    <div class="detail-meta">
      <div>
        <p class="eyebrow">${escapeHtml(view.participant.name)}</p>
        <h3>${escapeHtml(view.cycle.title)}</h3>
        <p class="detail-copy">${escapeHtml(view.cycle.prompt)}</p>
      </div>
      <div class="card-chips">
        ${statusChipHtml(view.cycle.condition, 'accent')}
        ${statusChipHtml(view.cycle.status)}
        ${statusChipHtml(view.mode, view.mode === 'digest' ? 'accent' : 'neutral')}
      </div>
    </div>
  `;

  els.participantDetail.className = 'card';
  if (view.mode === 'submission') {
    els.participantDetail.innerHTML = `${intro}${contributionFormMarkup(view)}`;
    const form = document.querySelector('#contribution-form');
    const body = form.querySelector('[name="body"]');
    body.addEventListener('focus', async () => {
      if (!state.draftStarted) {
        state.draftStarted = true;
        await emitParticipantEvent('contribution_started', { condition: view.cycle.condition });
      }
    }, { once: true });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        const formData = new FormData(form);
        await api(`/v1/cycles/${view.cycle.id}/participants/${view.participant.id}/contribution`, {
          method: 'POST',
          body: JSON.stringify({
            body: formData.get('body'),
            confidenceLabel: formData.get('confidenceLabel') || undefined,
            evidenceText: formData.get('evidenceText') || undefined,
          }),
        });
        state.draftStarted = false;
        showToast('Contribution submitted', 'ok');
        await loadCycles({ preserveSelection: true });
        await loadParticipantView({ silent: true });
      } catch (error) {
        showToast(error.message, 'warn');
      }
    });
    return;
  }

  if (view.mode === 'waiting') {
    els.participantDetail.innerHTML = `${intro}${waitingMarkup(view)}`;
    return;
  }

  if (view.mode === 'complete') {
    els.participantDetail.innerHTML = `${intro}${completeMarkup(view)}`;
    return;
  }

  els.participantDetail.innerHTML = `${intro}${interactionMarkup(view)}`;
  const itemContainer = document.querySelector('#participant-items');
  const items = view.mode === 'digest'
    ? (view.digest?.items || []).map((item) => buildItemNode(item, 'digest'))
    : (view.thread || []).map((contribution, index) =>
        buildItemNode(
          {
            contributionId: contribution.id,
            authorParticipantId: contribution.participantId,
            body: contribution.body,
            reason: 'Chronological thread item',
            explanation: null,
            bridgeFlag: false,
            position: index,
          },
          'thread',
        ),
      );
  if (items.length === 0) {
    itemContainer.innerHTML = `
      <div class="empty-card">
        <div class="empty-copy">
          <p class="eyebrow">No released items</p>
          <h3>There is nothing to read yet.</h3>
          <p>Relay has released the mode shell, but there are no items visible for this participant yet.</p>
        </div>
      </div>
    `;
  } else {
    items.forEach((item) => itemContainer.append(item));
  }

  const responseForm = document.querySelector('#response-form');
  responseForm.querySelector('[name="body"]').addEventListener('focus', async () => {
    if (!state.responseStarted) {
      state.responseStarted = true;
      await emitParticipantEvent('response_started', { condition: view.cycle.condition, parent_type: 'contribution' });
    }
  }, { once: true });
  responseForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData(responseForm);
      await api(`/v1/cycles/${view.cycle.id}/participants/${view.participant.id}/responses`, {
        method: 'POST',
        body: JSON.stringify({
          parentContributionId: formData.get('parentContributionId') || undefined,
          body: formData.get('body'),
        }),
      });
      state.responseStarted = false;
      showToast('Response submitted', 'ok');
      await loadCycles({ preserveSelection: true });
      await loadParticipantView({ silent: true });
    } catch (error) {
      showToast(error.message, 'warn');
    }
  });

  const feedbackForm = document.querySelector('#feedback-form');
  feedbackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData(feedbackForm);
      await api(`/v1/cycles/${view.cycle.id}/participants/${view.participant.id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          instrumentVersion: 'v1',
          answers: {
            overload: Number(formData.get('overload')),
            usefulness: Number(formData.get('usefulness')),
            exchangeQuality: Number(formData.get('exchangeQuality')),
            explanationClarity: Number(formData.get('explanationClarity')),
            returnWillingness: Number(formData.get('returnWillingness')),
          },
        }),
      });
      showToast('Feedback submitted', 'ok');
      await loadCycles({ preserveSelection: true });
      await loadParticipantView({ silent: true });
    } catch (error) {
      showToast(error.message, 'warn');
    }
  });
}

els.createCycleForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const formData = new FormData(els.createCycleForm);
    await api('/v1/cycles', {
      method: 'POST',
      body: JSON.stringify({
        title: formData.get('title'),
        prompt: formData.get('prompt'),
        condition: formData.get('condition'),
        participants: parseParticipants(formData.get('participants')),
        config: {
          maxDigestItems: Number(formData.get('maxDigestItems')),
          maxBridgeItems: Number(formData.get('maxBridgeItems')),
        },
      }),
    });
    els.createCycleForm.reset();
    showToast('Cycle created', 'ok');
    await loadCycles({ preserveSelection: false });
  } catch (error) {
    showToast(error.message, 'warn');
  }
});

els.refreshCycles.addEventListener('click', async () => {
  try {
    await loadCycles({ preserveSelection: true });
    if (state.viewMode === 'participant' && state.participantCycleId && state.participantId) {
      await loadParticipantView({ silent: true });
    }
  } catch (error) {
    showToast(error.message, 'warn');
  }
});

els.modeOperator.addEventListener('click', () => {
  state.viewMode = 'operator';
  if (!state.selectedCycleId) {
    state.selectedCycleId = state.cycles[0]?.id || null;
  }
  setHash('operator', state.selectedCycleId);
  renderSurfaceMode();
  renderCycleList();
  renderOperatorDetail();
});

els.modeParticipant.addEventListener('click', () => {
  state.viewMode = 'participant';
  if (!state.participantCycleId) {
    state.participantCycleId = state.cycles[0]?.id || null;
  }
  hydrateParticipantSelectors();
  renderParticipantSelectorStatus();
  setHash('participant', state.participantCycleId, state.participantId);
  renderSurfaceMode();
  renderCycleList();
  renderParticipantView();
});

els.participantCycleSelect.addEventListener('change', () => {
  state.participantCycleId = els.participantCycleSelect.value || null;
  hydrateParticipantSelectors();
  renderParticipantSelectorStatus();
});

els.participantSelect.addEventListener('change', () => {
  state.participantId = els.participantSelect.value || null;
  renderParticipantSelectorStatus();
});

els.loadParticipantView.addEventListener('click', async () => {
  await loadParticipantView();
});

window.addEventListener('hashchange', () => {
  applyHash();
  renderSharedStatus();
  renderOperatorDetail();
  renderParticipantView();
});

window.addEventListener('beforeunload', (event) => {
  if (state.draftStarted && state.participantCycleId && state.participantId) {
    navigator.sendBeacon(
      `/v1/cycles/${state.participantCycleId}/participants/${state.participantId}/events`,
      JSON.stringify({
        eventType: 'contribution_abandoned',
        surface: 'web',
        metadata: { condition: state.participantView?.cycle?.condition || null, abandon_stage: 'page_exit' },
      }),
    );
    event.preventDefault();
  }
});

bootstrap();
