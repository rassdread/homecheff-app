/**
 * Badge priority order for marketplace tiles.
 * @see docs/audits/MARKETPLACE_DISCOVERY_CARD_RULES.md
 */

import type { TileBadgeKind } from './types';

export const TILE_BADGE_PRIORITY: TileBadgeKind[] = [
  'sponsored',
  'request',
  'workshop_date',
  'listing_kind',
  'specialization',
  'accepted_value',
  'trust_badge',
];

export const TILE_BADGE_MAX: Record<'compact' | 'standard' | 'mini', number> = {
  compact: 2,
  standard: 3,
  mini: 1,
};
