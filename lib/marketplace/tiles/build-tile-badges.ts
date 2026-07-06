/**
 * Badge builder — priority queue with max N badges.
 */

import type { MarketplaceCategory } from '@prisma/client';
import {
  resolveAcceptedBadges,
  resolveOfferBadges,
} from '@/lib/marketplace/taxonomy-badges';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import {
  TILE_BADGE_MAX,
  TILE_BADGE_PRIORITY,
  type TileBadgeVariant,
} from './tile-badge-priority';
import { formatWorkshopDateCompact } from './format-workshop-date';
import type {
  MarketplaceTileModel,
  TileBadge,
  TileBadgeKind,
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

type Candidate = { kind: TileBadgeKind; label: string; tone: TileBadge['tone'] };

function collectCandidates(
  model: MarketplaceTileModel,
  t: TranslateFn,
  variant: TileBadgeVariant,
  locale: string,
): Candidate[] {
  const out: Candidate[] = [];
  const showAcceptedValue = variant === 'standard';

  if (model.sponsored === true) {
    out.push({ kind: 'sponsored', label: 'Sponsored', tone: 'default' });
  }

  if (model.listingIntent === 'REQUEST') {
    out.push({
      kind: 'request',
      label: t('marketplace.tile.badge.request'),
      tone: 'request',
    });
  }

  if (model.listingKind === 'WORKSHOP' && model.availabilityDate) {
    out.push({
      kind: 'workshop_date',
      label: formatWorkshopDateCompact(model.availabilityDate, locale),
      tone: 'date',
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
    });
  }

  if (model.mode === 'inspiration') {
    const vertical = model.inspirationCategoryLabel;
    if (vertical) {
      out.push({
        kind: 'specialization',
        label: vertical,
        tone: 'default',
      });
    }
  } else {
    const offerBadges = resolveOfferBadges({
      specializations: model.specializations,
      marketplaceCategory: model.marketplaceCategory as MarketplaceCategory | null,
      legacyCategory: null,
    });
    if (offerBadges[0]) {
      out.push({
        kind: 'specialization',
        label: t(offerBadges[0].labelKey),
        tone: 'default',
      });
    }
  }

  if (showAcceptedValue) {
    const accepted = resolveAcceptedBadges(model.acceptedSpecializations);
    if (accepted[0]) {
      out.push({
        kind: 'accepted_value',
        label: t(accepted[0].labelKey),
        tone: 'default',
      });
    }
  }

  const trustBadge = model.trust.trustBadges[0];
  if (trustBadge?.name) {
    out.push({
      kind: 'trust_badge',
      label: trustBadge.name,
      tone: 'trust',
    });
  }

  return out;
}

export type BuildTileBadgesResult = {
  badges: TileBadge[];
  overflowCount: number;
};

export function buildTileBadges(
  model: MarketplaceTileModel,
  t: TranslateFn,
  variant: TileBadgeVariant,
  locale = 'nl-NL',
): BuildTileBadgesResult {
  const max = TILE_BADGE_MAX[variant];
  const candidates = collectCandidates(model, t, variant, locale);

  const ordered: Candidate[] = [];
  for (const kind of TILE_BADGE_PRIORITY) {
    const found = candidates.find((c) => c.kind === kind);
    if (found) ordered.push(found);
  }

  const deduped: Candidate[] = [];
  const seen = new Set<string>();
  for (const c of ordered) {
    if (c.kind === 'listing_kind' && seen.has('request')) continue;
    const key = `${c.kind}:${c.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (c.kind === 'request') seen.add('listing_kind');
    deduped.push(c);
  }

  let badges = deduped.slice(0, max).map((c) => ({
    kind: c.kind,
    label: c.label,
    tone: c.tone,
  }));

  if (variant === 'standard') {
    const acceptedCount = badges.filter((b) => b.kind === 'accepted_value').length;
    if (acceptedCount > 1) {
      const firstAcceptedIdx = badges.findIndex((b) => b.kind === 'accepted_value');
      badges = badges.filter(
        (b, i) => b.kind !== 'accepted_value' || i === firstAcceptedIdx,
      );
    }
  }

  return {
    badges,
    overflowCount: Math.max(0, deduped.length - max),
  };
}
