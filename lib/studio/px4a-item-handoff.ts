/**
 * PX.4A.4 — HomeCheff Item toevoegen → Studio photo-video handoff (client-safe).
 * Photos are HTTPS listing URLs only. No title, description, or bytes in the token body
 * beyond those URLs. HMAC lives in px4a-item-handoff-hmac.ts (server-only).
 */

import { studioOrigin } from '@/lib/studio/px4-source-context';

export const PX4A_ITEM_HANDOFF_PATH = '/api/photo-video/item-handoff';
export const PX4A_ITEM_RETURN_PATH = '/sell/new';
export const PX4A_ITEM_TTL_SEC = 2 * 60 * 60;
export const PX4A_ITEM_MAX_PHOTOS = 12;
export const PX4A_ITEM_MAX_TOKEN_CHARS = 3500;

export type Px4aItemHandoffPayload = {
  v: 1;
  u: string;
  p: string[];
  e: number;
  r: string;
};

export function isHttpsListingUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeItemPhotoUrls(urls: unknown, cap = PX4A_ITEM_MAX_PHOTOS): string[] {
  if (!Array.isArray(urls)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of urls) {
    if (out.length >= cap) break;
    const url = typeof raw === 'string' ? raw.trim() : '';
    if (!url || seen.has(url) || !isHttpsListingUrl(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

export function normalizeItemReturnPath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://')) return null;
  const pathname = trimmed.split('?')[0] ?? trimmed;
  if (pathname !== PX4A_ITEM_RETURN_PATH) return null;
  return PX4A_ITEM_RETURN_PATH;
}

export function canonicalItemHandoffBody(payload: Px4aItemHandoffPayload): string {
  return JSON.stringify({
    e: payload.e,
    p: payload.p,
    r: payload.r,
    u: payload.u,
    v: 1,
  });
}

export function parseItemHandoffPayload(raw: unknown): Px4aItemHandoffPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  if (rec.v !== 1) return null;
  if (typeof rec.u !== 'string' || !rec.u.trim()) return null;
  if (typeof rec.e !== 'number' || !Number.isFinite(rec.e)) return null;
  if (typeof rec.r !== 'string') return null;
  const r = normalizeItemReturnPath(rec.r);
  const p = normalizeItemPhotoUrls(rec.p);
  if (!r) return null;
  return { v: 1, u: rec.u.trim(), p, e: rec.e, r };
}

export function isItemHandoffTokenSizeOk(token: string): boolean {
  return token.length > 0 && token.length <= PX4A_ITEM_MAX_TOKEN_CHARS;
}

export function studioItemHandoffAction(): string {
  return `${studioOrigin()}${PX4A_ITEM_HANDOFF_PATH}`;
}

export function isTrustedStudioHandoffAction(action: string): boolean {
  try {
    const url = new URL(action);
    const expected = new URL(studioItemHandoffAction());
    return url.origin === expected.origin && url.pathname === expected.pathname;
  } catch {
    return false;
  }
}

export function isPx4aItemReturnSearch(search: string): boolean {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return params.get('px4a') === '1' || params.has('px4aResult');
}

export function px4aItemReturnResult(search: string): 'ready' | 'cancel' | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const value = params.get('px4aResult');
  if (value === 'ready' || value === 'cancel') return value;
  return null;
}
