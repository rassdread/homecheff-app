/**
 * Marketplace revenue-window dates are historical audit snapshots.
 * They do not stop commission. Promo end dates and the 30-day cookie are separate.
 */
import { ATTRIBUTION_WINDOW_DAYS } from "@/lib/affiliate-config";

export function historicalMarketplaceRevenueWindowEnd(from: Date): Date {
  return new Date(from.getTime() + ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

/** A stored endsAt never blocks a qualifying paid Marketplace commission. */
export function marketplaceCalendarWindowBlocksCommission(
  _now: Date,
  _windowEnd: Date | null | undefined,
): boolean {
  return false;
}

/** Local signup attribution stays usable after the retired 365-day snapshot. */
export function localMarketplaceAttributionEligible(args: {
  startsAt: Date;
  endsAt?: Date | null;
  now: Date;
}): boolean {
  return args.startsAt.getTime() <= args.now.getTime();
}
