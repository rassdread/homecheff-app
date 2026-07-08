/**
 * Reverse discovery session — Phase 8C.
 * Persists what the viewer can offer for proposal prefill continuity.
 */

const STORAGE_KEY = 'homecheff_reverse_discovery_offer_v1';

export type ReverseDiscoverySession = {
  offerIds: string[];
  updatedAt: number;
};

export function syncReverseDiscoveryOfferIds(offerIds: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (offerIds.length === 0) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    const payload: ReverseDiscoverySession = {
      offerIds: [...new Set(offerIds)],
      updatedAt: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function peekReverseDiscoveryOfferIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReverseDiscoverySession;
    return Array.isArray(parsed.offerIds)
      ? parsed.offerIds.filter((id) => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

export function clearReverseDiscoverySession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
