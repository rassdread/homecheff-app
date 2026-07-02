import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import SettingsHubClient from '@/components/settings/SettingsHubClient';
import { settingsHubContextFromUser } from '@/lib/settings/settings-hub';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login?callbackUrl=/settings');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      username: true,
      passwordHash: true,
      email: true,
      accountDeletedAt: true,
      bio: true,
      quote: true,
      place: true,
      gender: true,
      interests: true,
      profileImage: true,
      role: true,
      sellerRoles: true,
      buyerRoles: true,
      displayFullName: true,
      displayNameOption: true,
      encryptionEnabled: true,
      emailVerified: true,
      stripeConnectAccountId: true,
      stripeConnectOnboardingCompleted: true,
      DeliveryProfile: { select: { id: true } },
      affiliate: { select: { id: true, status: true } },
      SellerProfile: {
        select: {
          subscriptionId: true,
          subscriptionValidUntil: true,
          Subscription: {
            select: { name: true, priceCents: true },
          },
        },
      },
    },
  });

  if (!user || user.accountDeletedAt) {
    redirect('/login');
  }

  const { passwordHash, DeliveryProfile, affiliate, ...rest } = user;
  const hubUser = {
    ...rest,
    hasPassword: Boolean(passwordHash),
  };

  const hubContext = settingsHubContextFromUser({
    role: user.role,
    sellerRoles: user.sellerRoles,
    hasDeliveryProfile: Boolean(DeliveryProfile),
    hasAffiliate: affiliate?.status === 'ACTIVE',
    stripeConnectAccountId: user.stripeConnectAccountId,
    SellerProfile: user.SellerProfile,
  });

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <SettingsHubClient user={hubUser as any} hubContext={hubContext} />
    </Suspense>
  );
}
