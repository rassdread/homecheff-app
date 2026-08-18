/**
 * PX.4A.5 — HTTPS listing-video pointer only. Never the File/Blob.
 */

export const PX4A_EXPORT_ATTACH_PATH = '/api/studio/px4a-export-attach';
export const PX4A_EXPORT_ATTACH_TTL_SEC = 20 * 60;
export const PX4A_EXPORT_ATTACH_MAX_TOKEN_CHARS = 8000;
export const PX4A_EXPORT_VIDEO_STORAGE_KEY = 'hc-px4a-export-video:v1';

export type Px4aExportAttachPayload = {
  v: 1;
  kind: 'export-attach';
  u: string;
  videoUrl: string;
  duration: number;
  thumb: string | null;
  e: number;
  r: '/sell/new';
};

export type Px4aExportVideoPending = {
  v: 1;
  url: string;
  duration: number;
  thumb: string | null;
};

export type ListingVideoRef = {
  url: string;
  thumbnail?: string | null;
  duration?: number | null;
};

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value.trim()).protocol === 'https:';
  } catch {
    return false;
  }
}

export function isAllowedExportVideoUrl(value: string): boolean {
  if (!isHttpsUrl(value)) return false;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return (
      host.endsWith('.blob.vercel-storage.com') ||
      host.endsWith('.public.blob.vercel-storage.com') ||
      host === 'blob.vercel-storage.com'
    );
  } catch {
    return false;
  }
}

export function canonicalExportAttachBody(payload: Px4aExportAttachPayload): string {
  return JSON.stringify({
    duration: payload.duration,
    e: payload.e,
    kind: 'export-attach',
    r: payload.r,
    thumb: payload.thumb,
    u: payload.u,
    v: 1,
    videoUrl: payload.videoUrl,
  });
}

export function parseExportAttachPayload(raw: unknown): Px4aExportAttachPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  if (rec.v !== 1 || rec.kind !== 'export-attach') return null;
  if (typeof rec.u !== 'string' || !rec.u.trim()) return null;
  if (typeof rec.e !== 'number' || !Number.isFinite(rec.e)) return null;
  if (rec.r !== '/sell/new') return null;
  if (typeof rec.videoUrl !== 'string' || !isAllowedExportVideoUrl(rec.videoUrl)) return null;
  if (typeof rec.duration !== 'number' || !Number.isFinite(rec.duration) || rec.duration <= 0 || rec.duration > 30.35) {
    return null;
  }
  const thumb =
    rec.thumb == null ? null : typeof rec.thumb === 'string' && isHttpsUrl(rec.thumb) ? rec.thumb : null;
  return {
    v: 1,
    kind: 'export-attach',
    u: rec.u.trim(),
    videoUrl: rec.videoUrl.trim(),
    duration: rec.duration,
    thumb,
    e: rec.e,
    r: '/sell/new',
  };
}

export function isExportAttachTokenSizeOk(token: string): boolean {
  return token.length > 0 && token.length <= PX4A_EXPORT_ATTACH_MAX_TOKEN_CHARS;
}

export function parseExportVideoPending(raw: unknown): Px4aExportVideoPending | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  if (rec.v !== 1) return null;
  if (typeof rec.url !== 'string' || !isAllowedExportVideoUrl(rec.url)) return null;
  if (typeof rec.duration !== 'number' || rec.duration <= 0 || rec.duration > 30.35) return null;
  const thumb = rec.thumb == null ? null : typeof rec.thumb === 'string' && isHttpsUrl(rec.thumb) ? rec.thumb : null;
  return { v: 1, url: rec.url.trim(), duration: rec.duration, thumb };
}

export function readPx4aExportVideo(): Px4aExportVideoPending | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PX4A_EXPORT_VIDEO_STORAGE_KEY);
    if (!raw) return null;
    return parseExportVideoPending(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writePx4aExportVideo(pending: Px4aExportVideoPending): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(PX4A_EXPORT_VIDEO_STORAGE_KEY, JSON.stringify(pending));
}

export function clearPx4aExportVideo(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(PX4A_EXPORT_VIDEO_STORAGE_KEY);
}

export function nextListingVideoAfterExport(input: {
  existing: ListingVideoRef | null;
  cancelled: boolean;
  exportOk: boolean;
  generated: ListingVideoRef | null;
}): ListingVideoRef | null {
  if (input.cancelled || !input.exportOk || !input.generated?.url) return input.existing;
  return input.generated;
}
