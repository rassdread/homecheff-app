/**
 * Badge builder — priority queue with max N badges.
 */

import type { MarketplaceCategory } from '@prisma/client';
import {
  resolveAcceptedBadges,
  resolveOfferBadges,
} from '@/lib/marketplace/taxonomy-badges';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import { TILE_BADGE_MAX, TILE_BADGE_PRIORITY } from './tile-badge-priority';
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

function formatWorkshopDateBadge(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

type Candidate = { kind: TileBadgeKind; label: string; tone: TileBadge['tone'] };

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
    });
  }

  if (model.listingKind === 'WORKSHOP' && model.availabilityDate) {
    out.push({
      kind: 'workshop_date',
      label: formatWorkshopDateBadge(model.availabilityDate, locale),
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

  const accepted = resolveAcceptedBadges(model.acceptedSpecializations);
  if (accepted[0]) {
    out.push({
      kind: 'accepted_value',
      label: t(accepted[0].labelKey),
      tone: 'default',
    });
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
  variant: 'compact' | 'standard' | 'mini',
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
    const key = `${c.kind}:${c.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (c.kind === 'request') seen.add('listing_kind');
    deduped.push(c);
  }

  const badges = deduped.slice(0, max).map((c) => ({
    kind: c.kind,
    label: c.label,
    tone: c.tone,
  }));

  return {
    badges,
    overflowCount: Math.max(0, deduped.length - max),
  };
}
