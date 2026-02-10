import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isTestMode, isStripeTestId } from '@/lib/stripe';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' });

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripeConnectAccountId) {
      return NextResponse.json({
        connected: false,
        accountId: null,
        details: null,
        payoutsEnabled: false
      });
    }

    // Check if account ID matches current mode (test/live)
    const accountIsTest = isStripeTestId(user.stripeConnectAccountId);
    if (accountIsTest !== isTestMode) {
      // Account is from different mode, clear it
      await prisma.user.update({
        where: { email: userEmail },
        data: {
          stripeConnectAccountId: null,
          stripeConnectOnboardingCompleted: false
        }
      });
      return NextResponse.json({
        connected: false,
        accountId: null,
        details: null,
        payoutsEnabled: false,
        error: 'Account from different Stripe mode. Please reconnect.'
      });
    }

    try {
      // Get account details from Stripe
      const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);

      return NextResponse.json({
        connected: user.stripeConnectOnboardingCompleted,
        accountId: user.stripeConnectAccountId,
        details: {
          email: account.email,
          country: account.country,
          type: account.type,
          businessType: account.business_type,
          payoutsEnabled: account.payouts_enabled,
          chargesEnabled: account.charges_enabled,
          detailsSubmitted: account.details_submitted
        },
        payoutsEnabled: account.payouts_enabled || false
      });
    } catch (stripeError: any) {
      console.error('Stripe account retrieval error:', stripeError);
      // If account doesn't exist, clear it from database
      if (stripeError.code === 'resource_missing' || stripeError.statusCode === 404) {
        await prisma.user.update({
          where: { email: userEmail },
          data: {
            stripeConnectAccountId: null,
            stripeConnectOnboardingCompleted: false
          }
        });
      }
      return NextResponse.json({
        connected: false,
        accountId: null,
        details: null,
        payoutsEnabled: false,
        error: stripeError.message || 'Account not found in Stripe'
      });
    }
  } catch (error) {
    console.error('Error fetching Stripe status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Stripe status' },
      { status: 500 }
    );
  }
}




