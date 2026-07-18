import { describe, expect, it } from 'vitest';
import type { DownloadRule } from '../shared/types';
import { findBestRuleForUrl, findBestRuleForUrls, matchesRule } from './matcher';
import { normalizeHostname } from './url';

const baseRule: DownloadRule = {
  id: 'rule-1',
  name: 'Rule 1',
  enabled: true,
  domainPattern: 'example.com',
  folderPath: 'example',
  matchType: 'domain',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('normalizeHostname', () => {
  it('normalizes casing, www prefixes, ports, and trailing dots', () => {
    expect(normalizeHostname('https://WWW.Example.com:443/path')).toBe('example.com');
    expect(normalizeHostname('www.example.com.')).toBe('example.com');
  });
});

describe('matchesRule', () => {
  it('matches exact domains after normalization', () => {
    expect(matchesRule(baseRule, 'https://www.example.com/download.pdf')).toBe(true);
    expect(matchesRule(baseRule, 'https://cdn.example.com/download.pdf')).toBe(false);
  });

  it('matches wildcard rules for apex and subdomains', () => {
    const wildcardRule: DownloadRule = {
      ...baseRule,
      id: 'wildcard-rule',
      domainPattern: '*.example.com',
      matchType: 'wildcard',
    };

    expect(matchesRule(wildcardRule, 'https://example.com/file.zip')).toBe(true);
    expect(matchesRule(wildcardRule, 'https://notes.cohort.example.com/file.zip')).toBe(true);
    expect(matchesRule(wildcardRule, 'https://notexample.com/file.zip')).toBe(false);
  });

  it('matches URL contains rules case-insensitively', () => {
    const containsRule: DownloadRule = {
      ...baseRule,
      id: 'contains-rule',
      domainPattern: '/downloads/cohort/',
      matchType: 'urlContains',
    };

    expect(matchesRule(containsRule, 'https://school.dev/Downloads/Cohort/week-1.pdf')).toBe(true);
    expect(matchesRule(containsRule, 'https://school.dev/files/week-1.pdf')).toBe(false);
  });

  it('ignores disabled rules', () => {
    expect(matchesRule({ ...baseRule, enabled: false }, 'https://example.com/file.zip')).toBe(
      false,
    );
  });
});

describe('findBestRuleForUrls', () => {
  it('selects the highest scoring enabled rule', () => {
    const rules: DownloadRule[] = [
      { ...baseRule, id: 'contains', domainPattern: 'example.com', matchType: 'urlContains' },
      { ...baseRule, id: 'wildcard', domainPattern: '*.example.com', matchType: 'wildcard' },
      { ...baseRule, id: 'domain', domainPattern: 'example.com', matchType: 'domain' },
    ];

    expect(findBestRuleForUrl(rules, 'https://example.com/file.zip')?.rule.id).toBe('domain');
  });

  it('can match a referrer when the download URL itself has no match', () => {
    const rules: DownloadRule[] = [{ ...baseRule, domainPattern: 'ilovepdf.com' }];

    const match = findBestRuleForUrls(rules, [
      'https://storage.provider.test/result.pdf',
      'https://www.ilovepdf.com/merge_pdf',
    ]);

    expect(match?.rule.domainPattern).toBe('ilovepdf.com');
    expect(match?.hostname).toBe('ilovepdf.com');
  });
});
