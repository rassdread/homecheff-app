/**
 * Shared feed item shapes (Fase 5D).
 */

import type { FeedTaxonomy } from '@/lib/feed/feed-taxonomy';

export type FeedClassifiable = {
  id: string;
  priceCents: number | null;
  orderMethod?: string | null;
  type?: string | null;
  isRecipe?: boolean | null;
  isInspiration?: boolean | null;
  ownerId?: string | null;
  category?: string | null;
  title?: string | null;
  place?: string | null;
  taxonomy?: FeedTaxonomy;
};
