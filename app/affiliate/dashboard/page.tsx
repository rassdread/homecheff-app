import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AffiliateDashboardClient from './page-client';

export const dynamic = 'force-dynamic';

export default async function AffiliateDashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
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
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email || '')}`);
  }

  // Redirect to signup if no affiliate account
  if (!user.affiliate) {
    redirect('/affiliate');
  }

  return <AffiliateDashboardClient />;
}

