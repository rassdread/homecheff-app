/**
 * Activity card client persistence — dismiss, cooldown, session cap.
 */

import type { ActivityCardType } from './activity-card-contract';
import type { ActivityCardCooldownState } from './resolve-activity-card-contracts';
import { ACTIVITY_CARD_DISMISS_STORAGE } from './activity-card-anti-spam';

const SESSION_KEY = `${ACTIVITY_CARD_DISMISS_STORAGE.prefix}:session`;
const COOLDOWN_KEY = `${ACTIVITY_CARD_DISMISS_STORAGE.prefix}:cooldowns`;
const REPEAT_COOLDOWN_DAYS = 7;

export type ActivityCardSessionState = {
  shownTypes: ActivityCardType[];
  dismissedTypes: ActivityCardType[];
  startedAt: string;
};

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function readActivityCardSessionState(): ActivityCardSessionState {
  return (
    readJson<ActivityCardSessionState>(SESSION_KEY) ?? {
      shownTypes: [],
      dismissedTypes: [],
      startedAt: new Date().toISOString(),
    }
  );
}

export function resetActivityCardSessionState(): void {
  writeJson(SESSION_KEY, {
    shownTypes: [],
    dismissedTypes: [],
    startedAt: new Date().toISOString(),
  });
}

export function recordActivityCardShown(type: ActivityCardType): void {
  const session = readActivityCardSessionState();
  if (!session.shownTypes.includes(type)) {
    session.shownTypes.push(type);
  }
  writeJson(SESSION_KEY, session);

  const cooldowns = readActivityCardCooldownState();
  cooldowns[type] = {
    dismissedAt: cooldowns[type]?.dismissedAt ?? null,
    lastShownAt: new Date().toISOString(),
  };
  writeJson(COOLDOWN_KEY, cooldowns);
}

export function recordActivityCardDismissed(type: ActivityCardType): void {
  const session = readActivityCardSessionState();
  if (!session.dismissedTypes.includes(type)) {
    session.dismissedTypes.push(type);
  }
  writeJson(SESSION_KEY, session);

  const cooldowns = readActivityCardCooldownState();
  cooldowns[type] = {
    dismissedAt: new Date().toISOString(),
    lastShownAt: cooldowns[type]?.lastShownAt ?? null,
  };
  writeJson(COOLDOWN_KEY, cooldowns);
}

export function readActivityCardCooldownState(): ActivityCardCooldownState {
  return readJson<ActivityCardCooldownState>(COOLDOWN_KEY) ?? {};
}

export function filterCardsForSession<T extends { type?: string }>(
  cards: T[],
  maxSession: number,
  maxVisible: number,
): T[] {
  const session = readActivityCardSessionState();
  const cooldowns = readActivityCardCooldownState();
  const now = Date.now();

  const deduped = cards.filter((card) => {
    const type = card.type as ActivityCardType | undefined;
    if (!type) return true;
    if (session.dismissedTypes.includes(type)) return false;
    if (session.shownTypes.includes(type)) return false;
    const entry = cooldowns[type];
    if (!entry) return true;
    const ts = Math.max(
      entry.dismissedAt ? Date.parse(entry.dismissedAt) : 0,
      entry.lastShownAt ? Date.parse(entry.lastShownAt) : 0,
    );
    if (!Number.isFinite(ts)) return true;
    return now - ts >= REPEAT_COOLDOWN_DAYS * 86_400_000;
  });

  const remainingBudget = Math.max(
    0,
    maxSession - session.shownTypes.length,
  );
  return deduped.slice(0, Math.min(maxVisible, remainingBudget));
}
