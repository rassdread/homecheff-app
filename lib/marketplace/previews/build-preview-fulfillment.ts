import type { MarketplaceTileFulfillmentFlags } from '@/lib/marketplace/tiles/types';
import type { PreviewFulfillmentItem } from './types';

const FULFILLMENT_ORDER: Array<{
  key: keyof MarketplaceTileFulfillmentFlags;
  labelKey: string;
}> = [
  { key: 'pickup', labelKey: 'marketplace.fulfillment.pickup' },
  { key: 'delivery', labelKey: 'marketplace.fulfillment.delivery' },
  { key: 'shipping', labelKey: 'marketplace.fulfillment.shipping' },
  { key: 'digital', labelKey: 'marketplace.fulfillment.digital' },
  { key: 'onSite', labelKey: 'marketplace.preview.fulfillment.onSite' },
  { key: 'onlineSession', labelKey: 'marketplace.preview.fulfillment.onlineSession' },
];

export function buildPreviewFulfillment(
  flags: MarketplaceTileFulfillmentFlags,
): PreviewFulfillmentItem[] {
  return FULFILLMENT_ORDER.filter((item) => flags[item.key]).map((item) => ({
    key: item.key,
    labelKey: item.labelKey,
  }));
}
