import {
  sanitizeVerdienCheckEntryPoint,
  type VerdienCheckEntryPoint,
} from '@/lib/verdiencheck/privacy/analytics-guard';

/** Known VerdienCheck entry points that correspond to a real HomeCheff page. */
const ENTRY_RETURN_PATHS: Partial<Record<VerdienCheckEntryPoint, string>> = {
  faq: '/faq',
  seller: '/sell',
  careers: '/careers',
  'werken-bij': '/werken-bij',
};

/**
 * Internal path only. Rejects protocol-relative URLs, other origins, and
 * returning into the check itself.
 */
export function safeInternalReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  if (value.includes('\\') || value.includes('://')) return null;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('://') || decoded.includes('\\')) {
    return null;
  }
  if (decoded.includes('..')) return null;
  const pathOnly = decoded.split(/[?#]/)[0] ?? '';
  if (pathOnly === '/verdiencheck' || pathOnly.startsWith('/verdiencheck/')) return null;
  const hashAt = value.indexOf('#');
  return hashAt >= 0 ? value.slice(0, hashAt) : value;
}

export function referrerPathFromUrl(referrer: string | null | undefined, origin: string): string | null {
  if (!referrer || !origin) return null;
  try {
    const url = new URL(referrer);
    if (url.origin !== origin) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

/**
 * returnTo wins, then a path-shaped from, then a known entry page, then a
 * same-origin referrer, otherwise the homepage.
 */
export function resolveVerdienCheckReturnPath(input: {
  returnTo?: string | null;
  from?: string | null;
  referrerPath?: string | null;
}): string {
  const explicit = safeInternalReturnPath(input.returnTo);
  if (explicit) return explicit;
  const fromPath = safeInternalReturnPath(input.from);
  if (fromPath) return fromPath;
  if (input.from && input.from.trim().startsWith('/')) return '/';
  const entry = sanitizeVerdienCheckEntryPoint(input.from);
  if (input.from && entry !== 'direct') {
    return ENTRY_RETURN_PATHS[entry] ?? '/';
  }
  const referrer = safeInternalReturnPath(input.referrerPath);
  if (referrer) return referrer;
  return '/';
}
