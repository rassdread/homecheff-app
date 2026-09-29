import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PromoCodesClient from './page-client';

export const dynamic = 'force-dynamic';

export default async function PromoCodesPage({
  searchParams,
}: {
  searchParams?: { product?: string };
}) {
  const product =
    searchParams?.product === 'GROWTH'
      ? 'GROWTH'
      : searchParams?.product === 'HOMECHEFF'
        ? 'HOMECHEFF'
        : '';
  const nextPath = product ? `/affiliate/promo-codes?product=${product}` : '/affiliate/promo-codes';
  const session = await auth();
  
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(nextPath)}`);
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

  return (
    <Suspense fallback={null}>
      <PromoCodesClient />
    </Suspense>
  );
}

