import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AffiliatePageClient from './page-client';

export const dynamic = 'force-dynamic';

export default async function AffiliatePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      affiliate: true,
    },
  });

  // If user already has affiliate account, redirect to dashboard
  if (user?.affiliate) {
    redirect('/affiliate/dashboard');
  }

  return <AffiliatePageClient />;
}

