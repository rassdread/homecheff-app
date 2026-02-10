import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createConnectAccount, stripe } from '@/lib/stripe';

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

    // Check if account exists in Stripe and get real status
    let isCompleted = false;
    if (user.stripeConnectAccountId && stripe) {
      try {
        const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
        isCompleted = account.charges_enabled && account.payouts_enabled;
        
        // Update database with real status
        await prisma.user.update({
          where: { email: session.user.email },
          data: { stripeConnectOnboardingCompleted: isCompleted }
        });
      } catch (err) {
        console.error('Error checking Stripe account:', err);
        // Use database value if API call fails
        isCompleted = !!user.stripeConnectOnboardingCompleted;
      }
    }

    return NextResponse.json({
      hasAccount: !!user.stripeConnectAccountId,
      isCompleted,
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
    
    // Check if existing account is valid (not a fake test ID)
    const isFakeTestAccount = accountId && accountId.startsWith('acct_test_');
    
    if (!accountId || isFakeTestAccount) {
      // Clear fake account ID if exists
      if (isFakeTestAccount) {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            stripeConnectAccountId: null,
            stripeConnectOnboardingCompleted: false 
          }
        });
        accountId = null;
      }
      
      // Create new account
      if (!accountId) {
        try {
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
        } catch (error: any) {
          console.error('Error creating Connect account:', error);
          return NextResponse.json(
            { error: `Failed to create Connect account: ${error.message}` },
            { status: 500 }
          );
        }
      }
    }

    // Create Stripe account link for onboarding
    const { stripe } = await import('@/lib/stripe');
    
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }
    
    // Get base URL - use NEXT_PUBLIC_BASE_URL if available, otherwise default to localhost
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/seller/stripe/refresh`,
      return_url: `${baseUrl}/seller/stripe/success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      onboardingUrl: accountLink.url,
      accountId: accountId
    });

  } catch (error) {
    console.error('Stripe Connect onboarding error:', error);
    
    // More specific error messages
    let errorMessage = 'Failed to create Stripe Connect onboarding';
    
    if (error instanceof Error) {
      if (error.message.includes('No such account')) {
        errorMessage = 'Stripe Connect account not found. Please try again.';
      } else if (error.message.includes('Invalid API key')) {
        errorMessage = 'Stripe API key is invalid. Please contact support.';
      } else if (error.message.includes('rate_limit')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else {
        errorMessage = `Stripe error: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}