import type { UrlCandidate } from '../shared/types';

export function normalizeHostname(value: string): string {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return '';
  }

  const withoutWildcard = trimmed.startsWith('*.') ? trimmed.slice(2) : trimmed;
  const parsed = parseUrlishValue(withoutWildcard);
  const hostname = parsed?.hostname ?? withoutWildcard.split('/')[0]?.split(':')[0] ?? '';

  return hostname.replace(/\.$/, '').replace(/^www\./, '');
}

export function buildUrlCandidate(rawUrl: string): UrlCandidate | null {
  const parsed = parseUrlishValue(rawUrl);

  if (!parsed || !parsed.hostname) {
    return null;
  }

  return {
    sourceUrl: parsed.href,
    hostname: normalizeHostname(parsed.hostname),
  };
}

export function uniqueUrlCandidates(rawUrls: Array<string | undefined | null>): UrlCandidate[] {
  const seen = new Set<string>();
  const candidates: UrlCandidate[] = [];

  for (const rawUrl of rawUrls) {
    if (!rawUrl) {
      continue;
    }

    const candidate = buildUrlCandidate(rawUrl);

    if (!candidate || seen.has(candidate.sourceUrl)) {
      continue;
    }

    seen.add(candidate.sourceUrl);
    candidates.push(candidate);
  }

  return candidates;
}

function parseUrlishValue(value: string): URL | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}
