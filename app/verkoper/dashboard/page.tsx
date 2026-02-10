import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import SellerDashboardClient from './page-client';

export const dynamic = 'force-dynamic';

export default async function SellerDashboardPageWrapper() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;

  // Check email verification - redirect if not verified
  // Note: Social login users (Google/Facebook) have emailVerified set automatically
  const emailCheckUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      email: true, 
      emailVerified: true,
      passwordHash: true // Check if user has password (if not, likely social login)
    }
  });

  // Check if user has social login accounts (Google/Facebook)
  const socialAccounts = await prisma.account.findMany({
    where: { 
      userId: userId,
      provider: { in: ['google', 'facebook'] }
    },
    select: { provider: true }
  });

  const hasSocialAccount = socialAccounts.length > 0 || !emailCheckUser?.passwordHash; // If no password, likely social login

  // If user has social login and emailVerified is null, set it automatically
  if (emailCheckUser && emailCheckUser.emailVerified === null && hasSocialAccount) {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() }
    });
    // Reload user data after update
    emailCheckUser.emailVerified = new Date();
  }

  // Only redirect if emailVerified is null (not verified), not if it's a Date (verified)
  // Skip redirect for social login users - their email is already verified by Google/Facebook
  if (!emailCheckUser || (emailCheckUser.emailVerified === null && !hasSocialAccount)) {
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email || '')}`);
  }

  // Check if user has seller access
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      sellerRoles: true, 
      role: true 
    }
  });

  const hasSellerRoles = user?.sellerRoles && user.sellerRoles.length > 0;
  const isSeller = user?.role === 'SELLER';

  // Redirect if user is not a seller
  if (!hasSellerRoles && !isSeller) {
    redirect('/');
  }

  return <SellerDashboardClient />;
}

