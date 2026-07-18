import './popup.css';
import { getRecentRoutes } from '../storage/recentRoutesStorage';
import { getRules } from '../storage/rulesStorage';
import type { DownloadRule, RecentRoute } from '../shared/types';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Popup root element was not found.');
}

const app = root;

app.addEventListener('click', (event) => {
  const target = event.target;

  if (target instanceof HTMLButtonElement && target.id === 'open-options') {
    void chrome.runtime.openOptionsPage();
  }
});

void initialize();

async function initialize(): Promise<void> {
  try {
    const [rules, recentRoutes] = await Promise.all([getRules(), getRecentRoutes()]);
    render(rules, recentRoutes);
  } catch {
    render([], []);
  }
}

function render(rules: DownloadRule[], recentRoutes: RecentRoute[]): void {
  const activeRuleCount = rules.filter((rule) => rule.enabled).length;

  app.innerHTML = `
    <section class="popup-shell">
      <header>
        <p class="eyebrow">Smart Download Router</p>
        <h1>Enabled</h1>
      </header>
      <dl class="stats">
        <div>
          <dt>Active rules</dt>
          <dd>${activeRuleCount}</dd>
        </div>
      </dl>
      <button id="open-options" type="button">Open Options</button>
      <p class="note">Routes downloads into subfolders of your browser's default download location.</p>
      <section class="recent-section">
        <h2>Latest routed downloads</h2>
        ${renderRecentRoutes(recentRoutes)}
      </section>
    </section>
  `;
}

function renderRecentRoutes(recentRoutes: RecentRoute[]): string {
  if (recentRoutes.length === 0) {
    return '<p class="empty-state">No routed downloads yet.</p>';
  }

  return `
    <ul class="recent-list">
      ${recentRoutes
        .slice(0, 5)
        .map(
          (route) => `
            <li>
              <strong>${escapeHtml(route.routedFilename)}</strong>
              <span>${escapeHtml(route.ruleName)}</span>
            </li>
          `,
        )
        .join('')}
    </ul>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
