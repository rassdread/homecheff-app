import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isDeliveryBusinessProvider } from '@/lib/delivery/provider-identity';

export const dynamic = 'force-dynamic';

/**
 * Smart Bezorging entry: route to company / driver / individual / onboarding.
 */
export default async function DeliveryHomeRedirectPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/delivery');
  }

  const userId = session.user.id;

  const [profile, membership] = await Promise.all([
    prisma.deliveryProfile.findUnique({
      where: { userId },
      select: { id: true, providerType: true },
    }),
    prisma.deliveryCompanyMember.findFirst({
      where: { userId, status: 'ACTIVE' },
      select: { role: true, companyProfileId: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  if (profile && isDeliveryBusinessProvider(profile.providerType)) {
    redirect('/delivery/company/dashboard');
  }

  if (membership?.role === 'DRIVER') {
    redirect('/delivery/driver');
  }

  if (membership && (membership.role === 'OWNER' || membership.role === 'DISPATCHER')) {
    redirect('/delivery/company/dashboard');
  }

  if (profile) {
    redirect('/delivery/dashboard');
  }

  redirect('/delivery/start');
}
