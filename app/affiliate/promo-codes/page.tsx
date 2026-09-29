import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PromoCodesClient from './page-client';
import { affiliatePromoCodesPath, affiliatePromoProduct } from '@/lib/affiliate/affiliate-sections';
import { affiliateMayUsePromoCodes } from '@/lib/affiliate/promo-access';

export const dynamic = 'force-dynamic';

export default async function PromoCodesPage({
  searchParams,
}: {
  searchParams?: { product?: string };
}) {
  const product = affiliatePromoProduct(searchParams?.product);
  const nextPath = affiliatePromoCodesPath(product);
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

  if (user.affiliate.status !== 'ACTIVE') {
    redirect('/affiliate/dashboard');
  }

  const { resolveStoredAffiliateCapabilities } = await import('@/lib/affiliate/program-store');
  const rights = await resolveStoredAffiliateCapabilities(user.affiliate.id);
  if (!affiliateMayUsePromoCodes({
    operationsBlocked: rights.operationsBlocked,
    capability: rights.capabilities.CAN_CREATE_PROMO_CODES,
  })) {
    redirect('/affiliate/dashboard');
  }

  return (
    <Suspense fallback={null}>
      <PromoCodesClient />
    </Suspense>
  );
}

