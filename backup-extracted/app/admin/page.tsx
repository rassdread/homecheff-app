import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { clearUserCache } from '@/lib/api-auth';

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
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalDeliveryProfiles,
    totalRevenue,
    activeUsers,
    recentUsers,
    recentProducts,
    deliveryProfiles
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.transaction.count(),
    prisma.deliveryProfile.count(),
    prisma.transaction.aggregate({
      _sum: { amountCents: true },
      where: { status: 'CAPTURED' as any }
    }).then(result => (result._sum?.amountCents || 0) / 100),
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
    }).then(users => users.map(user => ({
      ...user,
      role: user.role.toString(),
      lastActiveAt: user.updatedAt
    }))),
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
      permissions={adminPermissions || undefined}
      stats={{
        totalUsers,
        totalProducts,
        totalOrders,
        totalDeliveryProfiles,
        totalRevenue,
        activeUsers,
        recentUsers: recentUsers.map(user => ({
          ...user,
          role: user.role.toString(),
          lastActiveAt: user.updatedAt
        })),
        recentProducts,
        deliveryProfiles,
        topSellers: [],
        recentOrders: [],
        systemMetrics: []
      }}
    />
  );
}
