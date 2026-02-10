import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DeliverySettings from '@/components/delivery/DeliverySettings';

export default async function DeliverySettingsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;

  // Check if user has seller roles (sellers can access delivery settings without delivery profile)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      sellerRoles: true, 
      role: true,
      name: true,
      email: true
    }
  });

  const hasSellerRoles = user?.sellerRoles && user.sellerRoles.length > 0;
  const isSeller = user?.role === 'SELLER';

  // Check if user has delivery profile (only if not a seller)
  let deliveryProfile: any = null;
  if (!hasSellerRoles && !isSeller) {
    deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!deliveryProfile) {
      redirect('/delivery/signup');
    }
  } else {
    // For sellers, create a minimal delivery profile object
    deliveryProfile = {
      id: '',
      userId: userId,
      preferredRadius: 5.0,
      user: {
        id: userId,
        name: user?.name || null,
        email: user?.email || null
      }
    } as any;
  }

  // Ensure preferredRadius is not null
  const deliveryProfileWithDefaults = {
    ...deliveryProfile,
    preferredRadius: deliveryProfile.preferredRadius || 3.0
  };

  return <DeliverySettings deliveryProfile={deliveryProfileWithDefaults} />;
}
