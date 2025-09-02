export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "anon";
  const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip, take: pageSize,
        include: {
          items: { include: { Product: true } }
        }
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return NextResponse.json({ orders, total, page, pageSize });
  } catch (e) {
    console.error("orders GET error", e);
    return NextResponse.json({ error: "Kon orders niet laden" }, { status: 500 });
  }
}
