/**
 * Central feed item href resolver (Fase 5D).
 * Preserves existing SEO routes — no /item/[id] migration.
 */

import type { FeedClassifiable } from '@/lib/feed/feed-types';
import { buildListingDetailHref } from '@/lib/seo/listing-routes';
import {
  deriveFeedTaxonomy,
  type FeedTaxonomy,
  type FeedTaxonomyInput,
} from '@/lib/feed/feed-taxonomy';
import { getDiscoveryListingIntent, getDiscoveryListingKind } from '@/lib/discovery/consumer-accessors';

function listingHrefFromFeedItem(
  item: Pick<FeedClassifiable, 'id' | 'title' | 'place' | 'listingIntent' | 'listingKind' | 'discovery'>
): string {
  const t = item.title?.trim();
  const listingKind =
    getDiscoveryListingKind(item) ?? (item as { listingKind?: string }).listingKind ?? null;
  const listingIntent =
    getDiscoveryListingIntent(item) ?? item.listingIntent ?? null;

  if (t) {
    return buildListingDetailHref({
      listingKind,
      listingIntent,
      title: t,
      place: item.place,
      id: item.id,
    });
  }
  const prefix = listingKind === 'REQUEST' || listingIntent === 'REQUEST' ? 'request' : 'product';
  return `/${prefix}/${item.id}`;
}

function inspirationHrefFromLegacyFields(item: FeedClassifiable): string {
  const id = item.id;
  if (!id || !String(id).trim()) {
    return '/inspiratie';
  }
  const cat = (item.category || '').toUpperCase();
  const kind = (item.type || '').toLowerCase();

  if (kind === 'dish') {
    if (cat === 'GROWN') return `/garden/${id}`;
    if (cat === 'DESIGNER') return `/design/${id}`;
    return `/recipe/${id}`;
  }

  if (kind === 'recipe' || item.isRecipe) {
    return `/recipe/${id}`;
  }

  if (kind === 'product') {
    return listingHrefFromFeedItem(item);
  }

  if (cat === 'GROWN') return `/garden/${id}`;
  if (cat === 'DESIGNER') return `/design/${id}`;
  if (cat === 'CHEFF') return `/recipe/${id}`;

  if (item.ownerId != null && String(item.ownerId).trim() !== '') {
    return listingHrefFromFeedItem(item);
  }
  if (cat === 'HOMECHEFF' || !cat) {
    return listingHrefFromFeedItem(item);
  }
  return `/inspiratie/${id}`;
}

/**
 * Resolves detail href from taxonomy + item fields.
 */
export function resolveFeedItemHref(
  item: FeedClassifiable,
  taxonomy?: FeedTaxonomy
): string {
  const tax = taxonomy ?? deriveFeedTaxonomy(item as FeedTaxonomyInput);

  if (tax.direction === 'REQUEST') {
    return listingHrefFromFeedItem(item);
  }

  switch (tax.kind) {
    case 'PRODUCT':
    case 'SERVICE':
      return listingHrefFromFeedItem(item);
    case 'INSPIRATION':
      return inspirationHrefFromLegacyFields(item);
    case 'TASK':
      return listingHrefFromFeedItem(item);
    case 'BARTER':
      return listingHrefFromFeedItem(item);
    default:
      return inspirationHrefFromLegacyFields(item);
  }
}

export function getSaleItemHref(item: FeedClassifiable): string {
  const tax = deriveFeedTaxonomy(item);
  return resolveFeedItemHref(item, {
    ...tax,
    direction: 'OFFER',
    kind: 'PRODUCT',
  });
}

export function getInspirationFeedItemHref(item: FeedClassifiable): string {
  return resolveFeedItemHref(item, {
    direction: 'OFFER',
    kind: 'INSPIRATION',
    category: deriveFeedTaxonomy(item).category,
    exchange: 'CONTACT',
  });
}

export function getFeedItemHref(item: FeedClassifiable): string {
  return resolveFeedItemHref(item);
}
