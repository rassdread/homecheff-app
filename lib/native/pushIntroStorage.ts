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

/** Voorkomt dat NativePushTokenSync parallel register() aanroept tijdens onboarding-flow. */
const SYNC_HOLD_KEY = "hc_npush_sync_hold";

export function setNativePushSyncHold(active: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (active) {
      sessionStorage.setItem(SYNC_HOLD_KEY, "1");
    } else {
      sessionStorage.removeItem(SYNC_HOLD_KEY);
    }
  } catch {
    /* ignore */
  }
}

export async function waitUntilNativePushSyncHoldReleased(): Promise<void> {
  if (typeof window === "undefined") return;
  for (;;) {
    try {
      if (sessionStorage.getItem(SYNC_HOLD_KEY) !== "1") {
        break;
      }
    } catch {
      break;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
}
