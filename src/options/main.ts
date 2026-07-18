import './options.css';
import { findBestRuleForUrl } from '../rules/matcher';
import { sanitizeFolderPath } from '../rules/sanitize';
import { validateRuleDraft } from '../rules/validation';
import { getRules, saveRules } from '../storage/rulesStorage';
import type { DownloadRule, RuleDraft, RuleMatchType } from '../shared/types';

const root = document.querySelector<HTMLDivElement>('#app');

type TestResult = {
  kind: 'idle' | 'match' | 'miss';
  message: string;
};

const matchTypes: RuleMatchType[] = ['domain', 'wildcard', 'urlContains'];

let rules: DownloadRule[] = [];
let editingRuleId: string | null = null;
let statusMessage = '';
let formErrors: string[] = [];
let testUrl = '';
let testResult: TestResult = {
  kind: 'idle',
  message: '',
};

if (!root) {
  throw new Error('Options root element was not found.');
}

const app = root;

app.addEventListener('submit', (event) => {
  const form = event.target;

  if (form instanceof HTMLFormElement && form.id === 'rule-form') {
    event.preventDefault();
    void handleRuleSubmit(form);
  }

  if (form instanceof HTMLFormElement && form.id === 'test-form') {
    event.preventDefault();
    handleTestSubmit(form);
  }
});

app.addEventListener('click', (event) => {
  const actionTarget = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');

  if (!actionTarget) {
    return;
  }

  const action = actionTarget.dataset.action;
  const ruleId = actionTarget.dataset.ruleId;

  if (action === 'edit-rule' && ruleId) {
    editingRuleId = ruleId;
    formErrors = [];
    statusMessage = '';
    render();
  }

  if (action === 'cancel-edit') {
    editingRuleId = null;
    formErrors = [];
    render();
  }

  if (action === 'delete-rule' && ruleId) {
    void handleDeleteRule(ruleId);
  }

  if (action === 'export-rules') {
    exportRules();
  }
});

app.addEventListener('change', (event) => {
  const target = event.target;

  if (target instanceof HTMLInputElement && target.dataset.action === 'toggle-rule') {
    const ruleId = target.dataset.ruleId;

    if (ruleId) {
      void handleToggleRule(ruleId, target.checked);
    }
  }

  if (target instanceof HTMLInputElement && target.id === 'import-file') {
    void handleImportRules(target);
  }
});

void initialize();

async function initialize(): Promise<void> {
  rules = await getRules();
  render();
}

function render(): void {
  const editingRule = rules.find((rule) => rule.id === editingRuleId) ?? null;

  app.innerHTML = `
    <section class="page-shell">
      <header class="page-header">
        <p class="eyebrow">Smart Download Router</p>
        <h1>Download Rules</h1>
      </header>
      ${renderStatus()}
      <section class="layout-grid">
        <section class="panel">
          <div class="section-heading">
            <h2>${editingRule ? 'Edit Rule' : 'Add Rule'}</h2>
          </div>
          ${renderRuleForm(editingRule)}
        </section>
        <section class="panel">
          <div class="section-heading with-actions">
            <h2>Import and Export</h2>
            <div class="button-row">
              <button class="secondary-button" type="button" data-action="export-rules">Export JSON</button>
              <label class="secondary-button file-button" for="import-file">Import JSON</label>
              <input id="import-file" class="visually-hidden" type="file" accept="application/json,.json" />
            </div>
          </div>
          <form id="test-form" class="test-form" novalidate>
            <label for="test-url">Test URL</label>
            <div class="inline-form">
              <input id="test-url" name="testUrl" type="text" value="${escapeHtml(testUrl)}" placeholder="https://example.com/file.pdf" />
              <button class="primary-button" type="submit">Test</button>
            </div>
          </form>
          ${renderTestResult()}
        </section>
      </section>
      <section class="panel rules-panel">
        <div class="section-heading">
          <h2>Configured Rules</h2>
          <span class="rule-count">${rules.filter((rule) => rule.enabled).length} active of ${rules.length}</span>
        </div>
        ${renderRulesTable()}
      </section>
    </section>
  `;
}

