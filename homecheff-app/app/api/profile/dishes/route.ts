import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user by email first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's dishes
    const dishes = await prisma.dish.findMany({
      where: {
        userId: user.id,
      },
      include: {
        photos: {
          orderBy: { idx: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to match expected format
    const transformedDishes = dishes.map(dish => ({
      id: dish.id,
      title: dish.title,
      description: dish.description,
      status: dish.status,
      createdAt: dish.createdAt.toISOString(),
      priceCents: dish.priceCents,
      deliveryMode: dish.deliveryMode,
      place: dish.place,
      stock: dish.stock,
      maxStock: dish.maxStock,
      photos: dish.photos.map(photo => ({
        id: photo.id,
        url: photo.url,
        idx: photo.idx,
        isMain: photo.isMain
      }))
    }));

    return NextResponse.json({ items: transformedDishes });
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
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user by email first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
      lng,
      stock,
      maxStock
    } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    // Create a new dish instead of listing
    const dish = await prisma.dish.create({
      data: {
        userId: user.id,
        title,
        description,
        status: status || 'PRIVATE',
        priceCents: priceCents || null,
        deliveryMode: deliveryMode || null,
        place: place || null,
        lat: lat || null,
        lng: lng || null,
        stock: stock || 0,
        maxStock: maxStock || null,
      },
    });

    // Handle photos if provided
    if (photos && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        await prisma.dishPhoto.create({
          data: {
            dishId: dish.id,
            url: photo.url,
            idx: i,
            isMain: photo.isMain || false,
          },
        });
      }
    }

    return NextResponse.json({ item: dish });
  } catch (error) {
    console.error("Error creating dish:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}