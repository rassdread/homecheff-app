import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Try new Product model first
    let product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
                image: true,
                place: true,
                lat: true,
                lng: true,
                displayFullName: true,
                displayNameOption: true
              }
            }
          }
        },
        Image: {
          select: { id: true, fileUrl: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' }
        },
        Video: {
          select: { id: true, url: true, thumbnail: true, duration: true, createdAt: true }
        },
        reviews: {
          where: {
            reviewSubmittedAt: { not: null }, // Only submitted reviews
            rating: { gt: 0 } // Only reviews with rating > 0
          },
          include: {
            buyer: {
              select: {
                name: true,
                username: true,
                profileImage: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 2 // Only show 2 recent reviews on product page
        }
      }
    });

    // Get analytics statistics
    const [viewCount, orderCount, favoriteCount] = await Promise.all([
      // Count unique views from AnalyticsEvent (support both VIEW and PRODUCT_VIEW for compatibility)
      prisma.analyticsEvent.count({
        where: {
          entityId: id,
          eventType: { in: ['VIEW', 'PRODUCT_VIEW'] },
          entityType: 'PRODUCT'
        }
      }),
      // Count completed orders for this product
      prisma.orderItem.count({
        where: {
          productId: id,
          Order: {
            status: {
              in: ['PROCESSING', 'SHIPPED', 'DELIVERED']
            }
          }
        }
      }),
      // Count favorites
      prisma.favorite.count({
        where: { productId: id }
      })
    ]);

    // If not found in new model, try old Listing model
    if (!product) {
      const listing = await prisma.listing.findUnique({
        where: { id },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
              image: true,
              place: true,
              lat: true,
              lng: true,
              displayFullName: true,
              displayNameOption: true
            }
          },
          ListingMedia: {
            select: { url: true, order: true },
            orderBy: { order: 'asc' }
          }
        }
      });

      if (listing) {
        // Transform old listing to new product format
        product = {
          id: listing.id,
          title: listing.title,
          description: listing.description || '',
          priceCents: listing.priceCents,
          category: (listing as any).category || 'CHEFF',
          isActive: listing.status === 'ACTIVE',
          createdAt: listing.createdAt,
          seller: {
            User: listing.User
          } as any,
          Image: listing.ListingMedia.map(media => ({
            fileUrl: media.url,
            sortOrder: media.order
          })),
          reviews: []
        } as any;
      }
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if product is linked to a dish (for print/download functionality and showing steps)
    const dish = await prisma.dish.findUnique({
      where: { id },
      include: {
        stepPhotos: {
          select: {
            id: true,
            url: true,
            stepNumber: true,
            description: true,
            idx: true
          },
          orderBy: [
            { stepNumber: 'asc' },
            { idx: 'asc' }
          ]
        },
        growthPhotos: {
          select: {
            id: true,
            url: true,
            phaseNumber: true,
            description: true,
            idx: true
          },
          orderBy: [
            { phaseNumber: 'asc' },
            { idx: 'asc' }
          ]
        },
        videos: {
          select: {
            id: true,
            url: true,
            thumbnail: true,
            duration: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Check if it's a dish based on category-specific fields (for print/download buttons)
    let isDish = false;
    let dishCategory: string | null = null;
    if (dish) {
      const isRecipe = dish.category === 'CHEFF' && 
                      (dish.ingredients.length > 0 || dish.instructions.length > 0);
      const isGarden = dish.category === 'GROWN' && 
                      (dish.plantType || (dish.growthPhotos && dish.growthPhotos.length > 0));
      const isDesign = dish.category === 'DESIGNER' && 
                      (dish.materials && dish.materials.length > 0);
      
      if (isRecipe || isGarden || isDesign) {
        isDish = true;
        dishCategory = dish.category || null;
      }
    }

    // Calculate average rating from reviews
    const reviewStats = product.reviews?.length > 0 
      ? {
          averageRating: product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length,
          reviewCount: product.reviews.length
        }
      : {
          averageRating: 0,
          reviewCount: 0
        };

    // Sort Video array by createdAt if it exists
    const sortedVideo = product.Video && Array.isArray(product.Video) && product.Video.length > 0
      ? [...product.Video].sort((a: any, b: any) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate; // Descending order
        })
      : product.Video;

    return NextResponse.json({ 
      product: {
        ...product,
        Video: sortedVideo
      },
      isDish: isDish || false,
      dishCategory: dishCategory || null,
      dish: dish ? {
        ingredients: dish.ingredients || [],
        instructions: dish.instructions || [],
        stepPhotos: dish.stepPhotos || [],
        growthPhotos: dish.growthPhotos || [],
        materials: dish.materials || [],
        plantType: dish.plantType,
        notes: dish.notes,
        video: dish.videos?.[0] || null
      } : null,
      stats: {
        viewCount,
        orderCount,
        favoriteCount,
        ...reviewStats
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
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

        // Check permissions: Admin can update any product, seller can only update their own
        if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
          if (isNewModel) {
            // New Product model
            const sellerProfile = await prisma.sellerProfile.findUnique({
              where: { userId: user.id },
              select: { id: true }
            });

            if (!sellerProfile || (product as any).sellerId !== sellerProfile.id) {
              return NextResponse.json({ error: "You don't have permission to update this product" }, { status: 403 });
            }
          } else {
            // Old Listing model
            if ((product as any).ownerId !== user.id) {
              return NextResponse.json({ error: "You don't have permission to update this product" }, { status: 403 });
            }
          }
        }

        // Update product in appropriate model
        if (isNewModel) {
          // Handle image updates if provided
          const updateData: any = {
            title: body.title,
            description: body.description,
            priceCents: body.priceCents,
            category: body.category,
            isActive: body.isActive !== undefined ? body.isActive : true,
            unit: body.unit || 'PORTION',
            delivery: body.delivery,
            maxStock: body.maxStock !== undefined ? body.maxStock : null,
            stock: body.stock !== undefined ? body.stock : 0,
            displayNameType: body.displayNameType,
            isFutureProduct: body.isFutureProduct !== undefined ? body.isFutureProduct : false,
            availabilityDate: body.availabilityDate ? new Date(body.availabilityDate) : null,
            // Pickup location fields
            pickupAddress: body.pickupAddress !== undefined ? body.pickupAddress : null,
            pickupLat: body.pickupLat !== undefined && body.pickupLat !== null ? Number(body.pickupLat) : null,
            pickupLng: body.pickupLng !== undefined && body.pickupLng !== null ? Number(body.pickupLng) : null,
            // Seller delivery fields
            sellerCanDeliver: body.sellerCanDeliver !== undefined ? Boolean(body.sellerCanDeliver) : undefined,
            deliveryRadiusKm: body.deliveryRadiusKm !== undefined && body.deliveryRadiusKm !== null ? Number(body.deliveryRadiusKm) : null,
          };

          // Update images if provided
          if (body.images && Array.isArray(body.images)) {
            // Delete existing images and create new ones
            await prisma.image.deleteMany({
              where: { productId: id }
            });
            
            updateData.Image = {
              create: body.images.map((url: string, i: number) => ({
                id: randomUUID(),
                fileUrl: url,
                sortOrder: i,
              })),
            };
          }

          // Handle video update if provided
          if (body.video !== undefined) {
            // Delete existing video if any
            await prisma.productVideo.deleteMany({
              where: { productId: id }
            });
            
            // Create new video if provided
            if (body.video && body.video.url) {
              updateData.Video = {
                create: {
                  id: randomUUID(),
                  url: body.video.url,
                  thumbnail: body.video.thumbnail || null,
                  duration: body.video.duration ? Math.round(body.video.duration) : null,
                  fileSize: null
                }
              };
            }
          }

          const updatedProduct = await prisma.product.update({
            where: { id: id },
            data: updateData,
            include: {
              Image: true,
              Video: true
            }
          });
          return NextResponse.json({ product: updatedProduct });
        } else {
          const updatedListing = await prisma.listing.update({
            where: { id: id },
            data: {
              title: body.title,
              description: body.description,
              priceCents: body.priceCents,
              category: body.category,
              status: body.isActive ? 'ACTIVE' : 'PAUSED'
            }
          });
          return NextResponse.json({ product: updatedListing });
        }
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

        // Check permissions: Admin can update any product, seller can only update their own
        if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
          if (isNewModel) {
            // New Product model
            const sellerProfile = await prisma.sellerProfile.findUnique({
              where: { userId: user.id },
              select: { id: true }
            });

            if (!sellerProfile || (product as any).sellerId !== sellerProfile.id) {
              return NextResponse.json({ error: "You don't have permission to update this product" }, { status: 403 });
            }
          } else {
            // Old Listing model
            if ((product as any).ownerId !== user.id) {
              return NextResponse.json({ error: "You don't have permission to update this product" }, { status: 403 });
            }
          }
        }

        // Update product in appropriate model
        if (isNewModel) {
          // Handle image updates if provided
          const updateData: any = {
            title: body.title,
            description: body.description,
            priceCents: body.priceCents,
            category: body.category,
            isActive: body.isActive !== undefined ? body.isActive : true,
            unit: body.unit || 'PORTION',
            delivery: body.delivery,
            maxStock: body.maxStock !== undefined ? body.maxStock : null,
            stock: body.stock !== undefined ? body.stock : 0,
            displayNameType: body.displayNameType,
            isFutureProduct: body.isFutureProduct !== undefined ? body.isFutureProduct : false,
            availabilityDate: body.availabilityDate ? new Date(body.availabilityDate) : null,
            // Pickup location fields
            pickupAddress: body.pickupAddress !== undefined ? body.pickupAddress : null,
            pickupLat: body.pickupLat !== undefined && body.pickupLat !== null ? Number(body.pickupLat) : null,
            pickupLng: body.pickupLng !== undefined && body.pickupLng !== null ? Number(body.pickupLng) : null,
            // Seller delivery fields
            sellerCanDeliver: body.sellerCanDeliver !== undefined ? Boolean(body.sellerCanDeliver) : undefined,
            deliveryRadiusKm: body.deliveryRadiusKm !== undefined && body.deliveryRadiusKm !== null ? Number(body.deliveryRadiusKm) : null,
          };

          // Update images if provided
          if (body.images && Array.isArray(body.images)) {
            // Delete existing images and create new ones
            await prisma.image.deleteMany({
              where: { productId: id }
            });
            
            updateData.Image = {
              create: body.images.map((url: string, i: number) => ({
                id: randomUUID(),
                fileUrl: url,
                sortOrder: i,
              })),
            };
          }

          // Handle video update if provided
          if (body.video !== undefined) {
            // Delete existing video if any
            await prisma.productVideo.deleteMany({
              where: { productId: id }
            });
            
            // Create new video if provided
            if (body.video && body.video.url) {
              updateData.Video = {
                create: {
                  id: randomUUID(),
                  url: body.video.url,
                  thumbnail: body.video.thumbnail || null,
                  duration: body.video.duration ? Math.round(body.video.duration) : null,
                  fileSize: null
                }
              };
            }
          }

          const updatedProduct = await prisma.product.update({
            where: { id: id },
            data: updateData,
            include: {
              Image: true,
              Video: true
            }
          });
          return NextResponse.json({ product: updatedProduct });
        } else {
          const updatedListing = await prisma.listing.update({
            where: { id: id },
            data: {
              title: body.title,
              description: body.description,
              priceCents: body.priceCents,
              category: body.category,
              status: body.isActive ? 'ACTIVE' : 'PAUSED'
            }
          });
          return NextResponse.json({ product: updatedListing });
        }
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
        if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
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
            if ((product as any).ownerId !== user.id) {
              return NextResponse.json({ error: "You don't have permission to delete this product" }, { status: 403 });
            }
          }
        }

        // Delete product from appropriate model with proper cascade handling
        if (isNewModel) {
          // Delete from new Product model with cascade
          await prisma.$transaction(async (tx) => {
            // Delete related records first
            await tx.deliveryOrder.deleteMany({
              where: { productId: id }
            });
            
            await tx.orderItem.deleteMany({
              where: { productId: id }
            });
            
            await tx.productReview.deleteMany({
              where: { productId: id }
            });
            
            await tx.favorite.deleteMany({
              where: { productId: id }
            });
            
            await tx.conversation.deleteMany({
              where: { productId: id }
            });
            
            await tx.image.deleteMany({
              where: { productId: id }
            });
            
            await tx.productVideo.deleteMany({
              where: { productId: id }
            });
            
            // Finally delete the product
            await tx.product.delete({
              where: { id: id }
            });
          });
        } else {
          // Delete from old Listing model with cascade
          await prisma.$transaction(async (tx) => {
            // Delete related records first
            await tx.listingMedia.deleteMany({
              where: { listingId: id }
            });
            
            await tx.favorite.deleteMany({
              where: { listingId: id }
            });
            
            // Conversation only has productId, not listingId for old listings
            // We need to find conversations that reference this listing through a different mechanism
            // For now, we'll skip this deletion as it's not directly linked
            
            // Finally delete the listing
            await tx.listing.delete({
              where: { id: id }
            });
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
        if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
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
            if ((product as any).ownerId !== user.id) {
              return NextResponse.json({ error: "You don't have permission to delete this product" }, { status: 403 });
            }
          }
        }

        // Delete product from appropriate model with proper cascade handling
        if (isNewModel) {
          // Delete from new Product model with cascade
          await prisma.$transaction(async (tx) => {
            // Delete related records first
            await tx.deliveryOrder.deleteMany({
              where: { productId: id }
            });
            
            await tx.orderItem.deleteMany({
              where: { productId: id }
            });
            
            await tx.productReview.deleteMany({
              where: { productId: id }
            });
            
            await tx.favorite.deleteMany({
              where: { productId: id }
            });
            
            await tx.conversation.deleteMany({
              where: { productId: id }
            });
            
            await tx.image.deleteMany({
              where: { productId: id }
            });
            
            await tx.productVideo.deleteMany({
              where: { productId: id }
            });
            
            // Finally delete the product
            await tx.product.delete({
              where: { id: id }
            });
          });
        } else {
          // Delete from old Listing model with cascade
          await prisma.$transaction(async (tx) => {
            // Delete related records first
            await tx.listingMedia.deleteMany({
              where: { listingId: id }
            });
            
            await tx.favorite.deleteMany({
              where: { listingId: id }
            });
            
            // Conversation only has productId, not listingId for old listings
            // We need to find conversations that reference this listing through a different mechanism
            // For now, we'll skip this deletion as it's not directly linked
            
            // Finally delete the listing
            await tx.listing.delete({
              where: { id: id }
            });
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