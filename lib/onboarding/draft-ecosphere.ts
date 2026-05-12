/**
 * Centralised draft keys for create / inspiration / affiliate flows.
 * Wraps existing storage keys — migrate call sites gradually.
 */

import { HC_CREATE_FLOW_INTENT_KEY } from '@/lib/createFlowIntent';
import { REGISTER_DRAFT_STORAGE_KEY } from '@/lib/auth/post-auth-redirect';

export const DRAFT_KEYS = {
  createFlowIntent: HC_CREATE_FLOW_INTENT_KEY,
  registerDraft: REGISTER_DRAFT_STORAGE_KEY,
  pendingProductPhoto: 'pendingProductPhoto',
  recipeToProductData: 'recipeToProductData',
  gardenToProductData: 'gardenToProductData',
  designToProductData: 'designToProductData',
  designFormDraft: 'designFormDraft',
  pendingInspiratiePhoto: 'pendingInspiratiePhoto',
  inspiratieToProductData: 'inspiratieToProductData',
} as const;

export type DraftStore = 'session' | 'local';

export function saveDraft(
  key: keyof typeof DRAFT_KEYS,
  value: string,
  store: DraftStore = 'session',
): void {
  if (typeof window === 'undefined') return;
  const k = DRAFT_KEYS[key];
  try {
    if (store === 'local') window.localStorage.setItem(k, value);
    else window.sessionStorage.setItem(k, value);
  } catch {
    /* quota */
  }
}

export function restoreDraft(
  key: keyof typeof DRAFT_KEYS,
  store: DraftStore = 'session',
): string | null {
  if (typeof window === 'undefined') return null;
  const k = DRAFT_KEYS[key];
  try {
    return store === 'local' ? window.localStorage.getItem(k) : window.sessionStorage.getItem(k);
  } catch {
    return null;
  }
}

export function clearDraft(key: keyof typeof DRAFT_KEYS, store: DraftStore = 'session'): void {
  if (typeof window === 'undefined') return;
  const k = DRAFT_KEYS[key];
  try {
    if (store === 'local') window.localStorage.removeItem(k);
    else window.sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

/** Lists known draft keys present for debugging or “resume all” UX (no secrets). */
export function getDraftsByUser(): { key: string; store: DraftStore; present: boolean }[] {
  if (typeof window === 'undefined') return [];
  const out: { key: string; store: DraftStore; present: boolean }[] = [];
  for (const [name, key] of Object.entries(DRAFT_KEYS)) {
    let s = false;
    let l = false;
    try {
      s = !!sessionStorage.getItem(key);
      l = !!localStorage.getItem(key);
    } catch {
      /* ignore */
    }
    if (s) out.push({ key: `${name}:${key}`, store: 'session', present: true });
    if (l) out.push({ key: `${name}:${key}`, store: 'local', present: true });
  }
  return out;
}
