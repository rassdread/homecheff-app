import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = (globalThis as any).__prisma ?? new PrismaClient();
if (!(globalThis as any).__prisma) (globalThis as any).__prisma = prisma;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const {
      title,
      description = "",
      priceCents,
      price,
      image,
      publish = true,
      userId,
    } = body ?? {};

    if (!title || (!priceCents && !price)) {
      return NextResponse.json(
        { ok: false, message: "title en prijs zijn verplicht" },
        { status: 400 }
      );
    }
    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "userId ontbreekt (haal uit sessie of meegeven)" },
        { status: 401 }
      );
    }

    const cents =
      typeof priceCents === "number"
        ? Math.round(priceCents)
        : Math.round(Number(price) * 100);

    const listing = await prisma.listing.create({
      data: {
        title: String(title),
        description: String(description ?? ""),
        priceCents: cents,
        image: image ?? null,
        isPublished: !!publish,
        publishedAt: publish ? new Date() : null,
        authorId: String(userId),
      } as any,
    });

    try { revalidateTag("feed"); } catch {}

    return NextResponse.json({ ok: true, listing }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/listings]", err);
    return NextResponse.json({ ok: false, message: "server_error" }, { status: 500 });
  }
}
