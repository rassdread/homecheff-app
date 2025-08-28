import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { listingId, message, quantity = 1 } = await req.json();
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const reservation = await prisma.reservation.create({
    data: {
      listingId,
      buyerId: "demo-user",
      sellerId: listing.ownerId,
      status: "PENDING",
      message: message ?? null,
      quantity,
    },
  });

  // auto-conversatie voor DM
  const convo = await prisma.conversation.create({
    data: {
      reservationId: reservation.id,
      participants: {
        create: [
          { userId: reservation.buyerId },
          { userId: reservation.sellerId },
        ],
      },
    },
  });

  return NextResponse.json({ reservation, conversationId: convo.id }, { status: 201 });
}
