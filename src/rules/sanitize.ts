const INVALID_PATH_SEGMENT_CHARS = /[<>:"|?*\u0000-\u001f\u007f]/g;
const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

export function getBaseFilename(input: string | undefined | null): string {
  const raw = input?.trim() ?? '';

  if (!raw) {
    return 'download';
  }

  const normalized = raw.replace(/\\/g, '/');
  const lastSegment = normalized.split('/').filter(Boolean).pop() ?? raw;

  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
}

export function sanitizeFilename(input: string | undefined | null): string {
  return sanitizePathSegment(getBaseFilename(input), 'download');
}

export function sanitizeFolderPath(input: string): string {
  return input
    .split(/[\\/]+/)
    .map((segment) => sanitizePathSegment(segment, ''))
    .filter(Boolean)
    .join('/');
}

export function joinRoutedFilename(folderPath: string, filename: string): string {
  const safeFolder = sanitizeFolderPath(folderPath);
  const safeFilename = sanitizeFilename(filename);

  return safeFolder ? `${safeFolder}/${safeFilename}` : safeFilename;
}

export function sanitizePathSegment(
  input: string | undefined | null,
  fallback = 'untitled',
): string {
  const cleaned = (input ?? '')
    .trim()
    .replace(/[\\/]+/g, '-')
    .replace(INVALID_PATH_SEGMENT_CHARS, '-')
    .replace(/\s+/g, ' ')
    .replace(/^\.+$/, '')
    .replace(/[. ]+$/g, '')
    .replace(/^-+|-+$/g, '');

  const safe = cleaned || fallback;

  if (!safe) {
    return '';
  }

  return WINDOWS_RESERVED_NAMES.test(safe) ? `_${safe}` : safe;
}
