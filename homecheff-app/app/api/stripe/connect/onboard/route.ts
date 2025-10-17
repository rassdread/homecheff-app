import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createConnectAccount } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
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
      isCompleted: !!user.stripeConnectOnboardingCompleted,
      accountId: user.stripeConnectAccountId
    });

  } catch (error) {
    console.error('Stripe Connect status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check Stripe Connect status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        email: true, 
        name: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user already has a completed Stripe Connect account, return success
    if (user.stripeConnectOnboardingCompleted && user.stripeConnectAccountId) {
      return NextResponse.json({ 
        success: true, 
        message: 'Stripe Connect already set up',
        accountId: user.stripeConnectAccountId
      });
    }

    // Create or get existing Stripe Connect account
    let accountId = user.stripeConnectAccountId;
    
    if (!accountId) {
      const connectAccount = await createConnectAccount(
        user.email,
        'NL',
        'express'
      );
      accountId = connectAccount.id;

      // Update user with new account ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectAccountId: accountId }
      });
    }

    // Create Stripe account link for onboarding
    const { stripe } = await import('@/lib/stripe');
    
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/seller/stripe/refresh`,
      return_url: `${process.env.NEXTAUTH_URL}/seller/stripe/success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      onboardingUrl: accountLink.url,
      accountId: accountId
    });

  } catch (error) {
    console.error('Stripe Connect onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect onboarding' },
      { status: 500 }
    );
  }
}