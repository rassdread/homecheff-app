import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DeliveryProfile from '@/components/delivery/DeliveryProfile';

export default async function DeliveryProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has delivery profile
  const deliveryProfile = await prisma.deliveryProfile.findUnique({
    where: { userId: (session.user as any).id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          sellerRoles: true
        }
      },
      reviews: {
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      vehiclePhotos: {
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  if (!deliveryProfile) {
    redirect('/delivery/signup');
  }

  return <DeliveryProfile deliveryProfile={deliveryProfile} />;
}
