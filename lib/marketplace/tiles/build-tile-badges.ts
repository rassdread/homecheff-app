/**
 * Badge builder — priority queue with max N badges.
 * Phase 5B-C — offer main category on media; accepted values in value row.
 */

import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import {
  TILE_BADGE_MAX,
  TILE_BADGE_PRIORITY,
  type TileBadgeVariant,
} from './tile-badge-priority';
import { formatWorkshopDateCompact } from './format-workshop-date';
import { resolveTileOfferCategoryBadge } from './resolve-tile-offer-category-badge';
import type {
  BuildTileBadgesResult,
  MarketplaceTileModel,
  TileBadge,
  TileBarterRenderSlot,
  TranslateFn,
} from './types';

function kindLabelKey(kind: ListingKind): string | null {
  switch (kind) {
    case 'PRODUCT':
      return null;
    case 'SERVICE':
      return 'marketplace.tile.kind.service';
    case 'TASK':
      return 'marketplace.tile.kind.task';
    case 'WORKSHOP':
      return 'marketplace.tile.kind.workshop';
    case 'COACHING':
      return 'marketplace.tile.kind.coaching';
    case 'REQUEST':
      return 'marketplace.tile.kind.request';
    case 'INSPIRATION':
      return 'marketplace.tile.kind.inspiration';
    default:
      return null;
  }
}

type Candidate = {
  kind: TileBadge['kind'];
  label: string;
  tone: TileBadge['tone'];
  taxonomyId?: string | null;
  icon?: string;
  iconKind?: TileBadge['iconKind'];
  taxonomyTone?: TileBadge['taxonomyTone'];
};

function collectCandidates(
  model: MarketplaceTileModel,
  t: TranslateFn,
  locale: string,
): Candidate[] {
  const out: Candidate[] = [];

  if (model.sponsored === true) {
    out.push({ kind: 'sponsored', label: 'Sponsored', tone: 'default' });
  }

  if (model.listingIntent === 'REQUEST') {
    out.push({
      kind: 'request',
      label: t('marketplace.tile.badge.request'),
      tone: 'request',
      icon: '🙋',
      iconKind: 'emoji',
    });
  }

  if (model.listingKind === 'WORKSHOP' && model.availabilityDate) {
    out.push({
      kind: 'workshop_date',
      label: formatWorkshopDateCompact(model.availabilityDate, locale),
      tone: 'date',
      icon: 'Calendar',
      iconKind: 'lucide',
    });
  }

  const kindKey = kindLabelKey(model.listingKind);
  if (
    kindKey &&
    model.listingKind !== 'INSPIRATION' &&
    model.listingIntent !== 'REQUEST'
  ) {
    out.push({
      kind: 'listing_kind',
      label: t(kindKey),
      tone: 'kind',
      icon: 'Tag',
      iconKind: 'lucide',
    });
  }

  if (model.mode === 'inspiration') {
    const vertical = model.inspirationCategoryLabel;
    if (vertical) {
      out.push({
        kind: 'specialization',
        label: vertical,
        tone: 'default',
        icon: 'Lightbulb',
        iconKind: 'lucide',
      });
    }
  } else if (model.listingIntent !== 'REQUEST') {
    const offerCategory = resolveTileOfferCategoryBadge(model);
    if (offerCategory) {
      out.push({
        kind: 'offer_category',
        label: t(offerCategory.labelKey),
        tone: 'default',
        icon: offerCategory.emoji,
        iconKind: 'emoji',
      });
    }
  }

  const trustBadge = model.trust.trustBadges[0];
  if (trustBadge?.name) {
    out.push({
      kind: 'trust_badge',
      label: trustBadge.name,
      tone: 'trust',
      icon: 'Award',
      iconKind: 'lucide',
    });
  }

  return out;
}

function resolveBarterSlot(model: MarketplaceTileModel): TileBarterRenderSlot | undefined {
  const openness = String(model.barterOpenness ?? 'MONEY').toUpperCase();
  const hasAccepted =
    (model.acceptedValueSubcategories?.length ?? 0) > 0 ||
    model.acceptedSpecializations.length > 0;
  if (openness === 'MONEY' && !hasAccepted) return undefined;
  return {
    reserved: true,
    barterOpenness: model.barterOpenness,
    hasAcceptedValues: hasAccepted,
  };
}

export function buildTileBadges(
  model: MarketplaceTileModel,
  t: TranslateFn,
  variant: TileBadgeVariant,
  locale = 'nl-NL',
): BuildTileBadgesResult {
  const max = TILE_BADGE_MAX[variant];
  const candidates = collectCandidates(model, t, locale);

  const ordered: Candidate[] = [];
  for (const kind of TILE_BADGE_PRIORITY) {
    const found = candidates.find((c) => c.kind === kind);
    if (found) ordered.push(found);
  }

  const deduped: Candidate[] = [];
  const seen = new Set<string>();
  for (const c of ordered) {
    if (c.kind === 'listing_kind' && seen.has('request')) continue;
    const key = `${c.kind}:${c.taxonomyId ?? c.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (c.kind === 'request') seen.add('listing_kind');
    deduped.push(c);
  }

  const badges: TileBadge[] = deduped.slice(0, max).map((c) => ({
    kind: c.kind,
    label: c.label,
    tone: c.tone,
    taxonomyId: c.taxonomyId,
    icon: c.icon,
    iconKind: c.iconKind,
    taxonomyTone: c.taxonomyTone,
  }));

  return {
    badges,
    overflowCount: Math.max(0, deduped.length - max),
    barterSlot: resolveBarterSlot(model),
  };
}
