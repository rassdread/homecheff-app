import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { isStripeTestId } from "@/lib/stripe";
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

  // Handle international place geocoding
  if (place && (!lat || !lng)) {
    try {
      // Try multiple geocoding strategies
      let geocodingSuccess = false;
      
      // Use Google Maps geocoding for all countries (including Netherlands)
      const geocodeResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/geocoding/global`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: place,
          city: '',
          countryCode: 'NL'
        })
      });
      
      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json();
        if (geocodeData.lat && geocodeData.lng) {
          lat = String(geocodeData.lat);
          lng = String(geocodeData.lng);
          geocodingSuccess = true;
        }
      }
      
      // Strategy 3: Fallback to OpenStreetMap Nominatim
      if (!geocodingSuccess) {
        const nominatimResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1&addressdetails=1`, {
          headers: { 'User-Agent': 'HomeCheff-App/1.0' }
        });
        if (nominatimResponse.ok) {
          const nominatimData = await nominatimResponse.json();
          if (nominatimData && nominatimData.length > 0) {
            lat = String(nominatimData[0].lat);
            lng = String(nominatimData[0].lon);
            geocodingSuccess = true;

          }
        }
      }
      
      if (!geocodingSuccess) {

      }
      
    } catch (error) {

    }
  }

  // Fallback to user profile location if no coordinates found
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

  // Category filter - when "all" is selected, show all categories
  if (vertical && vertical !== "all") {
    where.category = vertical.toUpperCase();
  }
  // When vertical is "all", no category filter is applied (shows all categories)

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
  // Include both active products AND inactive products that have orders (to ensure existing products with sales history remain visible)
  const [allNewProducts, oldListings, publishedDishes] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { isActive: true },
          // Include inactive products that have orders (products with sales history should remain visible)
          {
            isActive: false,
            orderItems: {
              some: {
                Order: {
                  stripeSessionId: { not: null }
                }
              }
            }
          }
        ],
        ...(q ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } }
          ]
        } : {}),
        ...(vertical && vertical !== "all" ? {
          category: vertical.toUpperCase() as any
        } : {}),
        // Note: We don't filter by location here anymore - we'll filter in JavaScript
        // to support both pickup location and seller location fallback
      },
      orderBy: [{ createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        title: true,
        description: true,
        priceCents: true,
        delivery: true,
        category: true,
        createdAt: true,
        // pickupAddress, pickupLat, pickupLng - columns don't exist in database yet
        seller: {
          select: {
            id: true,
            lat: true,
            lng: true,
            kvk: true,
            companyName: true,
            User: { 
              select: { 
                id: true, 
                name: true, 
                username: true, 
                profileImage: true, 
                displayFullName: true, 
                displayNameOption: true,
                stripeConnectAccountId: true
              } 
            }
          }
        },
        Image: { 
          select: { fileUrl: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    }).then(products => {
      // Filter out products with price that were created with test Stripe Connect accounts
      // Inspiration content (without price) always visible
      // Products without Stripe Connect account are also shown (for products created from recipes)
      let filtered = products.filter(product => {
        // If product has no price (inspiration), always show
        if (!product.priceCents || product.priceCents === 0) {
          return true;
        }
        
        // If product has price, check if seller has Stripe Connect account
        const seller = product.seller?.User;
        if (!seller?.stripeConnectAccountId) {
          // Show products without Stripe Connect account (e.g., created from recipes)
          return true;
        }
        
        // Only hide products with price if seller has test Stripe Connect account
        // Live accounts are allowed
        return !isStripeTestId(seller.stripeConnectAccountId);
      });
      
      // Filter by location (pickup location or seller location) if lat/lng and radius are provided
      // IMPORTANT: Products without pickup location are ALWAYS shown (don't filter them out)
      if (lat && lng && radius > 0) {
        const lat0 = Number(lat);
        const lng0 = Number(lng);
        const dLat = radius / 111.32;
        const dLng = radius / (111.32 * Math.cos((lat0 * Math.PI) / 180));
        
        filtered = filtered.filter(product => {
          // If product has no pickup location, ALWAYS show it
          // This ensures products created from recipes/inspiratie without pickup location are always visible
          // Note: pickupLat/pickupLng columns don't exist in database yet, so always show products
          if (!(product as any).pickupLat || !(product as any).pickupLng) {
            return true;
          }
          
          // Product has pickup location - filter by it
          const productLat = (product as any).pickupLat;
          const productLng = (product as any).pickupLng;
          
          // Check if within radius
          const withinLat = productLat >= (lat0 - dLat) && productLat <= (lat0 + dLat);
          const withinLng = productLng >= (lng0 - dLng) && productLng <= (lng0 + dLng);
          
          return withinLat && withinLng;
        });
      }
      
      return filtered;
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
      take: 50,
      include: {
        User: { select: { id: true, name: true, username: true, profileImage: true, displayFullName: true, displayNameOption: true } },
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
      take: 50,
      include: {
        user: { select: { id: true, name: true, username: true, profileImage: true, displayFullName: true, displayNameOption: true } },
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
      profileImage: dish.user.profileImage,
      displayFullName: dish.user.displayFullName,
      displayNameOption: dish.user.displayNameOption
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
      displayFullName: dish.user.displayFullName,
      displayNameOption: dish.user.displayNameOption
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
      displayFullName: listing.User.displayFullName || undefined,
      displayNameOption: listing.User.displayNameOption || undefined
    } : undefined
  }));

  // Transform new products to match listing format
  const transformedProducts = allNewProducts.map(product => ({
    id: product.id,
    ownerId: product.seller?.User?.id || "",
    title: product.title || "",
    description: product.description || "",
    priceCents: product.priceCents || 0,
    category: product.category || "HOMECHEFF",
    status: "ACTIVE" as const,
    place: "Nederland",
      // Use pickup location if available, otherwise fallback to seller location
      // Note: pickupLat/pickupLng columns don't exist in database yet
      lat: (product as any).pickupLat ?? product.seller?.lat ?? null,
      lng: (product as any).pickupLng ?? product.seller?.lng ?? null,
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
      displayFullName: product.seller.User?.displayFullName || undefined,
      displayNameOption: product.seller.User?.displayNameOption || undefined,
      lat: product.seller.lat || null, // Include seller location for distance calculation
      lng: product.seller.lng || null,
      isBusiness: !!(product.seller.kvk && product.seller.companyName),
      companyName: product.seller.companyName || null,
      kvk: product.seller.kvk || null
    } : undefined,
    isBusiness: !!(product.seller?.kvk && product.seller?.companyName)
  }));

  // Combine all items
  const allItems = [...transformedProducts, ...transformedListings, ...transformedDishes];
  
  // Get view counts, review counts, and average ratings for all items
  const allItemIds = allItems.map(item => item.id);
  if (allItemIds.length > 0) {
    const [viewCounts, reviewCounts, avgRatings] = await Promise.all([
      // View counts from analytics
      prisma.analyticsEvent.groupBy({
        by: ['entityId'],
        where: {
          entityId: { in: allItemIds },
          eventType: { in: ['PRODUCT_VIEW', 'VIEW'] },
          entityType: { in: ['PRODUCT', 'DISH'] }
        },
        _count: {
          entityId: true
        }
      }).catch(() => []),
      // Review counts
      prisma.productReview.groupBy({
        by: ['productId'],
        where: {
          productId: { in: allItemIds }
        },
        _count: {
          productId: true
        }
      }).catch(() => []),
      // Average ratings
      prisma.productReview.groupBy({
        by: ['productId'],
        where: {
          productId: { in: allItemIds }
        },
        _avg: {
          rating: true
        }
      }).catch(() => [])
    ]);

    // Create maps
    const viewCountMap = new Map<string, number>();
    (viewCounts as Array<{ entityId: string; _count: { entityId: number } }>).forEach(item => {
      viewCountMap.set(item.entityId, item._count.entityId);
    });

    const reviewCountMap = new Map<string, number>();
    (reviewCounts as Array<{ productId: string; _count: { productId: number } }>).forEach(item => {
      reviewCountMap.set(item.productId, item._count.productId);
    });

    const avgRatingMap = new Map<string, number>();
    (avgRatings as Array<{ productId: string; _avg: { rating: number | null } }>).forEach(item => {
      if (item._avg.rating) {
        avgRatingMap.set(item.productId, Math.round(item._avg.rating * 10) / 10);
      }
    });

    // Add stats to all items
    allItems.forEach(item => {
      (item as any).viewCount = viewCountMap.get(item.id) || 0;
      (item as any).reviewCount = reviewCountMap.get(item.id) || 0;
      (item as any).averageRating = avgRatingMap.get(item.id) || 0;
    });
  }
  
  // Calculate distances if location is available
  if (lat && lng) {
    const userLat = Number(lat);
    const userLng = Number(lng);
    
    allItems.forEach(item => {
      // Only calculate distance for items with real location data (not null)
      if ((item as any).lat !== null && (item as any).lng !== null && 
          !isNaN((item as any).lat) && !isNaN((item as any).lng)) {
        (item as any).distanceKm = Math.round(calculateDistance(
          userLat,
          userLng,
          (item as any).lat,
          (item as any).lng
        ) * 10) / 10;
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
