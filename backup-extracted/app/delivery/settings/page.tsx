import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DeliverySettings from '@/components/delivery/DeliverySettings';

export default async function DeliverySettingsPage() {
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
          email: true
        }
      }
    }
  });

  if (!deliveryProfile) {
    redirect('/delivery/signup');
  }

  // Ensure preferredRadius is not null
  const deliveryProfileWithDefaults = {
    ...deliveryProfile,
    preferredRadius: deliveryProfile.preferredRadius || 3.0
  };

  return <DeliverySettings deliveryProfile={deliveryProfileWithDefaults} />;
}
