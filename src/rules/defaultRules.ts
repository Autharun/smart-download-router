import type { DownloadRule } from '../shared/types';

const DEFAULT_TIMESTAMP = '2026-01-01T00:00:00.000Z';

export const DEFAULT_RULES: DownloadRule[] = [
  {
    id: 'sample-ilovepdf-dump',
    name: 'iLovePDF dump',
    enabled: true,
    domainPattern: 'ilovepdf.com',
    folderPath: 'dump',
    matchType: 'domain',
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
  },
  {
    id: 'sample-smallpdf-dump',
    name: 'Smallpdf dump',
    enabled: true,
    domainPattern: 'smallpdf.com',
    folderPath: 'dump',
    matchType: 'domain',
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
  },
  {
    id: 'sample-chaicode-notes',
    name: 'Cohort notes',
    enabled: true,
    domainPattern: 'chaicode.com',
    folderPath: 'cohort/notes',
    matchType: 'domain',
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
  },
];

export function createDefaultRules(): DownloadRule[] {
  return DEFAULT_RULES.map((rule) => ({ ...rule }));
}
