import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import OperationsShell from '@/components/operations/OperationsShell';
import AffiliatePromoLibraryClient from '@/components/affiliate/AffiliatePromoLibraryClient';
import { getPlatformAdmin } from '@/lib/admin-guard';
import { buildVerifyEmailPath } from '@/lib/affiliate/signup-flow';

export const dynamic = 'force-dynamic';

export default async function AffiliatePromoLibraryPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login?callbackUrl=/affiliate/promotiemateriaal');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      emailVerified: true,
      affiliate: { select: { id: true, status: true } },
    },
  });
  if (!user?.emailVerified) {
    redirect(buildVerifyEmailPath(session.user.email, '/affiliate/promotiemateriaal'));
  }
  const admin = await getPlatformAdmin();
  const isAffiliate = user?.affiliate?.status === 'ACTIVE';
  if (!isAffiliate && !admin.ok) {
    redirect('/affiliate');
  }
  if (isAffiliate && user.affiliate) {
    const { resolveStoredAffiliateCapabilities } = await import('@/lib/affiliate/program-store');
    const rights = await resolveStoredAffiliateCapabilities(user.affiliate.id);
    if (!rights.capabilities.CAN_USE_PROMO_LIBRARY.value && !admin.ok) {
      redirect('/affiliate/dashboard');
    }
  }

  return (
    <OperationsShell>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Promotiemateriaal</h1>
        <p className="mt-1 text-sm text-slate-600">
          Deel officiële HomeCheff-beelden of je eigen foto’s en korte video’s. Dit materiaal komt niet
          in de Marketplace-feed.
        </p>
        <div className="mt-6">
          <AffiliatePromoLibraryClient />
        </div>
      </div>
    </OperationsShell>
  );
}
