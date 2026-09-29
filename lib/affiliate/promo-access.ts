import type { ResolvedCapability } from '@/lib/affiliate/program-control';

/**
 * Whether an active affiliate may open the central promo-code screens.
 * Technical identities withhold program rights, so the capability reads false
 * with source GLOBAL. That is not an explicit denial and must not bounce them
 * to the affiliate overview.
 */
export function affiliateMayUsePromoCodes(input: {
  operationsBlocked: boolean;
  capability: Pick<ResolvedCapability, 'value' | 'source'>;
}): boolean {
  if (input.operationsBlocked) return false;
  if (input.capability.value) return true;
  return input.capability.source === 'GLOBAL';
}

/** Same rule as promo codes: a withheld GLOBAL capability is not an explicit denial. */
export const affiliateMayUsePromoLibrary = affiliateMayUsePromoCodes;
