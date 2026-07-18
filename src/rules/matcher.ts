import type { DownloadRule, RouteMatch, UrlCandidate } from '../shared/types';
import { normalizeHostname, uniqueUrlCandidates } from './url';

type InternalMatch = RouteMatch & {
  ruleIndex: number;
  sourceIndex: number;
};

export function findBestRuleForUrls(
  rules: DownloadRule[],
  rawUrls: Array<string | undefined | null>,
): RouteMatch | null {
  const candidates = uniqueUrlCandidates(rawUrls);
  let best: InternalMatch | null = null;

  candidates.forEach((candidate, sourceIndex) => {
    rules.forEach((rule, ruleIndex) => {
      const match = matchRule(rule, candidate, ruleIndex, sourceIndex);

      if (!match) {
        return;
      }

      if (!best || isBetterMatch(match, best)) {
        best = match;
      }
    });
  });

  return best ? stripInternalMatchFields(best) : null;
}

export function findBestRuleForUrl(rules: DownloadRule[], rawUrl: string): RouteMatch | null {
  return findBestRuleForUrls(rules, [rawUrl]);
}

export function matchesRule(rule: DownloadRule, rawUrl: string): boolean {
  return findBestRuleForUrl([rule], rawUrl) !== null;
}

function matchRule(
  rule: DownloadRule,
  candidate: UrlCandidate,
  ruleIndex: number,
  sourceIndex: number,
): InternalMatch | null {
  if (!rule.enabled) {
    return null;
  }

  if (rule.matchType === 'domain') {
    const expectedHost = normalizeHostname(rule.domainPattern);

    if (candidate.hostname === expectedHost) {
      return buildMatch(rule, candidate, 300 + expectedHost.length, ruleIndex, sourceIndex);
    }
  }

  if (rule.matchType === 'wildcard') {
    const baseHost = normalizeHostname(rule.domainPattern);

    if (candidate.hostname === baseHost || candidate.hostname.endsWith(`.${baseHost}`)) {
      return buildMatch(rule, candidate, 200 + baseHost.length, ruleIndex, sourceIndex);
    }
  }

  if (rule.matchType === 'urlContains') {
    const needle = rule.domainPattern.trim().toLowerCase();

    if (needle && candidate.sourceUrl.toLowerCase().includes(needle)) {
      return buildMatch(rule, candidate, 100 + needle.length, ruleIndex, sourceIndex);
    }
  }

  return null;
}

function buildMatch(
  rule: DownloadRule,
  candidate: UrlCandidate,
  score: number,
  ruleIndex: number,
  sourceIndex: number,
): InternalMatch {
  return {
    rule,
    sourceUrl: candidate.sourceUrl,
    hostname: candidate.hostname,
    score,
    ruleIndex,
    sourceIndex,
  };
}

function isBetterMatch(candidate: InternalMatch, current: InternalMatch): boolean {
  if (candidate.score !== current.score) {
    return candidate.score > current.score;
  }

  if (candidate.sourceIndex !== current.sourceIndex) {
    return candidate.sourceIndex < current.sourceIndex;
  }

  return candidate.ruleIndex < current.ruleIndex;
}

function stripInternalMatchFields(match: InternalMatch): RouteMatch {
  return {
    rule: match.rule,
    sourceUrl: match.sourceUrl,
    hostname: match.hostname,
    score: match.score,
  };
}
