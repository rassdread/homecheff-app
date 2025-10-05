import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to find as a dish first
    const dish = await prisma.dish.findUnique({
      where: { id },
      include: {
        photos: {
          orderBy: { idx: 'asc' }
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            profileImage: true
          }
        }
      }
    });

    if (dish) {
      return NextResponse.json({
        id: dish.id,
        title: dish.title,
        description: dish.description,
        priceCents: dish.priceCents,
        stock: dish.stock,
        maxStock: dish.maxStock,
        deliveryMode: dish.deliveryMode,
        place: dish.place,
        lat: dish.lat,
        lng: dish.lng,
        status: dish.status,
        category: 'CHEFF', // Default for dishes
        subcategory: null,
        createdAt: dish.createdAt,
        updatedAt: dish.updatedAt,
        photos: dish.photos.map(photo => ({
          id: photo.id,
          url: photo.url,
          idx: photo.idx
        })),
        User: {
          id: dish.user.id,
          name: dish.user.name,
          username: dish.user.username,
          image: dish.user.image || dish.user.profileImage
        }
      });
    }

    // Try to find as a product
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        Image: {
          orderBy: { sortOrder: 'asc' }
        },
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
        }
      }
    });

    if (product) {
      return NextResponse.json({
        id: product.id,
        title: product.title,
        description: product.description,
        priceCents: product.priceCents,
        stock: product.stock,
        maxStock: product.maxStock,
        delivery: product.delivery,
        unit: product.unit,
        category: product.category,
        isActive: product.isActive,
        displayNameType: product.displayNameType,
        createdAt: product.createdAt,
        photos: product.Image.map(img => ({
          id: img.id,
          url: img.fileUrl,
          idx: img.sortOrder
        })),
        User: {
          id: product.seller.User.id,
          name: product.seller.User.name,
          username: product.seller.User.username,
          image: product.seller.User.image || product.seller.User.profileImage
        }
      });
    }

    // Try to find as a listing (legacy)
    const listing = await prisma.listing.findUnique({
      where: { id },
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
          orderBy: { order: 'asc' }
        }
      }
    });

    if (listing) {
      return NextResponse.json({
        id: listing.id,
        title: listing.title,
        description: listing.description,
        priceCents: listing.priceCents,
        category: listing.category,
        place: listing.place,
        lat: listing.lat,
        lng: listing.lng,
        status: listing.status,
        createdAt: listing.createdAt,
        photos: listing.ListingMedia.map(media => ({
          id: media.id,
          url: media.url,
          idx: media.order
        })),
        User: {
          id: listing.User?.id,
          name: listing.User?.name,
          username: listing.User?.username,
          image: listing.User?.image || listing.User?.profileImage
        }
      });
    }

    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { 
      title, 
      description, 
      priceCents, 
      stock, 
      maxStock, 
      isActive,
      category,
      delivery,
      unit
    } = await request.json();

    // NextAuth v5
    try {
      const mod: any = await import("@/lib/auth");
      const session = await mod.auth?.();
      const email: string | undefined = session?.user?.email || undefined;
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true }
        });

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get seller profile
        const sellerProfile = await prisma.sellerProfile.findUnique({
          where: { userId: user.id },
          select: { id: true }
        });

        if (!sellerProfile) {
          return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
        }

        // Check if product belongs to this seller
        const product = await prisma.product.findFirst({
          where: { 
            id: id,
            sellerId: sellerProfile.id
          }
        });

        if (!product) {
          return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Update product
        const updatedProduct = await prisma.product.update({
          where: { id: id },
          data: {
            priceCents,
            stock,
            maxStock,
            isActive
          }
        });

        return NextResponse.json({ product: updatedProduct });
      }
    } catch {}

    // NextAuth v4
    try {
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/lib/auth");
      const session = await getServerSession(authOptions as any);
      const email: string | undefined = (session as any)?.user?.email;
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true }
        });

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get seller profile
        const sellerProfile = await prisma.sellerProfile.findUnique({
          where: { userId: user.id },
          select: { id: true }
        });

        if (!sellerProfile) {
          return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
        }

        // Check if product belongs to this seller
        const product = await prisma.product.findFirst({
          where: { 
            id: id,
            sellerId: sellerProfile.id
          }
        });

        if (!product) {
          return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Update product
        const updatedProduct = await prisma.product.update({
          where: { id: id },
          data: {
            priceCents,
            stock,
            maxStock,
            isActive
          }
        });

        return NextResponse.json({ product: updatedProduct });
      }
    } catch {}

    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // NextAuth v5
    try {
      const mod: any = await import("@/lib/auth");
      const session = await mod.auth?.();
      const email: string | undefined = session?.user?.email || undefined;
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true }
        });

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if product exists in new Product model
        let product: any = await prisma.product.findUnique({
          where: { id: id },
          include: {
            seller: {
              include: {
                User: { select: { id: true } }
              }
            }
          }
        });

        let isNewModel = true;

        // If not found in new model, check old Listing model
        if (!product) {
          product = await prisma.listing.findUnique({
            where: { id: id },
            include: {
              User: { select: { id: true } }
            }
          });
          isNewModel = false;
        }

        if (!product) {
          return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Check permissions: Admin can delete any product, seller can only delete their own
        if (user.role !== 'ADMIN') {
          if (isNewModel) {
            // New Product model
            const sellerProfile = await prisma.sellerProfile.findUnique({
              where: { userId: user.id },
              select: { id: true }
            });

            if (!sellerProfile || (product as any).sellerId !== sellerProfile.id) {
              return NextResponse.json({ error: "You don't have permission to delete this product" }, { status: 403 });
            }
          } else {
            // Old Listing model
            if ((product as any).userId !== user.id) {
              return NextResponse.json({ error: "You don't have permission to delete this product" }, { status: 403 });
            }
          }
        }

        // Delete product from appropriate model
        if (isNewModel) {
          await prisma.product.delete({
            where: { id: id }
          });
        } else {
          await prisma.listing.delete({
            where: { id: id }
          });
        }

        return NextResponse.json({ success: true });
      }
    } catch {}

    // NextAuth v4
    try {
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/lib/auth");
      const session = await getServerSession(authOptions as any);
      const email: string | undefined = (session as any)?.user?.email;
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true }
        });

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if product exists in new Product model
        let product: any = await prisma.product.findUnique({
          where: { id: id },
          include: {
            seller: {
              include: {
                User: { select: { id: true } }
              }
            }
          }
        });

        let isNewModel = true;

        // If not found in new model, check old Listing model
        if (!product) {
          product = await prisma.listing.findUnique({
            where: { id: id },
            include: {
              User: { select: { id: true } }
            }
          });
          isNewModel = false;
        }

        if (!product) {
          return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Check permissions: Admin can delete any product, seller can only delete their own
        if (user.role !== 'ADMIN') {
          if (isNewModel) {
            // New Product model
            const sellerProfile = await prisma.sellerProfile.findUnique({
              where: { userId: user.id },
              select: { id: true }
            });

            if (!sellerProfile || (product as any).sellerId !== sellerProfile.id) {
              return NextResponse.json({ error: "You don't have permission to delete this product" }, { status: 403 });
            }
          } else {
            // Old Listing model
            if ((product as any).userId !== user.id) {
              return NextResponse.json({ error: "You don't have permission to delete this product" }, { status: 403 });
            }
          }
        }

        // Delete product from appropriate model
        if (isNewModel) {
          await prisma.product.delete({
            where: { id: id }
          });
        } else {
          await prisma.listing.delete({
            where: { id: id }
          });
        }

        return NextResponse.json({ success: true });
      }
    } catch {}

    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}