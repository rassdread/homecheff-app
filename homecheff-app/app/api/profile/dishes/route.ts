import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's dishes (using listings for now)
    const listings = await prisma.listing.findMany({
      where: {
        ownerId: (session.user as any).id,
      },
      include: {
        ListingMedia: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to match expected format
    const dishes = listings.map(listing => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      status: listing.status === 'ACTIVE' ? 'PUBLISHED' : 'PRIVATE',
      createdAt: listing.createdAt.toISOString(),
      priceCents: listing.priceCents,
      deliveryMode: 'PICKUP', // Default value since deliveryMode doesn't exist in listing table
      place: listing.place,
      category: listing.category,
      subcategory: null, // Default value since subcategory doesn't exist in listing table
      photos: listing.ListingMedia.map(media => ({
        id: media.id,
        url: media.url,
        idx: media.order,
        isMain: media.order === 0 // First photo is main photo
      }))
    }));

    return NextResponse.json({ dishes });
  } catch (error) {
    console.error("Error fetching dishes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      title, 
      description, 
      status, 
      photos, 
      category, 
      subcategory, 
      priceCents, 
      deliveryMode, 
      place, 
      lat, 
      lng 
    } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    // Create a new listing
    const dish = await prisma.listing.create({
      data: {
        id: `listing_${Date.now()}`,
        ownerId: (session.user as any).id,
        title,
        description,
        priceCents: priceCents || 0,
        category: category || 'HOMECHEFF',
        subcategory: subcategory || null,
        place: place || null,
        lat: lat || null,
        lng: lng || null,
        status: status === 'PUBLISHED' ? 'ACTIVE' : 'DRAFT',
        updatedAt: new Date(),
      },
    });

    // Handle photos if provided
    if (photos && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        await prisma.listingMedia.create({
          data: {
            id: `media_${Date.now()}_${i}`,
            listingId: dish.id,
            url: photo.url,
            type: 'IMAGE',
            order: i,
            isMain: photo.isMain || i === 0,
          },
        });
      }
    }

    return NextResponse.json({ dish });
  } catch (error) {
    console.error("Error creating dish:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}