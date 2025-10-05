import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createConnectAccount, createAccountLink } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with seller profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { SellerProfile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'SELLER') {
      return NextResponse.json({ error: 'Only sellers can set up Stripe Connect' }, { status: 403 });
    }

    // Check if user already has a Stripe Connect account
    if (user.stripeConnectAccountId && user.stripeConnectOnboardingCompleted) {
      return NextResponse.json({ 
        error: 'Stripe Connect already set up',
        accountId: user.stripeConnectAccountId 
      }, { status: 400 });
    }

    let accountId = user.stripeConnectAccountId;

    // Create Stripe Connect account if not exists
    if (!accountId) {
      const account = await createConnectAccount(user.email, 'NL', 'express');
      accountId = account.id;

      // Save account ID to user
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectAccountId: accountId }
      });
    }

    // Create account link for onboarding
    const refreshUrl = `${req.nextUrl.origin}/seller/stripe/refresh`;
    const returnUrl = `${req.nextUrl.origin}/seller/stripe/success`;

    const accountLink = await createAccountLink(accountId, refreshUrl, returnUrl);

    return NextResponse.json({
      url: accountLink.url,
      accountId,
      expiresAt: accountLink.expires_at
    });

  } catch (error) {
    console.error('Stripe Connect onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect onboarding' },
      { status: 500 }
    );
  }
}

// Check onboarding status
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      hasAccount: !!user.stripeConnectAccountId,
      isCompleted: user.stripeConnectOnboardingCompleted,
      accountId: user.stripeConnectAccountId
    });

  } catch (error) {
    console.error('Stripe Connect status error:', error);
    return NextResponse.json(
      { error: 'Failed to check Stripe Connect status' },
      { status: 500 }
    );
  }
}