/**
 * Rate-limited client/server-safe image load diagnostics (no full URLs in logs by default).
 */

const lastAt = new Map<string, number>();

export function logImageLoadDiag(
  event: 'image_invalid_source' | 'image_optimizer_rejected' | 'image_missing_blob',
  extra: Record<string, string | number | boolean | undefined> = {},
  rateLimitMs = 120_000,
): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${event}:${extra.kind ?? ''}`;
    const now = Date.now();
    if (now - (lastAt.get(key) ?? 0) < rateLimitMs) return;
    lastAt.set(key, now);
    const host =
      typeof extra.host === 'string' ? extra.host.slice(0, 80) : undefined;
    console.warn(
      '[image_diag]',
      JSON.stringify({ event, ts: now, ...extra, host }),
    );
  } catch {
    /* ignore */
  }
}

export function safeImageHostHint(src: string): string | undefined {
  try {
    if (!src || src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:')) {
      return undefined;
    }
    return new URL(src).hostname;
  } catch {
    return 'invalid_url';
  }
}

export function isLikelyRenderableImageSrc(src: string | null | undefined): boolean {
  if (src == null) return false;
  const s = String(src).trim();
  if (!s) return false;
  if (s.startsWith('/') || s.startsWith('data:') || s.startsWith('blob:')) return true;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}
