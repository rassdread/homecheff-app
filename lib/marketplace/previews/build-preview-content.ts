import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { MarketplaceTileModel, TranslateFn } from '@/lib/marketplace/tiles/types';
import { formatWorkshopDateCompact } from '@/lib/marketplace/tiles/format-workshop-date';
import type { MarketplacePreviewContent, PreviewTrustLine } from './types';
import { buildPreviewAcceptedValues } from './build-preview-accepted';
import { buildPreviewFulfillment } from './build-preview-fulfillment';
import { buildPreviewPaymentBlock } from './build-preview-payment';
import { buildPreviewTrustExpansion } from './build-preview-trust';

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shouldShowTrust(kind: ListingKind): boolean {
  return kind !== 'INSPIRATION';
}

export function buildMarketplacePreviewContent(
  model: MarketplaceTileModel,
  t: TranslateFn,
  locale = 'nl-NL',
): MarketplacePreviewContent {
  const { values, overflow } = buildPreviewAcceptedValues(model, t);
  const trust = buildPreviewTrustExpansion(model, t);
  const payment = buildPreviewPaymentBlock(model, t);
  const fulfillment = buildPreviewFulfillment(model.fulfillmentFlags);
  const kind = model.listingKind;

  const base: MarketplacePreviewContent = {
    listingKind: kind,
    title: model.title,
    description: model.description,
    payment,
    fulfillment: [],
    acceptedValues: [],
    acceptedOverflow: 0,
    trustLines: [],
    trustBadges: [],
    showTrust: shouldShowTrust(kind),
    workshopDate: null,
    workshopLocation: null,
    capacityRemaining: null,
    neededBy: null,
    inspirationCategory: null,
    creatorName: null,
    availabilityNote: null,
    responseExpectation: null,
    onlineOffline: null,
    requestSummary: null,
    compensationNote: null,
  };

  if (kind === 'INSPIRATION') {
    return {
      ...base,
      description: model.description,
      inspirationCategory: model.inspirationCategoryLabel ?? null,
      creatorName: model.person?.name ?? model.person?.username ?? null,
      showTrust: false,
    };
  }

  if (kind === 'REQUEST') {
    return {
      ...base,
      requestSummary: model.description,
      neededBy: formatDateTime(model.neededBy ?? model.availabilityDate),
      compensationNote: payment?.secondary,
      acceptedValues: values,
      acceptedOverflow: overflow,
      trustLines: trust.lines,
      trustBadges: trust.badges,
      fulfillment: fulfillment,
    };
  }

  const shared = {
    ...base,
    fulfillment,
    acceptedValues: values,
    acceptedOverflow: overflow,
    trustLines: trust.lines,
    trustBadges: trust.badges,
  };

  switch (kind) {
    case 'PRODUCT':
      return {
        ...shared,
        description: model.description,
      };
    case 'SERVICE':
      return {
        ...shared,
        description: model.description,
        availabilityNote: model.availabilityDate
          ? formatWorkshopDateCompact(model.availabilityDate, locale)
          : null,
        responseExpectation: t('marketplace.preview.service.response'),
      };
    case 'TASK':
      return {
        ...shared,
        description: model.description,
        availabilityNote: model.place,
      };
    case 'WORKSHOP':
      return {
        ...shared,
        description: model.description,
        workshopDate: formatDateTime(model.availabilityDate),
        workshopLocation: model.place,
        capacityRemaining: model.capacityRemaining,
      };
    case 'COACHING':
      return {
        ...shared,
        description: model.description,
        onlineOffline: model.fulfillmentFlags.onlineSession
          ? t('marketplace.preview.coaching.online')
          : t('marketplace.preview.coaching.onSite'),
      };
    default:
      return {
        ...shared,
        description: model.description,
      };
  }
}

export function previewTrustLineCount(lines: PreviewTrustLine[]): number {
  return lines.length;
}
