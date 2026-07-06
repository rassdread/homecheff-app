import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import {
  shouldShowTrustCue,
  usesDealTrustChannel,
  usesProductTrustChannel,
} from '@/lib/marketplace/tiles/tile-trust-rules';
import type { MarketplaceTileModel, TranslateFn } from '@/lib/marketplace/tiles/types';
import type { PreviewTrustBadge, PreviewTrustLine } from './types';

const ESTABLISHED_TIER = 4;

function pushLine(lines: PreviewTrustLine[], id: string, text: string) {
  if (text && !lines.some((l) => l.id === id)) {
    lines.push({ id, text });
  }
}

export function buildPreviewTrustExpansion(
  model: MarketplaceTileModel,
  t: TranslateFn,
): { lines: PreviewTrustLine[]; badges: PreviewTrustBadge[] } {
  const lines: PreviewTrustLine[] = [];
  const kind = model.listingKind;

  if (!shouldShowTrustCue(kind)) {
    return { lines, badges: [] };
  }

  const trust = model.trust;

  if (usesProductTrustChannel(kind) && trust.productReviewCount > 0) {
    pushLine(
      lines,
      'product',
      t('marketplace.preview.trust.productReviews', {
        count: trust.productReviewCount,
      }),
    );
  }

  if (
    (usesDealTrustChannel(kind) || usesProductTrustChannel(kind)) &&
    trust.dealReviewCount > 0
  ) {
    pushLine(
      lines,
      'deal-reviews',
      t('marketplace.preview.trust.dealReviews', {
        count: trust.dealReviewCount,
      }),
    );
  }

  if (trust.completedDeals > 0) {
    pushLine(
      lines,
      'deals',
      t('marketplace.preview.trust.completedDeals', {
        count: trust.completedDeals,
      }),
    );
  }

  if (trust.courierReviewCount > 0) {
    pushLine(
      lines,
      'courier-reviews',
      t('marketplace.preview.trust.courierReviews', {
        count: trust.courierReviewCount,
      }),
    );
  }

  if (trust.completedDeliveries > 0) {
    pushLine(
      lines,
      'deliveries',
      t('marketplace.preview.trust.completedDeliveries', {
        count: trust.completedDeliveries,
      }),
    );
  }

  if (trust.repeatCustomers > 0) {
    pushLine(
      lines,
      'repeat',
      t('marketplace.preview.trust.repeatCustomers', {
        count: trust.repeatCustomers,
      }),
    );
  }

  if (trust.sellerTier >= ESTABLISHED_TIER) {
    pushLine(lines, 'tier', t('marketplace.tile.trust.established'));
  }

  const badges: PreviewTrustBadge[] = trust.trustBadges.map((b) => ({
    key: b.key,
    name: b.name,
  }));

  return { lines, badges };
}

export function previewTrustChannelForKind(
  kind: ListingKind,
): 'product' | 'deal' | 'none' {
  if (kind === 'INSPIRATION') return 'none';
  if (kind === 'PRODUCT') return 'product';
  return 'deal';
}