function renderRuleForm(rule: DownloadRule | null): string {
  const selectedMatchType = rule?.matchType ?? 'domain';
  const enabled = rule?.enabled ?? true;

  return `
    <form id="rule-form" class="rule-form" novalidate>
      <input type="hidden" name="ruleId" value="${escapeHtml(rule?.id ?? '')}" />
      ${renderFormErrors()}
      <div class="form-grid">
        <label>
          <span>Rule name</span>
          <input name="name" type="text" value="${escapeHtml(rule?.name ?? '')}" placeholder="Cohort notes" required />
        </label>
        <label>
          <span>Match type</span>
          <select name="matchType">
            ${matchTypes
              .map(
                (matchType) =>
                  `<option value="${matchType}" ${matchType === selectedMatchType ? 'selected' : ''}>${formatMatchType(matchType)}</option>`,
              )
              .join('')}
          </select>
        </label>
        <label>
          <span>Domain or pattern</span>
          <input name="domainPattern" type="text" value="${escapeHtml(rule?.domainPattern ?? '')}" placeholder="ilovepdf.com" required />
        </label>
        <label>
          <span>Folder path</span>
          <input name="folderPath" type="text" value="${escapeHtml(rule?.folderPath ?? '')}" placeholder="dump" required />
        </label>
      </div>
      <label class="checkbox-row">
        <input name="enabled" type="checkbox" ${enabled ? 'checked' : ''} />
        <span>Enabled</span>
      </label>
      <div class="button-row form-actions">
        <button class="primary-button" type="submit">${rule ? 'Update Rule' : 'Add Rule'}</button>
        ${rule ? '<button class="secondary-button" type="button" data-action="cancel-edit">Cancel</button>' : ''}
      </div>
    </form>
  `;
}

