import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { clearUserCache } from '@/lib/api-auth';
import { loadAdminUserPopulation } from '@/lib/admin/load-user-population';
import { realUserWhere } from '@/lib/admin/user-population';
import {
  currentModeOrders,
  paidMarketplaceOrderWhere,
  sumCurrentModeGrossCents,
} from '@/lib/admin/paid-marketplace-orders';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { 
      id: true,
      role: true,
      adminRoles: true,
      email: true,
      name: true,
      username: true 
    }
  });

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const hasAdminRoles = (user?.adminRoles?.length ?? 0) > 0;
  if (!user || (!isAdmin && !hasAdminRoles)) {
    redirect('/');
  }

  // Get admin permissions for dashboard filtering
  const adminPermissions = await prisma.adminPermissions.findUnique({
    where: { userId: user.id }
  });

  // Get basic admin statistics
  let totalUsers = 0;
  let population = null as Awaited<ReturnType<typeof loadAdminUserPopulation>> | null;
  let totalProducts = 0;
  let totalOrders = 0;
  let totalDeliveryProfiles = 0;
  let totalRevenue = 0;
  let activeUsers = 0;
  let recentUsers: any[] = [];
  let recentProducts: any[] = [];
  let deliveryProfiles: any[] = [];

  try {
    const [
      populationSnapshot,
      productsCount,
      ordersCount,
      deliveryProfilesCount,
      revenue,
      recentUsersData,
      recentProductsData,
      deliveryProfilesData
    ] = await Promise.all([
    loadAdminUserPopulation(),
    prisma.product.count(),
    prisma.order.findMany({
      where: paidMarketplaceOrderWhere(),
      select: { stripeSessionId: true },
    }).then((orders) => currentModeOrders(orders).length),
    prisma.deliveryProfile.count({ where: { isBlocked: false } }),
    prisma.order.findMany({
      where: paidMarketplaceOrderWhere(),
      select: { totalAmount: true, stripeSessionId: true },
    }).then((orders) => sumCurrentModeGrossCents(orders)),
    prisma.user.findMany({
      where: realUserWhere(),
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
        image: true,
        profileImage: true,
        updatedAt: true
      }
    }),
    prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          include: {
            User: {
              select: {
                name: true,
                username: true,
                image: true,
                profileImage: true
              }
            }
          }
        },
        Image: {
          select: { fileUrl: true },
          take: 1
        },
        favorites: {
          select: { id: true }
        }
      }
    }),
    prisma.deliveryProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            address: true,
            city: true,
            postalCode: true,
            country: true,
            image: true,
            profileImage: true
          }
        },
        deliveryOrders: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            deliveryFee: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    ]);

    population = populationSnapshot;
    totalUsers = populationSnapshot.totalRealUsers;
    totalProducts = productsCount;
    totalOrders = ordersCount;
    totalDeliveryProfiles = deliveryProfilesCount;
    totalRevenue = revenue;
    activeUsers = populationSnapshot.totalActive;
    recentUsers = recentUsersData.map(user => ({
      ...user,
      role: user.role.toString(),
      lastActiveAt: user.updatedAt
    }));
    recentProducts = recentProductsData;
    deliveryProfiles = deliveryProfilesData;
  } catch (error) {
    console.error('Error loading admin statistics:', error);
    // Continue with default values (0/empty arrays) so page still renders
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse text-gray-500">Loading…</div></div>}>
      <p className="bg-gray-50 px-4 pt-4 text-sm">
        <a href="/admin/vlaardingen-density" className="text-emerald-800 underline">
          Vlaardingen density
        </a>
      </p>
      <AdminDashboard
      user={{
        id: user.id,
        role: user.role,
        adminRoles: user.adminRoles || [],
        email: user.email,
        name: user.name,
        username: user.username
      }}
      permissions={adminPermissions ? {
        ...adminPermissions,
        canViewVariabelenTab: adminPermissions.canViewVariabelenTab ?? undefined
      } : undefined}
      stats={{
        totalUsers,
        totalProducts,
        totalOrders,
        totalDeliveryProfiles,
        totalRevenue,
        activeUsers,
        population,
        recentUsers,
        recentProducts,
        deliveryProfiles,
        topSellers: [],
        recentOrders: [],
        systemMetrics: []
      }}
    />
    </Suspense>
  );
}
