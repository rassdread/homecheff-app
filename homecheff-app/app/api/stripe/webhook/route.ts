import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

async function readBuffer(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((acc, cur) => new Uint8Array([...acc, ...cur]), new Uint8Array());
  return Buffer.from(total);
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-08-27.basil" });
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const buf = await readBuffer(req.body!);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook signature verify failed", err?.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const plan = session.metadata?.plan;
      const userId = session.metadata?.userId;
      if (plan && userId) {
        await prisma.subscription.upsert({
          where: { id: userId },
          update: {
            name: plan as any,
            isActive: true,
          },
          create: {
            id: userId,
            name: plan as any,
            isActive: true,
            priceCents: 0,
            feeBps: 0,
            durationDays: 0,
            updatedAt: new Date(),
          },
        });
      }
    }
  } catch (e) {
    console.error("Webhook handling error", e);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }

  return new NextResponse("ok", { status: 200 });
}
