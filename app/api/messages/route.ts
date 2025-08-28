import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { conversationId, text } = await req.json();
  if (!conversationId || !text) return NextResponse.json({ error: "conversationId & text required" }, { status: 400 });

  const msg = await prisma.message.create({
    data: {
      conversationId,
      senderId: "demo-user",
      text,
    },
  });
  return NextResponse.json(msg, { status: 201 });
}
