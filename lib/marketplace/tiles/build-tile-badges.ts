/**
 * Badge builder — priority queue with max N badges.
 * Phase 5B-B — taxonomy icons + normalized labels on all tile badges.
 */

import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import {
  TILE_BADGE_MAX,
  TILE_BADGE_PRIORITY,
  type TileBadgeVariant,
} from './tile-badge-priority';
import { formatWorkshopDateCompact } from './format-workshop-date';
import {
  resolveTileAcceptedTaxonomyBadges,
  resolveTileOfferTaxonomyBadge,
} from './resolve-tile-badge-icon';
import type {
  BuildTileBadgesResult,
  MarketplaceTileModel,
  TileBadge,
  TileBadgeIconKind,
  TileBadgeKind,
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
  kind: TileBadgeKind;
  label: string;
  tone: TileBadge['tone'];
  taxonomyId?: string | null;
  icon?: string;
  iconKind?: TileBadgeIconKind;
  taxonomyTone?: TileBadge['taxonomyTone'];
};

function taxonomyCandidate(
  kind: TileBadgeKind,
  resolved: {
    taxonomyId: string | null;
    labelKey: string;
    icon: string;
    iconKind: TileBadgeIconKind;
    taxonomyTone: TileBadge['taxonomyTone'];
  },
  t: TranslateFn,
): Candidate {
  return {
    kind,
    label: t(resolved.labelKey),
    tone: 'default',
    taxonomyId: resolved.taxonomyId,
    icon: resolved.icon,
    iconKind: resolved.iconKind,
    taxonomyTone: resolved.taxonomyTone,
  };
}

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
      icon: 'Hand',
      iconKind: 'lucide',
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
  } else {
    const offer = resolveTileOfferTaxonomyBadge(model);
    if (offer) {
      out.push(taxonomyCandidate('specialization', offer, t));
    }
  }

  if (showAcceptedValue) {
    const accepted = resolveTileAcceptedTaxonomyBadges(model);
    for (const badge of accepted) {
      out.push(taxonomyCandidate('accepted_value', badge, t));
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
  const candidates = collectCandidates(model, t, variant, locale);

  const ordered: Candidate[] = [];
  for (const kind of TILE_BADGE_PRIORITY) {
    if (kind === 'accepted_value') {
      ordered.push(...candidates.filter((c) => c.kind === 'accepted_value'));
      continue;
    }
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

  let badges: TileBadge[] = deduped.slice(0, max).map((c) => ({
    kind: c.kind,
    label: c.label,
    tone: c.tone,
    taxonomyId: c.taxonomyId,
    icon: c.icon,
    iconKind: c.iconKind,
    taxonomyTone: c.taxonomyTone,
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
    barterSlot: resolveBarterSlot(model),
  };
}
