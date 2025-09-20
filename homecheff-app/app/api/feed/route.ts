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

  // Build where clause for products
  const where: any = {
    isActive: true
  };

  // Search query
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } }
    ];
  }

  // Category filter
  if (vertical && vertical !== "all") {
    where.category = vertical.toUpperCase();
  }

  // Location filters - Note: SellerProfile doesn't have place field, so we'll skip place filtering for now
  if (lat && lng) {
    const lat0 = Number(lat);
    const lng0 = Number(lng);
    const dLat = radius / 111.32;
    const dLng = radius / (111.32 * Math.cos((lat0 * Math.PI) / 180));
    
    where.seller = {
      lat: { gte: lat0 - dLat, lte: lat0 + dLat },
      lng: { gte: lng0 - dLng, lte: lng0 + dLng }
    };
  }

  // Get Products from both new and old models
  const [newProducts, oldListings] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(q ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } }
          ]
        } : {}),
        ...(vertical && vertical !== "all" ? {
          category: vertical.toUpperCase() as any
        } : {}),
        ...(lat && lng ? {
          seller: {
            lat: { gte: Number(lat) - (radius / 111.32), lte: Number(lat) + (radius / 111.32) },
            lng: { gte: Number(lng) - (radius / (111.32 * Math.cos((Number(lat) * Math.PI) / 180))), lte: Number(lng) + (radius / (111.32 * Math.cos((Number(lat) * Math.PI) / 180))) }
          }
        } : {})
      },
      orderBy: [{ createdAt: "desc" }],
      take: 15,
      include: {
        seller: {
          include: {
            User: { select: { id: true, name: true, username: true, profileImage: true } }
          }
        },
        Image: { 
          select: { fileUrl: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    }),
    prisma.listing.findMany({
      where: {
        isPublic: true,
        ...(q ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } }
          ]
        } : {}),
        ...(vertical && vertical !== "all" ? {
          vertical: vertical.toUpperCase() as any
        } : {}),
        ...(lat && lng ? {
          lat: { gte: Number(lat) - (radius / 111.32), lte: Number(lat) + (radius / 111.32) },
          lng: { gte: Number(lng) - (radius / (111.32 * Math.cos((Number(lat) * Math.PI) / 180))), lte: Number(lng) + (radius / (111.32 * Math.cos((Number(lat) * Math.PI) / 180))) }
        } : {})
      },
      orderBy: [{ createdAt: "desc" }],
      take: 15,
      include: {
        User: { select: { id: true, name: true, username: true, profileImage: true } },
        ListingMedia: { 
          select: { url: true, order: true },
          orderBy: { order: 'asc' }
        }
      }
    })
  ]);

  // Transform old listings to match new product format
  const transformedListings = oldListings.map(listing => ({
    id: listing.id,
    title: listing.title || "",
    description: listing.description || "",
    priceCents: listing.priceCents || 0,
        category: (listing as any).vertical || "HOMECHEFF",
    status: "ACTIVE" as const,
    place: "Nederland",
    lat: listing.lat || 52.3676,
    lng: listing.lng || 4.9041,
    isPublic: true,
    viewCount: 0,
    createdAt: listing.createdAt,
    updatedAt: listing.createdAt,
    User: listing.User,
    ListingMedia: listing.ListingMedia.map(media => ({
      url: media.url,
      order: media.order,
      isMain: media.order === 0
    }))
  }));

  // Transform new products to match listing format
  const transformedProducts = newProducts.map(product => ({
    id: product.id,
    ownerId: product.seller?.User?.id || "",
    title: product.title || "",
    description: product.description || "",
    priceCents: product.priceCents || 0,
    category: product.category || "HOMECHEFF",
    status: "ACTIVE" as const,
    place: "Nederland",
    lat: product.seller?.lat || 52.3676,
    lng: product.seller?.lng || 4.9041,
    isPublic: true,
    viewCount: 0,
    createdAt: product.createdAt,
    updatedAt: product.createdAt,
    User: product.seller?.User || null,
    ListingMedia: product.Image.map(img => ({
      url: img.fileUrl,
      order: img.sortOrder,
      isMain: img.sortOrder === 0
    }))
  }));

  // Combine and sort all items
  const allItems = [...transformedProducts, ...transformedListings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 30);

  return NextResponse.json({
    filters: { q, vertical, subfilters, radius, lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null },
    count: allItems.length,
    items: allItems,
  });
}
