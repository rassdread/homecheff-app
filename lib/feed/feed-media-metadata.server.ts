/**
 * Lightweight feed media metadata — avoids loading inline base64 bytes into Node.
 *
 * Prefer substring()/left() prefix reads over LIKE on the full url/fileUrl column
 * so multi-MB data: TOAST values are not fully detoasted just to classify media
 * for /api/feed. Legacy data: rows still map to the existing media proxy.
 */

import { prisma } from '@/lib/prisma';
import type { FeedMediaMetaRow } from '@/lib/feed/resolve-feed-media-url';
import {
  FEED_DB_DISH_CAP,
  FEED_DB_PRODUCT_CAP,
} from '@/lib/feed/feed-candidate-window';

export type { FeedMediaMetaRow } from '@/lib/feed/resolve-feed-media-url';
export {
  resolveFeedUrlsFromMetadata,
} from '@/lib/feed/resolve-feed-media-url';

const LEGACY_SENTINEL = 'legacy';

function capIds(ids: string[], max: number): string[] {
  return ids.filter(Boolean).slice(0, max);
}

function mapUrlRef(urlRef: string | null): Pick<FeedMediaMetaRow, 'httpUrl' | 'isLegacyInline'> {
  if (!urlRef || urlRef === LEGACY_SENTINEL) {
    return { httpUrl: null, isLegacyInline: urlRef === LEGACY_SENTINEL };
  }
  return { httpUrl: urlRef, isLegacyInline: false };
}

export async function loadProductImageMetadata(
  productIds: string[],
): Promise<Map<string, FeedMediaMetaRow[]>> {
  const out = new Map<string, FeedMediaMetaRow[]>();
  const capped = capIds(productIds, FEED_DB_PRODUCT_CAP);
  if (capped.length === 0) return out;

  const rows = await prisma.$queryRaw<
    Array<{ productId: string; sortOrder: number; url_ref: string | null }>
  >`
    SELECT "productId", "sortOrder",
      CASE
        WHEN substring("fileUrl" from 1 for 5) = 'data:' THEN ${LEGACY_SENTINEL}
        WHEN substring("fileUrl" from 1 for 4) = 'http'
          OR substring("fileUrl" from 1 for 1) = '/'
          THEN left("fileUrl", 1024)
        ELSE NULL
      END as url_ref
    FROM "Image"
    WHERE "productId" = ANY(${capped}::text[])
    ORDER BY "productId", "sortOrder" ASC
  `;

  for (const row of rows) {
    const list = out.get(row.productId) ?? [];
    const mapped = mapUrlRef(row.url_ref);
    list.push({ sortOrder: row.sortOrder, ...mapped });
    out.set(row.productId, list);
  }
  return out;
}

export async function loadDishPhotoMetadata(
  dishIds: string[],
): Promise<Map<string, FeedMediaMetaRow[]>> {
  const out = new Map<string, FeedMediaMetaRow[]>();
  const capped = capIds(dishIds, FEED_DB_DISH_CAP + FEED_DB_PRODUCT_CAP);
  if (capped.length === 0) return out;

  const rows = await prisma.$queryRaw<
    Array<{ dishId: string; idx: number; url_ref: string | null }>
  >`
    SELECT "dishId", "idx",
      CASE
        WHEN substring("url" from 1 for 5) = 'data:' THEN ${LEGACY_SENTINEL}
        WHEN substring("url" from 1 for 4) = 'http'
          OR substring("url" from 1 for 1) = '/'
          THEN left("url", 1024)
        ELSE NULL
      END as url_ref
    FROM "DishPhoto"
    WHERE "dishId" = ANY(${capped}::text[])
    ORDER BY "dishId", "idx" ASC
  `;

  for (const row of rows) {
    const list = out.get(row.dishId) ?? [];
    const mapped = mapUrlRef(row.url_ref);
    list.push({ sortOrder: row.idx, ...mapped });
    out.set(row.dishId, list);
  }
  return out;
}

/** Product needs linked dish donor when it has zero Image rows. */
export function productNeedsLinkedDishMedia(imageRowCount: number): boolean {
  return imageRowCount === 0;
}
