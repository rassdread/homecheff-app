import { prisma } from '@/lib/prisma';

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

