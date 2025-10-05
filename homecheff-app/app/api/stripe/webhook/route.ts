import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

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
      
      // Handle order creation
      if (session.metadata?.items) {
        const items = JSON.parse(session.metadata.items);
        const buyerId = session.metadata.buyerId;
        const deliveryMode = session.metadata.deliveryMode;
        const address = session.metadata.address;
        const notes = session.metadata.notes;
        const pickupDate = session.metadata.pickupDate;
        const deliveryDate = session.metadata.deliveryDate;
        const totalAmount = parseInt(session.metadata.totalAmount);

        // Create order
        const order = await prisma.order.create({
          data: {
            userId: buyerId,
            orderNumber: `ORD-${Date.now()}`,
            status: 'CONFIRMED',
            totalAmount: totalAmount,
            deliveryMode: deliveryMode as any,
            pickupAddress: deliveryMode === 'PICKUP' ? address : null,
            deliveryAddress: deliveryMode === 'DELIVERY' ? address : null,
            pickupDate: pickupDate ? new Date(pickupDate) : null,
            deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
            notes: notes,
          },
        });

        // Create order items
        for (const item of items) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              priceCents: item.priceCents,
            },
          });

          // Update product stock
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        // Create order conversation for communication
        await prisma.conversation.create({
          data: {
            id: `order_${order.id}`,
            orderId: order.id,
            title: `Bestelling ${order.orderNumber}`,
            lastMessageAt: new Date(),
            ConversationParticipant: {
              create: [
                { userId: buyerId },
                // Add seller participants based on items
                ...items.map((item: any) => ({
                  userId: item.sellerId,
                })),
              ],
            },
          },
        });

        console.log(`Order created: ${order.id} for user: ${buyerId}`);
      }
      
      // Handle subscription updates (existing code)
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