function renderRulesTable(): string {
  if (rules.length === 0) {
    return '<p class="empty-state">No rules configured.</p>';
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Enabled</th>
            <th scope="col">Name</th>
            <th scope="col">Match</th>
            <th scope="col">Folder</th>
            <th scope="col">Updated</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rules.map(renderRuleRow).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderRuleRow(rule: DownloadRule): string {
  return `
    <tr>
      <td>
        <input type="checkbox" data-action="toggle-rule" data-rule-id="${escapeHtml(rule.id)}" ${rule.enabled ? 'checked' : ''} aria-label="Toggle ${escapeHtml(rule.name)}" />
      </td>
      <td>
        <strong>${escapeHtml(rule.name)}</strong>
        <span class="muted">${escapeHtml(rule.domainPattern)}</span>
      </td>
      <td>${formatMatchType(rule.matchType)}</td>
      <td><code>${escapeHtml(rule.folderPath)}</code></td>
      <td>${formatDate(rule.updatedAt)}</td>
      <td>
        <div class="row-actions">
          <button class="ghost-button" type="button" data-action="edit-rule" data-rule-id="${escapeHtml(rule.id)}">Edit</button>
          <button class="danger-button" type="button" data-action="delete-rule" data-rule-id="${escapeHtml(rule.id)}">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

function renderStatus(): string {
  if (!statusMessage) {
    return '';
  }

  return `<p class="status-message">${escapeHtml(statusMessage)}</p>`;
}

function renderFormErrors(): string {
  if (formErrors.length === 0) {
    return '';
  }

  return `
    <div class="error-box" role="alert">
      ${formErrors.map((error) => `<p>${escapeHtml(error)}</p>`).join('')}
    </div>
  `;
}

function renderTestResult(): string {
  if (testResult.kind === 'idle') {
    return '';
  }

  return `<p class="test-result ${testResult.kind}">${escapeHtml(testResult.message)}</p>`;
}

async function handleRuleSubmit(form: HTMLFormElement): Promise<void> {
  const formData = new FormData(form);
  const ruleId = String(formData.get('ruleId') ?? '');
  const draft = readRuleDraft(formData);
  const validation = validateRuleDraft(draft);

  if (!validation.valid) {
    formErrors = validation.errors;
    statusMessage = '';
    render();
    return;
  }

  const now = new Date().toISOString();
  const normalizedDraft: RuleDraft = {
    ...draft,
    name: draft.name.trim(),
    domainPattern: draft.domainPattern.trim(),
    folderPath: sanitizeFolderPath(draft.folderPath),
  };

  if (ruleId) {
    rules = rules.map((rule) =>
      rule.id === ruleId
        ? {
            ...rule,
            ...normalizedDraft,
            updatedAt: now,
          }
        : rule,
    );
    statusMessage = 'Rule updated.';
  } else {
    rules = [
      ...rules,
      {
        id: createRuleId(),
        ...normalizedDraft,
        createdAt: now,
        updatedAt: now,
      },
    ];
    statusMessage = 'Rule added.';
  }

  await saveRules(rules);
  editingRuleId = null;
  formErrors = [];
  render();
}

async function handleToggleRule(ruleId: string, enabled: boolean): Promise<void> {
  const now = new Date().toISOString();

  rules = rules.map((rule) =>
    rule.id === ruleId
      ? {
          ...rule,
          enabled,
          updatedAt: now,
        }
      : rule,
  );

  await saveRules(rules);
  statusMessage = enabled ? 'Rule enabled.' : 'Rule disabled.';
  render();
}

async function handleDeleteRule(ruleId: string): Promise<void> {
  const rule = rules.find((candidate) => candidate.id === ruleId);

  if (!rule || !window.confirm(`Delete "${rule.name}"?`)) {
    return;
  }

  rules = rules.filter((candidate) => candidate.id !== ruleId);
  await saveRules(rules);

  if (editingRuleId === ruleId) {
    editingRuleId = null;
  }

  statusMessage = 'Rule deleted.';
  render();
}

function handleTestSubmit(form: HTMLFormElement): void {
  const formData = new FormData(form);
  testUrl = String(formData.get('testUrl') ?? '').trim();

  if (!testUrl) {
    testResult = {
      kind: 'miss',
      message: 'Enter a URL to test.',
    };
    render();
    return;
  }

  const match = findBestRuleForUrl(rules, testUrl);

  testResult = match
    ? {
        kind: 'match',
        message: `Matches "${match.rule.name}" and routes to "${match.rule.folderPath}".`,
      }
    : {
        kind: 'miss',
        message: 'No enabled rule matches this URL.',
      };

  render();
}

function exportRules(): void {
  const payload = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      rules,
    },
    null,
    2,
  );
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'smart-download-router-rules.json';
  link.click();
  URL.revokeObjectURL(url);
}

async function handleImportRules(input: HTMLInputElement): Promise<void> {
  const file = input.files?.[0];
  input.value = '';

  if (!file) {
    return;
  }

  try {
    const importedRules = parseImportedRules(await file.text());

    if (
      rules.length > 0 &&
      !window.confirm(
        `Replace ${rules.length} existing rules with ${importedRules.length} imported rules?`,
      )
    ) {
      return;
    }

    rules = importedRules;
    await saveRules(rules);
    editingRuleId = null;
    statusMessage = 'Rules imported.';
    formErrors = [];
  } catch (error) {
    statusMessage = '';
    formErrors = [error instanceof Error ? error.message : 'Import failed.'];
  }

  render();
}

function parseImportedRules(content: string): DownloadRule[] {
  const parsed = JSON.parse(content) as unknown;
  const rawRules = Array.isArray(parsed)
    ? parsed
    : isObject(parsed) && Array.isArray(parsed.rules)
      ? parsed.rules
      : null;

  if (!rawRules) {
    throw new Error('Imported JSON must be an array of rules or an object with a rules array.');
  }

  return rawRules.map((rawRule, index) => normalizeImportedRule(rawRule, index));
}

function normalizeImportedRule(rawRule: unknown, index: number): DownloadRule {
  if (!isObject(rawRule)) {
    throw new Error(`Rule ${index + 1} is not an object.`);
  }

  const matchType = String(rawRule.matchType ?? 'domain') as RuleMatchType;

  if (!matchTypes.includes(matchType)) {
    throw new Error(`Rule ${index + 1} has an invalid match type.`);
  }

  const draft: RuleDraft = {
    name: String(rawRule.name ?? '').trim(),
    enabled: Boolean(rawRule.enabled ?? true),
    domainPattern: String(rawRule.domainPattern ?? '').trim(),
    folderPath: String(rawRule.folderPath ?? '').trim(),
    matchType,
  };
  const validation = validateRuleDraft(draft);

  if (!validation.valid) {
    throw new Error(`Rule ${index + 1}: ${validation.errors.join(' ')}`);
  }

  const now = new Date().toISOString();

  return {
    id: String(rawRule.id ?? createRuleId()),
    ...draft,
    folderPath: sanitizeFolderPath(draft.folderPath),
    createdAt: isDateString(rawRule.createdAt) ? String(rawRule.createdAt) : now,
    updatedAt: isDateString(rawRule.updatedAt) ? String(rawRule.updatedAt) : now,
  };
}

function readRuleDraft(formData: FormData): RuleDraft {
  return {
    name: String(formData.get('name') ?? ''),
    enabled: formData.get('enabled') === 'on',
    domainPattern: String(formData.get('domainPattern') ?? ''),
    folderPath: String(formData.get('folderPath') ?? ''),
    matchType: String(formData.get('matchType') ?? 'domain') as RuleMatchType,
  };
}

function createRuleId(): string {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatMatchType(matchType: RuleMatchType): string {
  const labels: Record<RuleMatchType, string> = {
    domain: 'Exact domain',
    wildcard: 'Wildcard',
    urlContains: 'URL contains',
  };

  return labels[matchType];
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDateString(value: unknown): boolean {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
