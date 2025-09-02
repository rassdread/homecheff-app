import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-08-27.basil" });

const PLAN_TO_PRICE: Record<string, string | undefined> = {
  BASIC: process.env.STRIPE_PRICE_BASIC,
  PRO: process.env.STRIPE_PRICE_PRO,
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM,
};

export async function POST(req: NextRequest) {
  try {
    const { plan, userId } = await req.json();

    if (!plan || !PLAN_TO_PRICE[plan]) {
      return NextResponse.json({ error: "Onbekend plan of ontbrekende price id" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "userId ontbreekt" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PLAN_TO_PRICE[plan]!, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/sell?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/sell?canceled=1`,
      metadata: { plan, userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("subscribe error", e);
    return NextResponse.json({ error: "Kon abonnement niet starten" }, { status: 500 });
  }
}
