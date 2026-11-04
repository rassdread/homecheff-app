/**
 * Recovered marketplace business-tile chrome from BusinessBadge / BusinessPlanBadge.
 * Visual distinction only — no ranking / placement entitlements.
 */

import type { BusinessPlanId } from '@/lib/business/visibility-profile';

/**
 * Article shell accents matching historical Basic / Pro / Premium badge tones.
 * One argument keeps the recovered plan chrome. Pass role 'private' to force
 * the personal tile even when a plan id is present. Inspiration never uses this
 * for a second template: callers pass an empty class when mode is inspiration.
 */
export function businessTileArticleClass(
  plan: BusinessPlanId | null | undefined,
  role?: 'business' | 'private',
): string {
  const resolved = role ?? (plan && plan !== 'individual' ? 'business' : 'private');
  if (resolved !== 'business') return '';
  switch (plan) {
    case 'pro':
      return 'hc-business-tile hc-business-tile-pro ring-1 ring-[#347266]/40';
    case 'premium':
      return 'hc-business-tile hc-business-tile-premium ring-1 ring-violet-800/45';
    case 'basic':
    default:
      return 'hc-business-tile hc-business-tile-basic ring-1 ring-slate-300';
  }
}
