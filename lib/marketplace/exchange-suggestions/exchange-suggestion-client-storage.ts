/**
 * Client-side cap / dismiss persistence for exchange suggestions.
 */

import type { ExchangeSuggestionCapState } from './exchange-suggestion-contract';
import { EXCHANGE_SUGGESTION_CAPS } from './exchange-suggestion-caps';

const PREFIX = 'hc:exchange-suggestions';
const SESSION_KEY = `${PREFIX}:session`;
const DISMISS_KEY = `${PREFIX}:dismissed`;
const SELLER_DAY_KEY = `${PREFIX}:seller-day`;
const SNOOZE_KEY = `${PREFIX}:snooze`;

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
    /* ignore */
  }
}

export function readExchangeSuggestionCapState(): ExchangeSuggestionCapState {
  const session =
    readJson<{ impressionCount: number; dismissCount: number }>(SESSION_KEY) ?? {
      impressionCount: 0,
      dismissCount: 0,
    };
  const dismissed = readJson<Record<string, string>>(DISMISS_KEY) ?? {};
  const sellerDay =
    readJson<{ date: string; counts: Record<string, number> }>(SELLER_DAY_KEY) ??
    null;
  const today = new Date().toISOString().slice(0, 10);
  const sellerImpressionsToday =
    sellerDay?.date === today ? sellerDay.counts : {};

  const activeDismissed = Object.entries(dismissed)
    .filter(([, until]) => new Date(until).getTime() > Date.now())
    .map(([id]) => id);

  const snoozeUntil = readJson<string | null>(SNOOZE_KEY);

  return {
    sessionImpressionCount: session.impressionCount,
    dismissedSuggestionIds: activeDismissed,
    sellerImpressionsToday,
    globalSnoozeUntil: snoozeUntil,
  };
}

export function recordExchangeSuggestionImpression(
  sellerUserId: string,
  count = 1,
): void {
  const session =
    readJson<{ impressionCount: number; dismissCount: number }>(SESSION_KEY) ?? {
      impressionCount: 0,
      dismissCount: 0,
    };
  session.impressionCount += count;
  writeJson(SESSION_KEY, session);

  const today = new Date().toISOString().slice(0, 10);
  const sellerDay =
    readJson<{ date: string; counts: Record<string, number> }>(SELLER_DAY_KEY) ??
    { date: today, counts: {} };
  if (sellerDay.date !== today) {
    sellerDay.date = today;
    sellerDay.counts = {};
  }
  sellerDay.counts[sellerUserId] = (sellerDay.counts[sellerUserId] ?? 0) + count;
  writeJson(SELLER_DAY_KEY, sellerDay);
}

export function recordExchangeSuggestionDismissed(suggestionId: string): void {
  const session =
    readJson<{ impressionCount: number; dismissCount: number }>(SESSION_KEY) ?? {
      impressionCount: 0,
      dismissCount: 0,
    };
  session.dismissCount += 1;
  writeJson(SESSION_KEY, session);

  const dismissed = readJson<Record<string, string>>(DISMISS_KEY) ?? {};
  const until = new Date();
  until.setDate(until.getDate() + EXCHANGE_SUGGESTION_CAPS.dismissCooldownDays);
  dismissed[suggestionId] = until.toISOString();
  writeJson(DISMISS_KEY, dismissed);

  if (session.dismissCount >= EXCHANGE_SUGGESTION_CAPS.globalSnoozeDismissCount) {
    const snooze = new Date();
    snooze.setHours(
      snooze.getHours() + EXCHANGE_SUGGESTION_CAPS.globalSnoozeHours,
    );
    writeJson(SNOOZE_KEY, snooze.toISOString());
  }
}

export function resetExchangeSuggestionSessionForTests(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(DISMISS_KEY);
  localStorage.removeItem(SELLER_DAY_KEY);
  localStorage.removeItem(SNOOZE_KEY);
}
