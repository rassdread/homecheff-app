import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.listing.findUnique({
      where: {
        id,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            profileImage: true
          }
        },
        ListingMedia: {
          select: {
            url: true,
            order: true,
          },
          orderBy: { order: 'asc' }
        }
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, priceCents, stock, maxStock, isActive } = body;

    // Check if user owns this product
    const product = await prisma.listing.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    });

    if (!user || product.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update product
    const updatedProduct = await prisma.listing.update({
      where: { id },
      data: {
        title,
        description,
        priceCents,
        status: isActive ? 'ACTIVE' : 'DRAFT'
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            profileImage: true
          }
        },
        ListingMedia: {
          select: {
            url: true,
            order: true,
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}