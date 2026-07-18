import { describe, expect, it } from 'vitest';
import type { DownloadRule } from '../shared/types';
import { createDownloadRoute, getDownloadSourceUrls } from './downloadRouter';

const rule: DownloadRule = {
  id: 'rule-1',
  name: 'iLovePDF',
  enabled: true,
  domainPattern: 'ilovepdf.com',
  folderPath: 'dump',
  matchType: 'domain',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('getDownloadSourceUrls', () => {
  it('uses download URL, final URL, and referrer when available', () => {
    expect(
      getDownloadSourceUrls({
        filename: 'chapter.pdf',
        url: 'https://download.test/chapter.pdf',
        finalUrl: 'https://cdn.test/chapter.pdf',
        referrer: 'https://ilovepdf.com/merge_pdf',
      }),
    ).toEqual([
      'https://download.test/chapter.pdf',
      'https://cdn.test/chapter.pdf',
      'https://ilovepdf.com/merge_pdf',
    ]);
  });
});

describe('createDownloadRoute', () => {
  it('creates a Chrome filename suggestion for matching downloads', () => {
    const route = createDownloadRoute(
      {
        filename: 'chapter-1.pdf',
        url: 'https://storage.test/chapter-1.pdf',
        referrer: 'https://www.ilovepdf.com/merge_pdf',
      },
      [rule],
    );

    expect(route?.suggestion).toEqual({
      filename: 'dump/chapter-1.pdf',
      conflictAction: 'uniquify',
    });
    expect(route?.recentRoute.ruleName).toBe('iLovePDF');
  });

  it('returns null when no enabled rule matches', () => {
    expect(
      createDownloadRoute(
        {
          filename: 'chapter-1.pdf',
          url: 'https://example.com/chapter-1.pdf',
        },
        [rule],
      ),
    ).toBeNull();
  });
});
