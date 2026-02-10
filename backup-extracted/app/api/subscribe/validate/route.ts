import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { PLAN_TO_PRICE } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  try {
    const plan = req.nextUrl.searchParams.get('plan')?.toUpperCase();
    
    if (!plan || !['BASIC', 'PRO', 'PREMIUM'].includes(plan)) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Onbekend abonnementstype' 
      }, { status: 400 });
    }

    const priceId = PLAN_TO_PRICE[plan];
    
    if (!priceId) {
      return NextResponse.json({ 
        valid: false, 
        error: `Abonnement ${plan} is nog niet geconfigureerd. Neem contact op met support.`,
        missingPriceId: true
      }, { status: 400 });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Stripe is niet geconfigureerd' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      valid: true, 
      plan,
      priceId 
    });
  } catch (e) {
    console.error("validate subscription error", e);
    return NextResponse.json({ 
      valid: false, 
      error: 'Kon abonnement niet valideren' 
    }, { status: 500 });
  }
}

