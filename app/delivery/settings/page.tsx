import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DeliverySettings from '@/components/delivery/DeliverySettings';
import {
  DELIVERY_START_HREF,
} from '@/lib/delivery/delivery-profile-completion';

export default async function DeliverySettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/delivery/settings');
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    redirect('/login?callbackUrl=/delivery/settings');
  }

  const deliveryProfile = await prisma.deliveryProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // No stub profiles: settings API requires a real DeliveryProfile row.
  // Sellers without a courier profile start via the same onboarding chooser.
  if (!deliveryProfile) {
    redirect(DELIVERY_START_HREF);
  }

  const deliveryProfileWithDefaults = {
    ...deliveryProfile,
    preferredRadius: deliveryProfile.preferredRadius || 3.0,
  };

  return <DeliverySettings deliveryProfile={deliveryProfileWithDefaults} />;
}
