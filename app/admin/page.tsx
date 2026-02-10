import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { clearUserCache } from '@/lib/api-auth';
import { matchesCurrentMode } from '@/lib/stripe';

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

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN' as any)) {
    redirect('/');
  }

  // Get admin permissions for dashboard filtering
  const adminPermissions = await prisma.adminPermissions.findUnique({
    where: { userId: user.id }
  });

  // Get basic admin statistics
  let totalUsers = 0;
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
      usersCount,
      productsCount,
      ordersCount,
      deliveryProfilesCount,
      revenue,
      activeUsersCount,
      recentUsersData,
      recentProductsData,
      deliveryProfilesData
    ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count({
      where: {
        stripeSessionId: { not: null }, // Only paid orders (Stripe Connect orders)
        NOT: {
          orderNumber: {
            startsWith: 'SUB-'
          }
        }
      }
    }),
    prisma.deliveryProfile.count(),
    // Total revenue (sum of all Stripe Connect order amounts, excluding subscriptions)
    // This matches the calculation in app/api/admin/financial/route.ts
    // Filter by current Stripe mode (test/live) to match other admin endpoints
    prisma.order.findMany({
      where: {
        stripeSessionId: { not: null }, // Only Stripe Connect orders
        NOT: {
          orderNumber: {
            startsWith: 'SUB-'
          }
        }
      },
      select: { totalAmount: true, stripeSessionId: true }
    }).then(orders => {
      // Filter orders to only include those matching current Stripe mode
      const filteredOrders = orders.filter(order => 
        order.stripeSessionId && matchesCurrentMode(order.stripeSessionId)
      );
      return filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    }),
    prisma.user.count({
      where: {
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    }),
    prisma.user.findMany({
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

    totalUsers = usersCount;
    totalProducts = productsCount;
    totalOrders = ordersCount;
    totalDeliveryProfiles = deliveryProfilesCount;
    totalRevenue = revenue;
    activeUsers = activeUsersCount;
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
        recentUsers,
        recentProducts,
        deliveryProfiles,
        topSellers: [],
        recentOrders: [],
        systemMetrics: []
      }}
    />
  );
}
