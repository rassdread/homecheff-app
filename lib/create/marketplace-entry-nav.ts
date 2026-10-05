import {
  buildSellNewSearchFromIntent,
  type CreateFlowIntent,
} from '@/lib/createFlowIntent';

/** Default route for Marketplace Entry Flow V3 */
export const MARKETPLACE_ENTRY_PATH = '/sell/new';

/**
 * Offer a service. Intent is already an offer, and the category opens the
 * existing service accordion (practical, knowledge, artistic, and design work).
 * /sell stays the plan page.
 */
export const CANONICAL_SERVICE_CREATE_ROUTE =
  '/sell/new?intent=OFFER&marketplaceCategory=PRACTICAL_SERVICE';

/** Legacy 6-tile Chef/Garden/Designer hub (debug / fallback only) */
export const LEGACY_SELL_HUB_PATH = '/sell/new?wizard=1';

export function marketplaceEntryHref(
  intent?: CreateFlowIntent | null,
): string {
  const suffix = buildSellNewSearchFromIntent(intent ?? null);
  return `${MARKETPLACE_ENTRY_PATH}${suffix}`;
}
