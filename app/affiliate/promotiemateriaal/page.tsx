import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import OperationsShell from '@/components/operations/OperationsShell';
import AffiliatePromoLibraryClient from '@/components/affiliate/AffiliatePromoLibraryClient';
import { getPlatformAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

export default async function AffiliatePromoLibraryPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      emailVerified: true,
      affiliate: { select: { id: true, status: true } },
    },
  });
  if (!user?.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email)}`);
  }
  const admin = await getPlatformAdmin();
  const isAffiliate = user?.affiliate?.status === 'ACTIVE';
  if (!isAffiliate && !admin.ok) {
    redirect('/affiliate');
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
