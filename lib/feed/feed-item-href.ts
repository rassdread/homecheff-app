/**
 * Central feed item href resolver (Fase 5D).
 * Preserves existing SEO routes — no /item/[id] migration.
 */

import type { FeedClassifiable } from '@/lib/feed/feed-types';
import { buildProductSlugPath } from '@/lib/seo/productSlug';
import {
  deriveFeedTaxonomy,
  type FeedTaxonomy,
  type FeedTaxonomyInput,
} from '@/lib/feed/feed-taxonomy';

function productHrefFromFeedItem(
  item: Pick<FeedClassifiable, 'id' | 'title' | 'place'>
): string {
  const t = item.title?.trim();
  if (t) {
    return `/product/${buildProductSlugPath(t, item.place, item.id)}`;
  }
  return `/product/${item.id}`;
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
    return productHrefFromFeedItem(item);
  }

  if (cat === 'GROWN') return `/garden/${id}`;
  if (cat === 'DESIGNER') return `/design/${id}`;
  if (cat === 'CHEFF') return `/recipe/${id}`;

  if (item.ownerId != null && String(item.ownerId).trim() !== '') {
    return productHrefFromFeedItem(item);
  }
  if (cat === 'HOMECHEFF' || !cat) {
    return productHrefFromFeedItem(item);
  }
  return `/inspiratie/${id}`;
}

/**
 * Resolves detail href from taxonomy + item fields.
 * REQUEST · TASK · BARTER routes — TODO when request detail pages exist.
 */
export function resolveFeedItemHref(
  item: FeedClassifiable,
  taxonomy?: FeedTaxonomy
): string {
  const tax = taxonomy ?? deriveFeedTaxonomy(item as FeedTaxonomyInput);

  if (tax.direction === 'REQUEST') {
    // TODO(Fase 5E+): /request/[id] or category-specific request routes
    return '/inspiratie';
  }

  switch (tax.kind) {
    case 'PRODUCT':
    case 'SERVICE':
      // TODO(Fase 5E+): dedicated /service/[id] when service listings exist
      return productHrefFromFeedItem(item);
    case 'INSPIRATION':
      return inspirationHrefFromLegacyFields(item);
    case 'TASK':
    case 'BARTER':
      // TODO(Fase 5E+): task/barter detail routes
      return '/inspiratie';
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
