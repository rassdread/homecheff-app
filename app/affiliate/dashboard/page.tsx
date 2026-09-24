import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AffiliateDashboardClient from './page-client';
import { buildVerifyEmailPath } from '@/lib/affiliate/signup-flow';

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

  // Check email verification - redirect if not verified
  if (!user || !user.emailVerified) {
    redirect(buildVerifyEmailPath(session.user.email || '', '/affiliate/dashboard'));
  }

  // Redirect to signup if no affiliate account
  if (!user.affiliate) {
    redirect('/affiliate');
  }

  return <AffiliateDashboardClient />;
}

