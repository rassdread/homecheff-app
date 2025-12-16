import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get raw environment variables (for debugging)
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    const connectClientId = process.env.STRIPE_CONNECT_CLIENT_ID || '';

    // Determine mode
    const isTestMode = !stripeSecretKey || stripeSecretKey.startsWith('sk_test');
    const isLiveMode = stripeSecretKey.startsWith('sk_live');

    return NextResponse.json({
      stripeSecretKey: {
        exists: !!stripeSecretKey,
        length: stripeSecretKey.length,
        prefix: stripeSecretKey ? `${stripeSecretKey.substring(0, 15)}...` : 'NOT SET',
        startsWith_sk_test: stripeSecretKey.startsWith('sk_test'),
        startsWith_sk_live: stripeSecretKey.startsWith('sk_live'),
        mode: isLiveMode ? 'live' : isTestMode ? 'test' : 'unknown'
      },
      stripePublishableKey: {
        exists: !!stripePublishableKey,
        length: stripePublishableKey.length,
        prefix: stripePublishableKey ? `${stripePublishableKey.substring(0, 15)}...` : 'NOT SET',
        startsWith_pk_test: stripePublishableKey.startsWith('pk_test'),
        startsWith_pk_live: stripePublishableKey.startsWith('pk_live')
      },
      webhookSecret: {
        exists: !!webhookSecret,
        length: webhookSecret.length,
        prefix: webhookSecret ? `${webhookSecret.substring(0, 10)}...` : 'NOT SET'
      },
      connectClientId: {
        exists: !!connectClientId,
        length: connectClientId.length,
        prefix: connectClientId ? `${connectClientId.substring(0, 10)}...` : 'NOT SET'
      },
      detectedMode: isLiveMode ? 'live' : isTestMode ? 'test' : 'unknown',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check Stripe status' },
      { status: 500 }
    );
  }
}

