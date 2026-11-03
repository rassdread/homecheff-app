/**
 * Recovered marketplace business-tile chrome from BusinessBadge / BusinessPlanBadge.
 * Visual distinction only — no ranking / placement entitlements.
 */

import type { BusinessPlanId } from '@/lib/business/visibility-profile';

/** Article shell accents matching historical Basic / Pro / Premium badge tones. */
export function businessTileArticleClass(
  plan: BusinessPlanId | null | undefined,
): string {
  switch (plan) {
    case 'basic':
      return 'ring-1 ring-slate-200/90';
    case 'pro':
      return 'ring-1 ring-blue-200/90';
    case 'premium':
      return 'ring-2 ring-violet-300/80 shadow-md shadow-violet-100/40';
    default:
      return '';
  }
}
