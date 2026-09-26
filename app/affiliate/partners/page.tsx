import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { buildVerifyEmailPath } from '@/lib/affiliate/signup-flow';
import MyPartnersClient from '@/components/affiliate/MyPartnersClient';

export const dynamic = 'force-dynamic';

export default async function MyPartnersPage({
  searchParams,
}: {
  searchParams?: { invite?: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/affiliate/partners');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: {
      email: true,
      emailVerified: true,
      affiliate: {
        select: { id: true, parentAffiliateId: true },
      },
    },
  });

  if (!user || !user.emailVerified) {
    redirect(buildVerifyEmailPath(session.user.email || '', '/affiliate/partners'));
  }
  if (!user.affiliate) {
    redirect('/affiliate');
  }
  if (user.affiliate.parentAffiliateId) {
    redirect('/affiliate/dashboard');
  }
  const { resolveStoredAffiliateCapabilities } = await import('@/lib/affiliate/program-store');
  const rights = await resolveStoredAffiliateCapabilities(user.affiliate.id);
  if (
    !rights.capabilities.CAN_ACCESS_NETWORK_DASHBOARD.value &&
    !rights.capabilities.CAN_INVITE_SUB_AFFILIATES.value
  ) {
    redirect('/affiliate/dashboard');
  }

  return <MyPartnersClient openInvite={searchParams?.invite === '1'} />;
}
