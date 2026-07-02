import { prisma } from '@/lib/prisma';
import {
  resolveContactPremiumAvailability,
} from '@/lib/profile/contact-premium-availability';
import {
  buildPublicContactChannels,
  evaluateChatContactFeature,
  publicMakerContactSelect,
  type PublicContactChannel,
} from '@/lib/profile/maker-contact-preferences';

/** Server-side: alleen gefilterde kanalen — geen ruwe/disabled/locked contactvelden. */
export async function loadPublicContactChannelsForUser(
  userId: string | null | undefined,
): Promise<PublicContactChannel[]> {
  if (!userId) {
    if (evaluateChatContactFeature().visible) {
      return [{ id: 'chat', href: '' }];
    }
    return [];
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...publicMakerContactSelect,
      SellerProfile: {
        select: {
          subscriptionId: true,
          subscriptionValidUntil: true,
          stripeSubscriptionId: true,
        },
      },
    },
  });

  if (!user) {
    if (evaluateChatContactFeature().visible) {
      return [{ id: 'chat', href: '' }];
    }
    return [];
  }

  const premium = resolveContactPremiumAvailability(user.SellerProfile);
  const { SellerProfile: _sellerProfile, ...contactDb } = user;

  return buildPublicContactChannels(contactDb, { premium });
}
