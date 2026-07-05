/**
 * Marketplace Taxonomy & Badge System V1 — type definitions.
 * Single source of truth for offer/request/accepted-value classification.
 * @see lib/marketplace/taxonomy.ts
 */

import type { MarketplaceCategory } from '@prisma/client';

export type TaxonomyLevel = 'category' | 'group' | 'item';

export type TaxonomyTone =
  | 'food'
  | 'garden'
  | 'creative'
  | 'artistic'
  | 'service'
  | 'knowledge'
  | 'international'
  | 'blocked';

export type RegulationFlag =
  | 'alcohol'
  | 'age_restricted'
  | 'food_safety'
  | 'professional_license'
  | 'medical'
  | 'financial'
  | 'legal';

export type MarketplaceTaxonomyCategory = MarketplaceCategory;

export type MarketplaceTaxonomyItem = {
  /** Stable dot-id, e.g. create.meal, grow.tomato, blocked.dropshipping */
  id: string;
  category: MarketplaceTaxonomyCategory;
  parentId?: string;
  level: TaxonomyLevel;
  /** i18n key — marketplace.taxonomy.{id}.label or marketplace.blocklist.{slug}.label */
  labelKey: string;
  shortLabelKey?: string;
  /** Lucide-compatible icon name (resolved in UI layer later) */
  icon: string;
  tone: TaxonomyTone;
  /** NL/EN synonyms for search, matching, and future AI */
  searchTerms?: string[];
  allowedAsOffer: boolean;
  allowedAsRequest: boolean;
  allowedAsAcceptedValue: boolean;
  /** Hidden from default pickers; alcohol, etc. */
  futureOnly?: boolean;
  regulated?: RegulationFlag[];
  /** Moderation blocklist — never in pickers */
  blocked?: boolean;
  blockReasonKey?: string;
};

export type TaxonomyResolveOptions = {
  /** Include futureOnly items (e.g. alcohol) in role-filtered lists */
  includeFutureOnly?: boolean;
  /** Include blocked entries (moderation tooling only) */
  includeBlocked?: boolean;
};
