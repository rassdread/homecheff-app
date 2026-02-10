import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({
        error: 'Stripe not configured',
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...'
      }, { status: 500 });
    }

    // Test the API key by making a simple request
    const account = await stripe.accounts.retrieve();
    
    return NextResponse.json({
      success: true,
      accountId: account.id,
      country: account.country,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      testMode: account.id.startsWith('acct_test_')
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      type: error.type,
      code: error.code,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...'
    }, { status: 500 });
  }
}

