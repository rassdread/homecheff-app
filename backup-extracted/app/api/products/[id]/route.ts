import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        reviews: {
          select: {
            id: true,
            dishId: true,
            productId: true,
            buyerId: true,
            rating: true,
            comment: true,
            createdAt: true,
            buyer: {
              select: {
                name: true,
                username: true,
                profileImage: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Fetch dish/inspiration data for all categories (CHEFF, GROWN, DESIGNER)
    let dishData: {
      ingredients: string[];
      instructions: string[];
      prepTime: number | null;
      servings: number | null;
      difficulty: string | null;
      tags: string[];
      materials: string[];
      plantType: string | null;
      plantDate: string | null;
      harvestDate: string | null;
      growthDuration: number | null;
      sunlight: string | null;
      waterNeeds: string | null;
      location: string | null;
      soilType: string | null;
      dimensions: string | null;
      notes: string | null;
      stepPhotos: Array<{
        id: string;
        url: string;
        stepNumber: number;
        description: string | null;
        idx: number;
      }>;
      growthPhotos: Array<{
        id: string;
        url: string;
        phaseNumber: number;
        description: string | null;
        idx: number;
      }>;
    } | null = null;
    
    if (product && (product.category === 'CHEFF' || product.category === 'GROWN' || product.category === 'DESIGNER')) {
      try {
        // Method 1: Try to find dish with same ID (products created from dishes might share ID)
        dishData = await prisma.dish.findUnique({
          where: { id },
          select: {
            ingredients: true,
            instructions: true,
            prepTime: true,
            servings: true,
            difficulty: true,
            tags: true,
            materials: true,
            plantType: true,
            plantDate: true,
            harvestDate: true,
            growthDuration: true,
            sunlight: true,
            waterNeeds: true,
            location: true,
            soilType: true,
            dimensions: true,
            notes: true,
            stepPhotos: {
              select: {
                id: true,
                url: true,
                stepNumber: true,
                description: true,
                idx: true
              },
              orderBy: [{ stepNumber: 'asc' }, { idx: 'asc' }]
            },
            growthPhotos: {
              select: {
                id: true,
                url: true,
                phaseNumber: true,
                description: true,
                idx: true
              },
              orderBy: [{ phaseNumber: 'asc' }, { idx: 'asc' }]
            }
          }
        });

        // Method 2: If not found, try to find dish by title and userId (for products created from inspiratie)
        if (!dishData && product.title && product.seller?.User?.id) {
          const dishes = await prisma.dish.findMany({
            where: {
              userId: product.seller.User.id,
              title: product.title,
              category: product.category,
              status: 'PUBLISHED'
            },
            select: {
              ingredients: true,
              instructions: true,
              prepTime: true,
              servings: true,
              difficulty: true,
              tags: true,
              materials: true,
              plantType: true,
              plantDate: true,
              harvestDate: true,
              growthDuration: true,
              sunlight: true,
              waterNeeds: true,
              location: true,
              soilType: true,
              dimensions: true,
              notes: true,
              stepPhotos: {
                select: {
                  id: true,
                  url: true,
                  stepNumber: true,
                  description: true,
                  idx: true
                },
                orderBy: [{ stepNumber: 'asc' }, { idx: 'asc' }]
              },
              growthPhotos: {
                select: {
                  id: true,
                  url: true,
                  phaseNumber: true,
                  description: true,
                  idx: true
                },
                orderBy: [{ phaseNumber: 'asc' }, { idx: 'asc' }]
              }
            },
            orderBy: { updatedAt: 'desc' },
            take: 1
          });
          
          if (dishes.length > 0) {
            dishData = dishes[0];
          }
        }

        // Method 3: If still not found, try to find any dish by the seller with matching title (fuzzy match)
        if (!dishData && product.title && product.seller?.User?.id) {
          const dishes = await prisma.dish.findMany({
            where: {
              userId: product.seller.User.id,
              category: product.category,
              status: 'PUBLISHED',
              OR: [
                { title: { contains: product.title, mode: 'insensitive' } },
                { title: product.title }
              ]
            },
            select: {
              ingredients: true,
              instructions: true,
              prepTime: true,
              servings: true,
              difficulty: true,
              tags: true,
              materials: true,
              plantType: true,
              plantDate: true,
              harvestDate: true,
              growthDuration: true,
              sunlight: true,
              waterNeeds: true,
              location: true,
              soilType: true,
              dimensions: true,
              notes: true,
              stepPhotos: {
                select: {
                  id: true,
                  url: true,
                  stepNumber: true,
                  description: true,
                  idx: true
                },
                orderBy: [{ stepNumber: 'asc' }, { idx: 'asc' }]
              },
              growthPhotos: {
                select: {
                  id: true,
                  url: true,
                  phaseNumber: true,
                  description: true,
                  idx: true
                },
                orderBy: [{ phaseNumber: 'asc' }, { idx: 'asc' }]
              }
            },
            orderBy: { updatedAt: 'desc' },
            take: 1
          });
          
          if (dishes.length > 0) {
            dishData = dishes[0];
          }
        }

        // Method 4: Try to find dish via ProductReview (reviews can have dishId)
        if (!dishData && product.reviews && product.reviews.length > 0) {
          const reviewWithDishId = product.reviews.find((r: any) => r.dishId);
          if (reviewWithDishId?.dishId) {
            try {
              const dish = await prisma.dish.findUnique({
                where: { id: reviewWithDishId.dishId },
                select: {
                  ingredients: true,
                  instructions: true,
                  prepTime: true,
                  servings: true,
                  difficulty: true,
                  tags: true,
                  materials: true,
                  plantType: true,
                  plantDate: true,
                  harvestDate: true,
                  growthDuration: true,
                  sunlight: true,
                  waterNeeds: true,
                  location: true,
                  soilType: true,
                  dimensions: true,
                  notes: true,
                  stepPhotos: {
                    select: {
                      id: true,
                      url: true,
                      stepNumber: true,
                      description: true,
                      idx: true
                    },
                    orderBy: [{ stepNumber: 'asc' }, { idx: 'asc' }]
                  },
                  growthPhotos: {
                    select: {
                      id: true,
                      url: true,
                      phaseNumber: true,
                      description: true,
                      idx: true
                    },
                    orderBy: [{ phaseNumber: 'asc' }, { idx: 'asc' }]
                  }
                }
              });
              if (dish) {
                dishData = dish;
              }
            } catch (error) {
              // Continue if dish not found
            }
          }
        }

        // Method 5: Try to find most recent dish by seller with matching subcategory (if available)
        if (!dishData && product.seller?.User?.id && product.subcategory) {
          const dishes = await prisma.dish.findMany({
            where: {
              userId: product.seller.User.id,
              category: product.category,
              subcategory: product.subcategory,
              status: 'PUBLISHED'
            },
            select: {
              ingredients: true,
              instructions: true,
              prepTime: true,
              servings: true,
              difficulty: true,
              tags: true,
              materials: true,
              plantType: true,
              plantDate: true,
              harvestDate: true,
              growthDuration: true,
              sunlight: true,
              waterNeeds: true,
              location: true,
              soilType: true,
              dimensions: true,
              notes: true,
              stepPhotos: {
                select: {
                  id: true,
                  url: true,
                  stepNumber: true,
                  description: true,
                  idx: true
                },
                orderBy: [{ stepNumber: 'asc' }, { idx: 'asc' }]
              },
              growthPhotos: {
                select: {
                  id: true,
                  url: true,
                  phaseNumber: true,
                  description: true,
                  idx: true
                },
                orderBy: [{ phaseNumber: 'asc' }, { idx: 'asc' }]
              }
            },
            orderBy: { updatedAt: 'desc' },
            take: 1
          });
          
          if (dishes.length > 0) {
            dishData = dishes[0];
          }
        }

        // Method 6: Try to find most recent dish by seller (final fallback for products from inspiratie)
        if (!dishData && product.seller?.User?.id) {
          const dishes = await prisma.dish.findMany({
            where: {
              userId: product.seller.User.id,
              category: product.category,
              status: 'PUBLISHED',
              OR: [
                { ingredients: { isEmpty: false } },
                { instructions: { isEmpty: false } },
                { materials: { isEmpty: false } },
                { tags: { isEmpty: false } }
              ]
            },
            select: {
              ingredients: true,
              instructions: true,
              prepTime: true,
              servings: true,
              difficulty: true,
              tags: true,
              materials: true,
              plantType: true,
              plantDate: true,
              harvestDate: true,
              growthDuration: true,
              sunlight: true,
              waterNeeds: true,
              location: true,
              soilType: true,
              dimensions: true,
              notes: true,
              stepPhotos: {
                select: {
                  id: true,
                  url: true,
                  stepNumber: true,
                  description: true,
                  idx: true
                },
                orderBy: [{ stepNumber: 'asc' }, { idx: 'asc' }]
              },
              growthPhotos: {
                select: {
                  id: true,
                  url: true,
                  phaseNumber: true,
                  description: true,
                  idx: true
                },
                orderBy: [{ phaseNumber: 'asc' }, { idx: 'asc' }]
              }
            },
            orderBy: { updatedAt: 'desc' },
            take: 1
          });
          
          if (dishes.length > 0) {
            dishData = dishes[0];
          }
        }
      } catch (error) {
        // If dish not found, continue without dish data
        console.log('No dish data found for product:', id, error);
      }
    }

    // Get analytics statistics
    const [viewCount, orderCount, favoriteCount] = await Promise.all([
      // Count unique views from AnalyticsEvent
      prisma.analyticsEvent.count({
        where: {
          entityId: id,
          eventType: 'PRODUCT_VIEW'
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

    // If still no product found, check if it's a Dish (inspiration item)
    // If so, return a special response indicating it should redirect to inspiration page
    if (!product) {
      const dish = await prisma.dish.findUnique({
        where: { id },
        select: { id: true, status: true }
      });

      if (dish) {
        // It's a dish/inspiration, not a product - return special response
        return NextResponse.json({ 
          error: 'Product not found',
          isInspiration: true,
          inspirationId: id
        }, { status: 404 });
      }

      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
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

    // Merge dish data into product if available
    const productWithDish = dishData ? {
      ...product,
      ingredients: dishData.ingredients || [],
      instructions: dishData.instructions || [],
      prepTime: dishData.prepTime,
      servings: dishData.servings,
      difficulty: dishData.difficulty,
      tags: dishData.tags || [],
      materials: dishData.materials || [],
      plantType: dishData.plantType,
      plantDate: dishData.plantDate,
      harvestDate: dishData.harvestDate,
      growthDuration: dishData.growthDuration,
      sunlight: dishData.sunlight,
      waterNeeds: dishData.waterNeeds,
      location: dishData.location,
      soilType: dishData.soilType,
      dimensions: dishData.dimensions,
      notes: dishData.notes,
      stepPhotos: dishData.stepPhotos || [],
      growthPhotos: dishData.growthPhotos || []
    } : {
      ...product,
      ingredients: product.ingredients || [],
      instructions: product.instructions || [],
      tags: product.tags || [],
      materials: product.materials || [],
      stepPhotos: product.stepPhotos || [],
      growthPhotos: product.growthPhotos || []
    };

    // Debug logging
    console.log('Product API Response:', {
      productId: id,
      category: product?.category,
      hasDishData: !!dishData,
      hasStepPhotos: !!dishData?.stepPhotos?.length,
      hasGrowthPhotos: !!dishData?.growthPhotos?.length,
      hasTags: !!dishData?.tags?.length,
      hasMaterials: !!dishData?.materials?.length,
      stepPhotosCount: dishData?.stepPhotos?.length || 0,
      growthPhotosCount: dishData?.growthPhotos?.length || 0,
      tagsCount: dishData?.tags?.length || 0,
      materialsCount: dishData?.materials?.length || 0
    });

    return NextResponse.json({ 
      product: productWithDish,
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
        if (user.role !== 'ADMIN') {
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
          const updatedProduct = await prisma.product.update({
            where: { id: id },
            data: {
              title: body.title,
              description: body.description,
              priceCents: body.priceCents,
              category: body.category,
              isActive: body.isActive,
              unit: body.unit,
              delivery: body.delivery,
              maxStock: body.maxStock,
              stock: body.stock,
              displayNameType: body.displayNameType
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
        if (user.role !== 'ADMIN') {
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
          const updatedProduct = await prisma.product.update({
            where: { id: id },
            data: {
              title: body.title,
              description: body.description,
              priceCents: body.priceCents,
              category: body.category,
              isActive: body.isActive,
              unit: body.unit,
              delivery: body.delivery,
              maxStock: body.maxStock,
              stock: body.stock,
              displayNameType: body.displayNameType
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