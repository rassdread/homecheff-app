import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { 
          error: 'Stripe not configured',
          testMode: true,
          mockSession: {
            id: sessionId,
            amount_total: 2500, // €25.00 in cents
            metadata: { productId: 'test', quantity: '1' }
          }
        },
        { status: 200 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error retrieving session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}

