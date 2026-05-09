'use client';

import { setReferralCookie } from '@/lib/affiliate-attribution';

export const HOMECHEFF_REF_KEY = 'homecheff_ref';
export const HOMECHEFF_REF_SOURCE_KEY = 'homecheff_ref_source';
export const HOMECHEFF_REF_CREATED_AT_KEY = 'homecheff_ref_created_at';
export const HOMECHEFF_BETA_INTENT_KEY = 'homecheff_beta_intent';

const ANDROID_BETA_SOURCE = 'android_beta_download';

export function setBetaIntentFlag(): void {
  try {
    localStorage.setItem(HOMECHEFF_BETA_INTENT_KEY, '1');
  } catch {
    /* ignore */
  }
  if (typeof window === 'undefined') return;
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `hc_beta_intent=1; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secure}`;
}

/** Zet hc_beta_src — alleen op /app aanroepen zodat signup-attributie ANDROID_BETA_DOWNLOAD kan zijn. */
export function setAndroidBetaSourceCookie(): void {
  if (typeof window === 'undefined') return;
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `hc_beta_src=${ANDROID_BETA_SOURCE}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secure}`;
}

export function persistHomecheffRefStorage(ref: string): void {
  const trimmed = ref.trim();
  if (!trimmed) return;
  try {
    localStorage.setItem(HOMECHEFF_REF_KEY, trimmed);
    localStorage.setItem(HOMECHEFF_REF_SOURCE_KEY, ANDROID_BETA_SOURCE);
    localStorage.setItem(HOMECHEFF_REF_CREATED_AT_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
}

/** Synchroniseert hc_ref → localStorage voor subtiele landing-copy (geen extra API). */
export function syncHomecheffRefFromHcRefCookie(): void {
  if (typeof document === 'undefined') return;
  const raw = document.cookie.split(';').map((p) => p.trim());
  for (const part of raw) {
    if (!part.startsWith('hc_ref=')) continue;
    const v = decodeURIComponent(part.slice('hc_ref='.length).trim());
    if (v) persistHomecheffRefStorage(v);
    break;
  }
}

export function applyReferralFromQuery(refOrCode: string | null | undefined): void {
  const v = refOrCode?.trim();
  if (!v) return;
  setReferralCookie(v);
  persistHomecheffRefStorage(v);
}
