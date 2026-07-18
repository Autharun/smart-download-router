import { createDownloadRoute } from './downloadRouter';
import { addRecentRoute } from '../storage/recentRoutesStorage';
import { ensureDefaultRules, getRules, RULES_STORAGE_KEY } from '../storage/rulesStorage';
import { logDebug } from '../shared/logger';
import type { DownloadRule } from '../shared/types';

chrome.runtime.onInstalled.addListener(() => {
  void refreshRules({ ensureDefaults: true });
});

chrome.runtime.onStartup.addListener(() => {
  void refreshRules();
});

chrome.storage.onChanged.addListener((changes) => {
  const rulesChange = changes[RULES_STORAGE_KEY];

  if (rulesChange && Array.isArray(rulesChange.newValue)) {
    cachedRules = rulesChange.newValue as DownloadRule[];
    logDebug('Rules cache updated from storage change.', cachedRules);
    return;
  }

  if (rulesChange) {
    void refreshRules();
  }
});

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  void handleFilenameDetermination(downloadItem, suggest);
  return true;
});

let cachedRules: DownloadRule[] = [];
let rulesLoadPromise: Promise<DownloadRule[]> | null = null;

void refreshRules();

async function handleFilenameDetermination(
  downloadItem: chrome.downloads.DownloadItem,
  suggest: (suggestion?: chrome.downloads.FilenameSuggestion) => void,
): Promise<void> {
  try {
    const rules = cachedRules.length > 0 ? cachedRules : await refreshRules();
    const route = createDownloadRoute(downloadItem, rules);

    if (!route) {
      suggest();
      return;
    }

    logDebug('Routing download.', {
      sourceUrl: route.match.sourceUrl,
      ruleName: route.match.rule.name,
      routedFilename: route.routedFilename,
    });

    suggest(route.suggestion);
    void addRecentRoute(route.recentRoute);
  } catch (error) {
    logDebug('Download routing failed. Falling back to browser default.', error);
    suggest();
  }
}

async function refreshRules(options: { ensureDefaults?: boolean } = {}): Promise<DownloadRule[]> {
  if (!rulesLoadPromise) {
    rulesLoadPromise = (options.ensureDefaults ? ensureDefaultRules() : getRules()).finally(() => {
      rulesLoadPromise = null;
    });
  }

  cachedRules = await rulesLoadPromise;
  logDebug('Rules loaded.', cachedRules);
  return cachedRules;
}