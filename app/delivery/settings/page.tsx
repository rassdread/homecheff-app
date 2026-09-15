import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DeliverySettings from '@/components/delivery/DeliverySettings';
import { DELIVERY_START_HREF } from '@/lib/delivery/delivery-profile-completion';
import { getDeliveryProfileCompletionFromRow } from '@/lib/delivery/delivery-profile-completion';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
          lat: true,
          lng: true,
          place: true,
        },
      },
    },
  });

  if (!deliveryProfile) {
    redirect(DELIVERY_START_HREF);
  }

  const completion = getDeliveryProfileCompletionFromRow(
    deliveryProfile,
    deliveryProfile.user,
  );

  const deliveryProfileWithDefaults = {
    ...deliveryProfile,
    preferredRadius:
      deliveryProfile.preferredRadius || deliveryProfile.maxDistance || 5,
    homeLat: deliveryProfile.homeLat ?? deliveryProfile.user.lat ?? null,
    homeLng: deliveryProfile.homeLng ?? deliveryProfile.user.lng ?? null,
    homeAddress:
      deliveryProfile.homeAddress || deliveryProfile.user.place || null,
    completion,
  };

  return <DeliverySettings deliveryProfile={deliveryProfileWithDefaults} />;
}
