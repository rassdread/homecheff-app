import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PromoCodesClient from './page-client';

export const dynamic = 'force-dynamic';

export default async function PromoCodesPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login?callbackUrl=/affiliate/promo-codes');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      affiliate: true,
    },
  });

  if (!user?.affiliate) {
    redirect('/affiliate');
  }

  const { resolveStoredAffiliateCapabilities } = await import('@/lib/affiliate/program-store');
  const rights = await resolveStoredAffiliateCapabilities(user.affiliate.id);
  if (!rights.capabilities.CAN_CREATE_PROMO_CODES.value) {
    redirect('/affiliate/dashboard');
  }

  return <PromoCodesClient />;
}

