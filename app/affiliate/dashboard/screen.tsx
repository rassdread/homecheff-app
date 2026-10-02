import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AffiliateDashboardClient from './page-client';
import MyAffiliateProgram from '@/components/affiliate/MyAffiliateProgram';
import AffiliateEmailNotice from '@/components/affiliate/AffiliateEmailNotice';
import AffiliatePersonalShareCard from '@/components/affiliate/AffiliatePersonalShareCard';
import { AffiliatePersonalShareProvider } from '@/components/affiliate/AffiliatePersonalShareProvider';
import { affiliatePlaceHref, type AffiliatePlace } from '@/lib/affiliate/affiliate-sections';
import { buildPersonalReferralUrl } from '@/lib/affiliates/personal-referral';
import { getPublicAppUrl } from '@/lib/public-app-url';

export async function AffiliateDashboardScreen({
  place,
}: {
  place: AffiliatePlace;
}) {
  const nextPath = affiliatePlaceHref(place);
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(nextPath)}`);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      affiliate: {
        select: {
          id: true,
          referralLinks: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { code: true },
          },
        },
      },
    },
  });

  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(nextPath)}`);
  }

  if (!user.affiliate) {
    redirect('/affiliate');
  }

  const existingCode = user.affiliate.referralLinks[0]?.code ?? null;
  const existingShareLink = existingCode
    ? buildPersonalReferralUrl(getPublicAppUrl(), existingCode)
    : null;
  // A commission seat without a personal ReferralLink is not a personal affiliate.
  // The share card appears only after canonical activation has created that link.
  const showPersonalShare = (place === 'overzicht' || place === 'promoten') && Boolean(existingCode);

  return (
    <AffiliatePersonalShareProvider
      referralCode={existingCode}
      referralLink={existingShareLink}
    >
      {showPersonalShare ? (
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <AffiliatePersonalShareCard
            referralCode={existingCode}
            referralLink={existingShareLink}
            serverShareState={existingCode ? 'present' : 'missing'}
          />
        </div>
      ) : null}
      <div className="mx-auto max-w-5xl px-4 pt-6">
        {!user.emailVerified && user.email ? (
          <AffiliateEmailNotice email={user.email} nextPath={nextPath} />
        ) : null}
        <MyAffiliateProgram affiliateId={user.affiliate.id} />
      </div>
      <AffiliateDashboardClient place={place} />
    </AffiliatePersonalShareProvider>
  );
}
