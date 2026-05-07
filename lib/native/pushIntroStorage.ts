/**
 * Per-gebruiker: één keer automatisch push-uitleg tonen (native); daarna alleen via instellingen.
 * Key matcht geen session-cleanup patronen (geen "token" substring).
 */

const STORAGE_KEY = "hc_npush_intro";

export type PushIntroRecord = {
  userId: string;
  finished: boolean;
};

export function getPushIntroRecord(): PushIntroRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw) as PushIntroRecord;
    if (!rec.userId) return null;
    return rec;
  } catch {
    return null;
  }
}

/** Automatische modal: andere gebruiker op zelfde device → opnieuw aanbieden. */
export function shouldOfferPushIntroAuto(userId: string): boolean {
  const rec = getPushIntroRecord();
  if (!rec) return true;
  if (rec.userId !== userId) return true;
  return !rec.finished;
}

export function markPushIntroFinished(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PushIntroRecord = { userId, finished: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}
