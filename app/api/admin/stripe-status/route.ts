import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Only expose safe configuration health flags to avoid leaking key fragments.
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
        startsWith_sk_test: stripeSecretKey.startsWith('sk_test'),
        startsWith_sk_live: stripeSecretKey.startsWith('sk_live'),
        mode: isLiveMode ? 'live' : isTestMode ? 'test' : 'unknown'
      },
      stripePublishableKey: {
        exists: !!stripePublishableKey,
        length: stripePublishableKey.length,
        startsWith_pk_test: stripePublishableKey.startsWith('pk_test'),
        startsWith_pk_live: stripePublishableKey.startsWith('pk_live')
      },
      webhookSecret: {
        exists: !!webhookSecret,
        length: webhookSecret.length
      },
      connectClientId: {
        exists: !!connectClientId,
        length: connectClientId.length
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















