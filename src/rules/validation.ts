import type { RuleDraft, RuleMatchType } from '../shared/types';
import { sanitizeFolderPath } from './sanitize';

const MATCH_TYPES: RuleMatchType[] = ['domain', 'wildcard', 'urlContains'];

export type RuleValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateRuleDraft(rule: RuleDraft): RuleValidationResult {
  const errors: string[] = [];
  const domainPattern = rule.domainPattern.trim();
  const folderPath = rule.folderPath.trim();

  if (!rule.name.trim()) {
    errors.push('Rule name is required.');
  }

  if (!domainPattern) {
    errors.push('Domain or URL pattern is required.');
  }

  if (!MATCH_TYPES.includes(rule.matchType)) {
    errors.push('Match type is invalid.');
  }

  if (!folderPath) {
    errors.push('Folder path is required.');
  }

  if (isAbsolutePath(folderPath)) {
    errors.push('Folder path must be relative to the browser download directory.');
  }

  if (hasPathTraversal(folderPath)) {
    errors.push('Folder path cannot include .. path traversal.');
  }

  if (folderPath && !sanitizeFolderPath(folderPath)) {
    errors.push('Folder path must contain at least one safe folder name.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function isAbsolutePath(path: string): boolean {
  const trimmed = path.trim();

  return (
    /^[a-z]:[\\/]/i.test(trimmed) ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('\\') ||
    trimmed.startsWith('~') ||
    /^file:\/\//i.test(trimmed)
  );
}

export function hasPathTraversal(path: string): boolean {
  return path
    .replace(/\\/g, '/')
    .split('/')
    .some((segment) => segment.trim() === '..');
}
