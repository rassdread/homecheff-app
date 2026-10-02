import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AffiliateDashboardClient from './page-client';
import MyAffiliateProgram from '@/components/affiliate/MyAffiliateProgram';
import AffiliateEmailNotice from '@/components/affiliate/AffiliateEmailNotice';
import AffiliatePersonalShareCard from '@/components/affiliate/AffiliatePersonalShareCard';
import { affiliatePlaceHref, type AffiliatePlace } from '@/lib/affiliate/affiliate-sections';

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

  const showPersonalShare = place === 'overzicht' || place === 'promoten';

  return (
    <>
      {showPersonalShare ? (
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <AffiliatePersonalShareCard />
        </div>
      ) : null}
      <div className="mx-auto max-w-5xl px-4 pt-6">
        {!user.emailVerified && user.email ? (
          <AffiliateEmailNotice email={user.email} nextPath={nextPath} />
        ) : null}
        <MyAffiliateProgram affiliateId={user.affiliate.id} />
      </div>
      <AffiliateDashboardClient place={place} />
    </>
  );
}
