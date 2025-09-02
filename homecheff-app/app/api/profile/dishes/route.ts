import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getEmail() {
  try {
    const mod: any = await import("@/lib/auth");
    const session = await mod.auth?.();
    if (session?.user?.email) return session.user.email as string;
  } catch {}
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions as any);
    if ((session as any)?.user?.email) return (session as any).user.email as string;
  } catch {}
  return null;
}

export async function GET() {
  const email = await getEmail();
  if (!email) return NextResponse.json({ items: [] });
  const me = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!me) return NextResponse.json({ items: [] });

  const items = await prisma.dish.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    include: { photos: { orderBy: { idx: "asc" } } }
  });
  return NextResponse.json({ items });
}

function parsePriceCents(euroStr: string | null | undefined) {
  if (!euroStr) return null;
  const cleaned = euroStr.replace(/[^0-9,\.]/g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export async function POST(req: Request) {
  try {
    const email = await getEmail();
    if (!email) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    const me = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!me) return NextResponse.json({ error: "Gebruiker niet gevonden" }, { status: 404 });

    const body = await req.json();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const status = body.status === "PUBLISHED" ? "PUBLISHED" : "PRIVATE";
    const photos: string[] = Array.isArray(body.photos) ? body.photos.slice(0, 5) : [];

    const priceCents = parsePriceCents(body.priceEuro);
    const deliveryMode = (["PICKUP","DELIVERY","BOTH"].includes(body.deliveryMode)) ? body.deliveryMode as "PICKUP"|"DELIVERY"|"BOTH" : null;
    const lat = typeof body.lat === "number" ? body.lat : null;
    const lng = typeof body.lng === "number" ? body.lng : null;
    const place = typeof body.place === "string" ? (body.place as string).slice(0, 100) : null;

    if (status === "PUBLISHED") {
      if (!priceCents) return NextResponse.json({ error: "Prijs is verplicht voor publiceren" }, { status: 400 });
      if (!deliveryMode) return NextResponse.json({ error: "Bezorgoptie is verplicht voor publiceren" }, { status: 400 });
    }

    const dish = await prisma.dish.create({
      data: {
        userId: me.id,
        title,
        description,
        status,
        priceCents: priceCents ?? undefined,
        deliveryMode: deliveryMode ?? undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        place: place ?? undefined,
        photos: { create: photos.map((url: string, i: number) => ({ url, idx: i })) }
      },
      include: { photos: true }
    });

    return NextResponse.json({ ok: true, dish });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
