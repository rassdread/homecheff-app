import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AffiliateDashboardClient from './page-client';
import MyAffiliateProgram from '@/components/affiliate/MyAffiliateProgram';
import AffiliateEmailNotice from '@/components/affiliate/AffiliateEmailNotice';

export const dynamic = 'force-dynamic';

export default async function AffiliateDashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login?callbackUrl=/affiliate/dashboard');
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
    redirect('/login?callbackUrl=/affiliate/dashboard');
  }

  // An existing affiliate is already authenticated. Do not turn the dashboard
  // into an email-code gate. Confirmation stays optional for payouts.
  if (!user.affiliate) {
    redirect('/affiliate');
  }

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 pt-6">
        {!user.emailVerified && user.email ? (
          <AffiliateEmailNotice email={user.email} nextPath="/affiliate/dashboard" />
        ) : null}
        <MyAffiliateProgram affiliateId={user.affiliate.id} />
      </div>
      <AffiliateDashboardClient />
    </>
  );
}

