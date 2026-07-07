/**
 * Pick up to N user-facing signal labels for exchange suggestion cards.
 * Uses existing marketplace.exchange.signals.* i18n — no scores or ranking.
 */

import type { ExchangeSignalKind } from '@/lib/marketplace/exchange/exchange-signals';

const SIGNAL_LABEL_KEYS: Record<ExchangeSignalKind, string> = {
  EXACT_DESIRED_MATCH: 'marketplace.exchange.signals.exactDesiredMatch',
  STRONG_CATEGORY_OVERLAP: 'marketplace.exchange.signals.strongCategoryOverlap',
  POTENTIAL_BARTER_OPPORTUNITY: 'marketplace.exchange.signals.potentialBarter',
  MUTUAL_EXCHANGE_READINESS: 'marketplace.exchange.signals.mutualReadiness',
  FUTURE_RECOMMENDATION_READY: 'marketplace.exchange.signals.futureRecommendationReady',
};

/** Higher priority signals shown first (max 2 on card). */
const SIGNAL_DISPLAY_PRIORITY: ExchangeSignalKind[] = [
  'EXACT_DESIRED_MATCH',
  'MUTUAL_EXCHANGE_READINESS',
  'STRONG_CATEGORY_OVERLAP',
  'POTENTIAL_BARTER_OPPORTUNITY',
  'FUTURE_RECOMMENDATION_READY',
];

export function pickDisplaySignalLabelKeys(
  signalKinds: readonly ExchangeSignalKind[],
  max = 2,
): string[] {
  const present = new Set(signalKinds);
  const out: string[] = [];
  for (const kind of SIGNAL_DISPLAY_PRIORITY) {
    if (!present.has(kind)) continue;
    out.push(SIGNAL_LABEL_KEYS[kind]);
    if (out.length >= max) break;
  }
  return out;
}
