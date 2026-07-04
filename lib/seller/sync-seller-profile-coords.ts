import { prisma } from '@/lib/prisma';

function isValidCoord(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

type CoordsSource = { lat: number; lng: number };

/**
 * Copy coords to SellerProfile only when profile lat/lng are empty (never overwrite).
 */
export async function syncSellerProfileCoordsIfEmpty(
  sellerProfileId: string,
  source: CoordsSource
): Promise<boolean> {
  if (!isValidCoord(source.lat) || !isValidCoord(source.lng)) return false;

  const existing = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
    select: { lat: true, lng: true },
  });
  if (!existing) return false;
  if (isValidCoord(existing.lat) && isValidCoord(existing.lng)) return false;

  await prisma.sellerProfile.update({
    where: { id: sellerProfileId },
    data: { lat: source.lat, lng: source.lng },
  });
  return true;
}

export async function syncSellerProfileCoordsForUserId(
  userId: string,
  source: CoordsSource
): Promise<boolean> {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return false;
  return syncSellerProfileCoordsIfEmpty(profile.id, source);
}
