import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); // <-- geen apiVersion meer
  ;

export async function POST(req: NextRequest) {
  const { items } = await req.json();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "ideal"],
    mode: "payment",
    line_items: items.map((item: any) => ({
      price_data: {
        currency: "eur",
        product_data: { name: item.title },
        unit_amount: item.priceCents,
      },
      quantity: item.quantity,
    })),
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
  });
  return NextResponse.json({ url: session.url });
}
