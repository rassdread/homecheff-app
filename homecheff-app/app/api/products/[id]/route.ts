import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        seller: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                profileImage: true
              }
            }
          }
        },
        Image: {
          select: {
            fileUrl: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' }
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
    const product = await prisma.product.findUnique({
      where: { id },
      select: { sellerId: true }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get seller profile for current user
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: (session.user as any).id },
      select: { id: true }
    });

    if (!sellerProfile || product.sellerId !== sellerProfile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title,
        description,
        priceCents,
        stock,
        maxStock,
        isActive
      },
      include: {
        seller: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                profileImage: true
              }
            }
          }
        },
        Image: {
          select: {
            fileUrl: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' }
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