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
    const dishes = await prisma.listing.findMany({
      where: {
        ownerId: (session.user as any).id,
      },
      include: {
        ListingMedia: true,
      },
      orderBy: { createdAt: 'desc' }
    });

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
    const { title, description, priceCents, category, place, lat, lng } = body;

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
        place: place || null,
        lat: lat || null,
        lng: lng || null,
        status: 'DRAFT',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ dish });
  } catch (error) {
    console.error("Error creating dish:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}