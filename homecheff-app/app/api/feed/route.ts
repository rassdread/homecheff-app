import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateDistance } from "@/lib/geocoding";

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
  const [newProducts, oldListings, publishedDishes] = await Promise.all([
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
      select: {
        id: true,
        title: true,
        description: true,
        priceCents: true,
        delivery: true,
        category: true,
        createdAt: true,
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
    }),
    // Haal gepubliceerde dishes op
    prisma.dish.findMany({
      where: {
        status: "PUBLISHED",
        ...(q ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } }
          ]
        } : {}),
        ...(lat && lng ? {
          lat: { gte: Number(lat) - (radius / 111.32), lte: Number(lat) + (radius / 111.32) },
          lng: { gte: Number(lng) - (radius / (111.32 * Math.cos((Number(lat) * Math.PI) / 180))), lte: Number(lng) + (radius / (111.32 * Math.cos((Number(lat) * Math.PI) / 180))) }
        } : {})
      },
      orderBy: [{ createdAt: "desc" }],
      take: 15,
      include: {
        user: { select: { id: true, name: true, username: true, profileImage: true } },
        photos: { 
          select: { url: true, idx: true },
          orderBy: { idx: 'asc' }
        }
      }
    })
  ]);

  // Transform dishes to match new product format
  const transformedDishes = publishedDishes.map(dish => ({
    id: dish.id,
    title: dish.title || "",
    description: dish.description || "",
    priceCents: dish.priceCents || 0,
    delivery: dish.deliveryMode || "PICKUP",
    category: "CHEFF", // Default category for dishes
    createdAt: dish.createdAt,
    User: {
      id: dish.user.id,
      name: dish.user.name,
      username: dish.user.username,
      profileImage: dish.user.profileImage
    },
    images: dish.photos.map(photo => photo.url),
    image: dish.photos[0]?.url || null,
    location: {
      place: dish.place,
      lat: dish.lat,
      lng: dish.lng
    },
    stock: dish.stock || 0,
    maxStock: dish.maxStock,
    seller: {
      id: dish.user.id,
      name: dish.user.name,
      username: dish.user.username,
      avatar: dish.user.profileImage,
      displayFullName: (dish.user as any).displayFullName,
      displayNameOption: (dish.user as any).displayNameOption
    }
  }));

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
    image: listing.ListingMedia?.[0]?.url || null, // Add main image field
    images: listing.ListingMedia?.map(media => media.url) || [], // All images for slider
    ListingMedia: listing.ListingMedia.map(media => ({
      url: media.url,
      order: media.order,
      isMain: media.order === 0
    })),
    seller: listing.User ? {
      id: listing.User.id || undefined,
      name: listing.User.name || undefined,
      username: listing.User.username || undefined,
      avatar: listing.User.profileImage || undefined,
      displayFullName: (listing.User as any).displayFullName || undefined,
      displayNameOption: (listing.User as any).displayNameOption || undefined
    } : undefined
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
    lat: product.seller?.lat || null, // Don't use fallback - only real locations
    lng: product.seller?.lng || null, // Don't use fallback - only real locations
    isPublic: true,
    viewCount: 0,
    createdAt: product.createdAt,
    updatedAt: product.createdAt,
    User: product.seller?.User || null,
    image: product.Image?.[0]?.fileUrl || null, // Add main image field
    images: product.Image?.map(img => img.fileUrl) || [], // All images for slider
    ListingMedia: product.Image.map(img => ({
      url: img.fileUrl,
      order: img.sortOrder,
      isMain: img.sortOrder === 0
    })),
    seller: product.seller ? {
      id: product.seller.User?.id || undefined,
      name: product.seller.User?.name || undefined,
      username: product.seller.User?.username || undefined,
      avatar: product.seller.User?.profileImage || undefined,
      displayFullName: (product.seller.User as any)?.displayFullName || undefined,
      displayNameOption: (product.seller.User as any)?.displayNameOption || undefined,
      lat: product.seller.lat || null, // Include seller location for distance calculation
      lng: product.seller.lng || null
    } : undefined
  }));

  // Combine all items
  const allItems = [...transformedProducts, ...transformedListings, ...transformedDishes];
  
  // Calculate distances if location is available
  if (lat && lng) {
    const userLat = Number(lat);
    const userLng = Number(lng);
    
    allItems.forEach(item => {
      // Only calculate distance for items with real location data (not null)
      if ((item as any).lat !== null && (item as any).lng !== null && 
          !isNaN((item as any).lat) && !isNaN((item as any).lng)) {
        (item as any).distanceKm = calculateDistance(
          userLat,
          userLng,
          (item as any).lat,
          (item as any).lng
        );
      }
    });
  }
  
  // Sort by creation date
  const sortedItems = allItems.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 30);

  return NextResponse.json({
    filters: { q, vertical, subfilters, radius, lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null },
    count: sortedItems.length,
    items: sortedItems,
  });
}
