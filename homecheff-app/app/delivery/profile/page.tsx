import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DeliveryProfile from '@/components/delivery/DeliveryProfile';

export default async function DeliveryProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;

  // Get user with all relevant data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      profileImage: true,
      image: true,
      displayFullName: true,
      displayNameOption: true,
      sellerRoles: true
    }
  });

  // Check if user has delivery profile
  const deliveryProfile = await prisma.deliveryProfile.findUnique({
    where: { userId },
    include: {
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

  // Ensure preferredRadius is not null and handle null comments
  const deliveryProfileWithDefaults = {
    ...deliveryProfile,
    preferredRadius: deliveryProfile.preferredRadius || 3.0,
    user: {
      id: user!.id,
      name: user!.name,
      email: user!.email,
      image: user!.profileImage || user!.image,
      sellerRoles: user!.sellerRoles || []
    },
    reviews: deliveryProfile.reviews.map(review => ({
      ...review,
      comment: review.comment || ''
    }))
  };

  return <DeliveryProfile deliveryProfile={deliveryProfileWithDefaults} />;
}
