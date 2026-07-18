import { createDefaultRules } from '../rules/defaultRules';
import type { DownloadRule } from '../shared/types';
import { logDebug } from '../shared/logger';
import { getLocalStorageArea, getSyncStorageArea, storageGet, storageSet } from './storageArea';

export const RULES_STORAGE_KEY = 'downloadRules';

export async function getRules(): Promise<DownloadRule[]> {
  const syncRules = await readRulesFromSync();

  if (syncRules.length > 0) {
    return syncRules;
  }

  const localRules = await readRulesFromLocal();

  if (localRules.length > 0) {
    return localRules;
  }

  const defaults = createDefaultRules();
  await saveRules(defaults);
  return defaults;
}

export async function saveRules(rules: DownloadRule[]): Promise<void> {
  try {
    await storageSet(getSyncStorageArea(), RULES_STORAGE_KEY, rules);
  } catch (error) {
    logDebug('Falling back to local storage for rules.', error);
    await storageSet(getLocalStorageArea(), RULES_STORAGE_KEY, rules);
  }
}

export async function ensureDefaultRules(): Promise<DownloadRule[]> {
  return getRules();
}

async function readRulesFromSync(): Promise<DownloadRule[]> {
  try {
    return normalizeStoredRules(
      await storageGet<DownloadRule[]>(getSyncStorageArea(), RULES_STORAGE_KEY),
    );
  } catch (error) {
    logDebug('Could not read rules from sync storage.', error);
    return [];
  }
}

async function readRulesFromLocal(): Promise<DownloadRule[]> {
  try {
    return normalizeStoredRules(
      await storageGet<DownloadRule[]>(getLocalStorageArea(), RULES_STORAGE_KEY),
    );
  } catch (error) {
    logDebug('Could not read rules from local storage.', error);
    return [];
  }
}

function normalizeStoredRules(value: DownloadRule[] | undefined): DownloadRule[] {
  return Array.isArray(value) ? value : [];
}
