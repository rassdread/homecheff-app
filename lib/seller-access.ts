import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * Zorgt dat er een SellerProfile bestaat voor gebruikers die als verkoper toegang hebben
 * (rol SELLER en/of niet-lege sellerRoles). Idempotent.
 * Voorkomt 404 op dashboard-/seller-API’s na social onboarding of rollen via profiel.
 */
export async function ensureSellerProfileForUser(
  userId: string,
  opts?: { displayName?: string | null; bio?: string | null }
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      sellerRoles: true,
      role: true,
      name: true,
      username: true,
    },
  });
  if (!user) return;

  const hasSellerIntent =
    (user.sellerRoles?.length ?? 0) > 0 || user.role === 'SELLER';
  if (!hasSellerIntent) return;

  const existing = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (existing) return;

  await prisma.sellerProfile.create({
    data: {
      id: randomUUID(),
      userId,
      displayName: opts?.displayName ?? user.name ?? user.username ?? null,
      bio: opts?.bio ?? null,
    },
  });
}

/**
 * Check if user has seller access (SELLER role or sellerRoles array)
 */
export async function hasSellerAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      sellerRoles: true, 
      role: true 
    }
  });

  if (!user) return false;

  const hasSellerRoles = user.sellerRoles && user.sellerRoles.length > 0;
  const isSeller = user.role === 'SELLER';

  return hasSellerRoles || isSeller;
}

/**
 * Check if user has admin access (ADMIN/SUPERADMIN role or adminRoles array)
 */
export async function hasAdminAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      role: true,
      adminRoles: true
    }
  });

  if (!user) return false;

  return user.role === 'ADMIN' || 
         user.role === 'SUPERADMIN' || 
         (user.adminRoles && user.adminRoles.length > 0);
}

/**
 * Check if user has delivery access (DELIVERY role, deliveryProfile, or seller access)
 */
export async function hasDeliveryAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      role: true,
      sellerRoles: true
    }
  });

  if (!user) return false;

  // Check DELIVERY role
  if (user.role === 'DELIVERY') return true;

  // Check seller access (sellers can also deliver)
  const sellerAccess = await hasSellerAccess(userId);
  if (sellerAccess) return true;

  // Check delivery profile
  const deliveryProfile = await prisma.deliveryProfile.findUnique({
    where: { userId: userId },
    select: { id: true }
  });

  return !!deliveryProfile;
}

