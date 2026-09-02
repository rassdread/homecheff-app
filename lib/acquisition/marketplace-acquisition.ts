/**
 * Persist Marketplace first-touch acquisition + seller/buyer activation (deduped, never overwrite).
 * Affiliate (hc_ref) remains separate — this module never reads or writes affiliate cookies.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  hasMarketplaceUtmSignal,
  type MarketplaceUtmCapture,
} from "@/lib/acquisition/utm-persistence";
import {
  isQualityListing,
  type ListingQualityInput,
} from "@/lib/acquisition/listing-quality";

export const MARKETPLACE_ACTIVATION_KIND_SELLER = "MARKETPLACE_SELLER_ACTIVATED";
export const MARKETPLACE_ACTIVATION_KIND_BUYER = "MARKETPLACE_BUYER_ACTIVATED";

export type MarketplaceActivationKind =
  | typeof MARKETPLACE_ACTIVATION_KIND_SELLER
  | typeof MARKETPLACE_ACTIVATION_KIND_BUYER;

/**
 * Upsert first-touch once on User. Never overwrites an existing capture.
 */
export async function upsertMarketplaceAcquisitionFirstTouch(
  userId: string,
  capture: MarketplaceUtmCapture | null | undefined,
): Promise<boolean> {
  if (!hasMarketplaceUtmSignal(capture) || !capture) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, acquisitionFirstTouch: true },
  });
  if (!user) return false;
  if (user.acquisitionFirstTouch != null) return false;

  const updated = await prisma.user.updateMany({
    where: { id: userId, acquisitionFirstTouch: { equals: Prisma.DbNull } },
    data: {
      acquisitionFirstTouch: capture as unknown as Prisma.InputJsonValue,
    },
  });
  if (updated.count === 0) {
    const again = await prisma.user.findUnique({
      where: { id: userId },
      select: { acquisitionFirstTouch: true },
    });
    if (again?.acquisitionFirstTouch != null) return false;
    await prisma.user.update({
      where: { id: userId },
      data: {
        acquisitionFirstTouch: capture as unknown as Prisma.InputJsonValue,
      },
    });
    return true;
  }
  return true;
}

/**
 * MARKETPLACE_SELLER_ACTIVATED = first quality published listing.
 * Sets sellerActivatedAt once; sets acquisitionActivatedAt once if still null.
 */
export async function recordMarketplaceSellerActivation(
  userId: string,
): Promise<boolean> {
  if (!userId) return false;
  try {
    const now = new Date();
    const sellerUpdated = await prisma.user.updateMany({
      where: { id: userId, sellerActivatedAt: null },
      data: { sellerActivatedAt: now },
    });

    await prisma.user.updateMany({
      where: { id: userId, acquisitionActivatedAt: null },
      data: {
        acquisitionActivatedAt: now,
        acquisitionActivationKind: MARKETPLACE_ACTIVATION_KIND_SELLER,
      },
    });

    return sellerUpdated.count > 0;
  } catch (err) {
    console.error("[marketplace-acquisition] seller activation failed", err);
    return false;
  }
}

/**
 * MARKETPLACE_BUYER_ACTIVATED = first meaningful order or favorite.
 * Sets acquisitionActivatedAt once (never overwrite).
 */
export async function recordMarketplaceBuyerActivation(
  userId: string,
): Promise<boolean> {
  if (!userId) return false;
  try {
    const updated = await prisma.user.updateMany({
      where: { id: userId, acquisitionActivatedAt: null },
      data: {
        acquisitionActivatedAt: new Date(),
        acquisitionActivationKind: MARKETPLACE_ACTIVATION_KIND_BUYER,
      },
    });
    return updated.count > 0;
  } catch (err) {
    console.error("[marketplace-acquisition] buyer activation failed", err);
    return false;
  }
}

/**
 * After product publish/activate: if listing is quality and active, record seller activation.
 */
export async function maybeActivateSellerFromPublishedListing(
  userId: string,
  listing: ListingQualityInput,
): Promise<boolean> {
  if (!userId) return false;
  if (listing.isActive === false) return false;
  if (!isQualityListing(listing)) return false;
  return recordMarketplaceSellerActivation(userId);
}
