import {
  buildSellNewSearchFromIntent,
  type CreateFlowIntent,
} from '@/lib/createFlowIntent';

/** Default route for Marketplace Entry Flow V3 */
export const MARKETPLACE_ENTRY_PATH = '/sell/new';

/** Legacy 6-tile Chef/Garden/Designer hub (debug / fallback only) */
export const LEGACY_SELL_HUB_PATH = '/sell/new?wizard=1';

export function marketplaceEntryHref(
  intent?: CreateFlowIntent | null,
): string {
  const suffix = buildSellNewSearchFromIntent(intent ?? null);
  return `${MARKETPLACE_ENTRY_PATH}${suffix}`;
}
