import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import Stripe from 'stripe';

// Test mode - gebruik sandbox keys
const isTestMode = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test');

const stripe = isTestMode && process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    })
  : null;

export async function POST(req: Request) {
  const { code } = await req.json();
  
  // In test mode, simuleer coupon validatie
  if (isTestMode) {
    if (code === 'test' || code === 'welcome') {
      return NextResponse.json({ valid: true, testMode: true });
    }
    return NextResponse.json({ valid: false, testMode: true });
  }
  
  if (!stripe) {
    return NextResponse.json({ coupons: [], testMode: true });
  }
  
  const coupons = await stripe.coupons.list();
  const found = coupons.data.find(c => c.name === code && c.valid);
  if (!found) {
    return NextResponse.json({ valid: false });
  }
  return NextResponse.json({ valid: true, discount: found.amount_off || found.percent_off, coupon: found });
}
