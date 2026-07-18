import { findBestRuleForUrls } from '../rules/matcher';
import { getBaseFilename, joinRoutedFilename, sanitizeFilename } from '../rules/sanitize';
import type { DownloadRule, RecentRoute, RouteMatch } from '../shared/types';

export type DownloadSourceItem = {
  filename?: string;
  finalUrl?: string;
  referrer?: string;
  url?: string;
};

export type DownloadRouteResult = {
  match: RouteMatch;
  originalFilename: string;
  routedFilename: string;
  suggestion: chrome.downloads.FilenameSuggestion;
  recentRoute: RecentRoute;
};

export function createDownloadRoute(
  downloadItem: DownloadSourceItem,
  rules: DownloadRule[],
): DownloadRouteResult | null {
  const sourceUrls = getDownloadSourceUrls(downloadItem);
  const match = findBestRuleForUrls(rules, sourceUrls);

  if (!match) {
    return null;
  }

  const originalFilename = resolveOriginalFilename(downloadItem, sourceUrls);
  const routedFilename = joinRoutedFilename(match.rule.folderPath, originalFilename);

  return {
    match,
    originalFilename,
    routedFilename,
    suggestion: {
      filename: routedFilename,
      conflictAction: 'uniquify',
    },
    recentRoute: {
      id: createRouteId(),
      ruleId: match.rule.id,
      ruleName: match.rule.name,
      sourceUrl: match.sourceUrl,
      originalFilename,
      routedFilename,
      routedAt: new Date().toISOString(),
    },
  };
}

export function getDownloadSourceUrls(downloadItem: DownloadSourceItem): string[] {
  return [downloadItem.url, downloadItem.finalUrl, downloadItem.referrer].filter(
    (url): url is string => Boolean(url),
  );
}

function resolveOriginalFilename(downloadItem: DownloadSourceItem, sourceUrls: string[]): string {
  if (downloadItem.filename?.trim()) {
    return sanitizeFilename(downloadItem.filename);
  }

  for (const sourceUrl of sourceUrls) {
    try {
      const parsed = new URL(sourceUrl);
      const filename = getBaseFilename(parsed.pathname);

      if (filename !== 'download') {
        return sanitizeFilename(filename);
      }
    } catch {
      continue;
    }
  }

  return 'download';
}

function createRouteId(): string {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
