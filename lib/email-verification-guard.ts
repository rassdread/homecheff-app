import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

/**
 * Check if user's email is verified
 * If not verified, returns null (treat as not logged in)
 */
export async function requireEmailVerification() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { verified: false, user: null };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    }
  });

  if (!user || !user.emailVerified) {
    return { verified: false, user: null };
  }

  return { verified: true, user };
}

/**
 * Redirect to verification page if email is not verified
 * Use this in page components
 */
export async function checkEmailVerificationOrRedirect() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/login');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    }
  });

  // If not verified, redirect to verify-email page
  if (!user || !user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email)}`);
    return;
  }

  return user;
}


