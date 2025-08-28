import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { status } = await req.json();
  const allowed = ["PENDING", "CONFIRMED", "CANCELLED", "REJECTED", "COMPLETED"];
  if (!allowed.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const r = await prisma.reservation.update({ where: { id: params.id }, data: { status } });
  return NextResponse.json(r);
}
