import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function toNumber(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const vertical = (searchParams.get("vertical") || "all").toLowerCase();
  const subfilters = (searchParams.get("subfilters") || "").split(",").map(s => s.trim()).filter(Boolean);
  let radius = toNumber(searchParams.get("radius"), 10);

  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.user?.id || null;

  let lat = searchParams.get("lat");
  let lng = searchParams.get("lng");
  const place = searchParams.get("place")?.trim() || "";

  if ((!lat || !lng) && userId) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { lat: true, lng: true } });
    if (u?.lat != null && u?.lng != null) {
      lat = String(u.lat);
      lng = String(u.lng);
    }
  }

  const where: any = { isPublic: true };
  // Als plaats ingevuld is, filter op plaats en negeer lat/lng
  if (place) {
    where.place = { contains: place, mode: "insensitive" };
    lat = null;
    lng = null;
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } }
    ];
  }

  if (vertical && vertical !== "all") {
    where.vertical = vertical.toUpperCase();
  }

  if (subfilters.length) {
    where.tags = { hasSome: subfilters };
  }

  if (lat && lng) {
    const lat0 = Number(lat);
    const lng0 = Number(lng);
    const dLat = radius / 111.32;
    const dLng = radius / (111.32 * Math.cos((lat0 * Math.PI) / 180));
    where.AND = [
      ...(where.AND || []),
      { lat: { gte: lat0 - dLat, lte: lat0 + dLat } },
      { lng: { gte: lng0 - dLng, lte: lng0 + dLng } },
    ];
  }

  const items = await prisma.listing.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: 60,
    include: {
  User: { select: { id: true, name: true, username: true, image: true } },
  ListingMedia: { select: { url: true, order: true } }
    }
  });

  return NextResponse.json({
    filters: { q, vertical, subfilters, radius, lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null },
    count: items.length,
    items,
  });
}
