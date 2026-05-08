import { MAIN_DOMAIN } from '@/lib/seo/constants';

const MAX_URL_LEN = 2048;

/**
 * Normaliseert een afbeeldings-URL voor FCM: alleen publieke HTTPS (geen data:/blob:/file:,
 * geen http). Relatieve paden worden tegen MAIN_DOMAIN gezet.
 * HTTP wordt naar HTTPS gezet voor niet-local hosts (o.a. oude OAuth-avatar-URL's).
 * Paden zonder leading slash (bv. `uploads/profile/x`) worden ook resolved.
 */
export function resolveHttpsPublicImageUrlForFcm(
  raw: string | null | undefined
): string | null {
  if (raw == null || typeof raw !== 'string') return null;
  const u = raw.trim();
  if (!u || u.length > MAX_URL_LEN) return null;
  const lower = u.toLowerCase();
  if (
    lower.startsWith('data:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('file:') ||
    lower.startsWith('javascript:')
  ) {
    return null;
  }

  let href: string;

  if (u.startsWith('//')) {
    href = `https:${u}`;
  } else if (u.startsWith('https://')) {
    href = u;
  } else if (u.startsWith('http://')) {
    try {
      const p = new URL(u);
      if (
        p.hostname === 'localhost' ||
        p.hostname === '127.0.0.1' ||
        p.hostname.endsWith('.local')
      ) {
        return null;
      }
      p.protocol = 'https:';
      href = p.href;
    } catch {
      return null;
    }
  } else if (u.startsWith('/')) {
    try {
      href = new URL(u, MAIN_DOMAIN).href;
    } catch {
      return null;
    }
  } else {
    try {
      const path = `/${u.replace(/^\/+/, '')}`;
      href = new URL(path, MAIN_DOMAIN).href;
    } catch {
      return null;
    }
  }

  try {
    const parsed = new URL(href);
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname;
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.local')
    ) {
      return null;
    }
    return href;
  } catch {
    return null;
  }
}

/** Profielfoto vóór OAuth-avatar (`image`). */
export function pickSenderAvatarUrlForFcm(
  profileImage: string | null | undefined,
  oauthImage: string | null | undefined
): string | null {
  return (
    resolveHttpsPublicImageUrlForFcm(profileImage) ||
    resolveHttpsPublicImageUrlForFcm(oauthImage)
  );
}
