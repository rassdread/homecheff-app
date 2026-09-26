/**
 * Public orientation only. Choosing a network does not enroll anyone
 * and does not change what they are allowed to promote.
 */
import type { PortfolioFocus } from '@/lib/affiliate/goal-scenarios';

export const NETWORK_FIT_IDS = ['buyers', 'makers', 'business', 'creators', 'partners', 'mixed'] as const;
export type NetworkFitId = (typeof NETWORK_FIT_IDS)[number];

/** Local shops and makers sit in the makers category, so the chips stay distinct. */
export const LOCAL_MERGED_INTO_MAKERS = true;

export function calculatorFocusForFit(ids: readonly NetworkFitId[]): PortfolioFocus | null {
  if (ids.includes('mixed')) return 'multi';
  const focuses = new Set<PortfolioFocus>();
  if (ids.includes('business')) focuses.add('growth');
  if (ids.includes('creators')) focuses.add('studio');
  if (ids.includes('makers')) focuses.add('marketplace');
  if (ids.includes('buyers') && focuses.size > 0) return 'multi';
  if (focuses.size > 1) return 'multi';
  if (focuses.size === 1) return [...focuses][0];
  return null;
}
