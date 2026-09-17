import { AFFILIATE_MEDIA_DESTINATION_PATHS } from '@/lib/affiliate-media/constants';

const ALLOWED = new Set<string>(AFFILIATE_MEDIA_DESTINATION_PATHS);

/** Only same-origin HomeCheff paths. Never an external URL. */
export function sanitizeDestinationPath(raw: string | null | undefined): string | null {
  const value = String(raw || '/').trim() || '/';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')) {
    return null;
  }
  if (value.includes('\\') || value.includes('\0') || value.includes('://')) return null;
  const path = value.startsWith('/') ? value : `/${value}`;
  const noQuery = path.split('?')[0]?.split('#')[0] || '/';
  const normalized = noQuery.replace(/\/+$/, '') || '/';
  if (!ALLOWED.has(normalized)) return null;
  return normalized;
}

export function isAllowlistedDestinationPath(path: string): boolean {
  return sanitizeDestinationPath(path) !== null;
}
