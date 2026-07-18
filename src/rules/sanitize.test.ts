import { describe, expect, it } from 'vitest';
import { hasPathTraversal, isAbsolutePath, validateRuleDraft } from './validation';
import {
  getBaseFilename,
  joinRoutedFilename,
  sanitizeFilename,
  sanitizeFolderPath,
} from './sanitize';

describe('filename and folder sanitization', () => {
  it('extracts and sanitizes base filenames', () => {
    expect(getBaseFilename('C:\\Users\\Me\\Downloads\\report.pdf')).toBe('report.pdf');
    expect(sanitizeFilename('../bad:name?.pdf')).toBe('bad-name-.pdf');
    expect(sanitizeFilename('CON')).toBe('_CON');
  });

  it('sanitizes nested relative folder paths', () => {
    expect(sanitizeFolderPath(' cohort\\\\notes / week:1 ')).toBe('cohort/notes/week-1');
  });

  it('joins a safe relative folder and filename', () => {
    expect(joinRoutedFilename('dump', 'chapter-1.pdf')).toBe('dump/chapter-1.pdf');
    expect(joinRoutedFilename('cohort/notes', 'bad:file?.pdf')).toBe('cohort/notes/bad-file-.pdf');
  });
});

describe('rule validation', () => {
  it('rejects absolute paths and traversal', () => {
    expect(isAbsolutePath('C:/Users/me/Desktop/dump')).toBe(true);
    expect(isAbsolutePath('/Users/me/Desktop/dump')).toBe(true);
    expect(hasPathTraversal('cohort/../secrets')).toBe(true);

    const result = validateRuleDraft({
      name: 'Bad rule',
      enabled: true,
      domainPattern: 'example.com',
      folderPath: '../dump',
      matchType: 'domain',
    });

    expect(result.valid).toBe(false);
  });

  it('accepts relative download subfolders', () => {
    const result = validateRuleDraft({
      name: 'Good rule',
      enabled: true,
      domainPattern: 'example.com',
      folderPath: 'cohort/notes',
      matchType: 'domain',
    });

    expect(result.valid).toBe(true);
  });
});
