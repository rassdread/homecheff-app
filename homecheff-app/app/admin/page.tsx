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
    select: { role: true }
  });

  if (user?.role !== 'ADMIN') {
    redirect('/');
  }

  // Get admin statistics
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalDeliveryProfiles,
    recentUsers,
    recentProducts,
    deliveryProfiles
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.transaction.count(),
    prisma.deliveryProfile.count(),
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
        profileImage: true
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
        }
      }
    }),
    prisma.deliveryProfile.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
      }
    })
  ]);

  console.log('Admin page - delivery profiles found:', deliveryProfiles.length);
  console.log('Admin page - delivery profiles:', deliveryProfiles);

  return (
    <AdminDashboard
      stats={{
        totalUsers,
        totalProducts,
        totalOrders,
        totalDeliveryProfiles,
        recentUsers,
        recentProducts,
        deliveryProfiles
      }}
    />
  );
}
