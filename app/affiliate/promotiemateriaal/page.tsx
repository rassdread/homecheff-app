import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import OperationsShell from '@/components/operations/OperationsShell';
import AffiliatePromoLibraryClient from '@/components/affiliate/AffiliatePromoLibraryClient';
import { getPlatformAdmin } from '@/lib/admin-guard';
import { affiliateMayUsePromoLibrary } from '@/lib/affiliate/promo-access';
import { promoLibraryPath, parsePromoPlatform } from '@/lib/affiliate-media/platform';

export const dynamic = 'force-dynamic';

export default async function AffiliatePromoLibraryPage({
  searchParams,
}: {
  searchParams?: { platform?: string; source?: string };
}) {
  const platform = parsePromoPlatform(searchParams?.platform);
  const source =
    searchParams?.source === 'official' ||
    searchParams?.source === 'community' ||
    searchParams?.source === 'mine'
      ? searchParams.source
      : 'all';
  const nextPath = promoLibraryPath({ platform, source });
  const session = await auth();
  if (!session?.user?.email) redirect(`/login?callbackUrl=${encodeURIComponent(nextPath)}`);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      affiliate: { select: { id: true, status: true } },
    },
  });
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(nextPath)}`);
  }
  const admin = await getPlatformAdmin();
  const isAffiliate = user?.affiliate?.status === 'ACTIVE';
  if (!isAffiliate && !admin.ok) {
    redirect('/affiliate');
  }
  if (isAffiliate && user.affiliate) {
    const { resolveStoredAffiliateCapabilities } = await import('@/lib/affiliate/program-store');
    const rights = await resolveStoredAffiliateCapabilities(user.affiliate.id);
    if (
      !affiliateMayUsePromoLibrary({
        operationsBlocked: rights.operationsBlocked,
        capability: rights.capabilities.CAN_USE_PROMO_LIBRARY,
      }) &&
      !admin.ok
    ) {
      redirect('/affiliate/dashboard');
    }
  }

  return (
    <OperationsShell>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <Suspense fallback={null}>
          <AffiliatePromoLibraryClient />
        </Suspense>
      </div>
    </OperationsShell>
  );
}
