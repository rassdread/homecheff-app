import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';

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
    recentUsers,
    recentProducts
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.transaction.count(),
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
    })
  ]);

  return (
    <AdminDashboard
      stats={{
        totalUsers,
        totalProducts,
        totalOrders,
        totalDeliveryProfiles: 0, // Temporary: delivery profiles not yet implemented
        recentUsers,
        recentProducts,
        deliveryProfiles: [] // Temporary: delivery profiles not yet implemented
      }}
    />
  );
}
