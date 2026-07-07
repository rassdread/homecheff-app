import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { resolveProductIdFromParam } from '@/lib/seo/productSlug';
import { awardProductLifecycleHcp } from '@/lib/gamification/product-hcp';
import { loadPublicContactChannelsForUser } from '@/lib/profile/load-public-contact-channels';
import { parseProductOrderMethod } from '@/lib/product/order-method';
import {
  computePublishGateFromProductUpdate,
  requiresStripeForHomecheffCheckout,
  resolveProductPublishState,
} from '@/lib/product/order-method';
import { buildPublicPaymentStatus } from '@/lib/stripe/seller-payment-status';
import { refreshSellerStripeSnapshotIfStale } from '@/lib/stripe/sync-seller-payment-status';
import {
  saleProductRequiresLocation,
  validateProductLocationForPublish,
} from '@/lib/geo/product-location-requirements';
import { syncSellerProfileCoordsIfEmpty } from '@/lib/seller/sync-seller-profile-coords';
import { buildMarketplaceV2PatchFields } from '@/lib/marketplace/patch-v2-fields';
import { auth } from '@/lib/auth';
import {
  getInspiratieDetailHref,
  type InspirationCategory,
} from '@/lib/inspiratie/instruction-content';
import { fetchAuthorBadgeSummariesByUserIds } from '@/lib/gamification/author-badge-summaries';
import { fetchSellerTrustBundles } from '@/lib/discovery/trust/batch-enrichment';
import { buildDiscoveryTrust } from '@/lib/discovery/trust/build-discovery-trust';
import type { MarketplaceCategory } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const raw = (await params).id;
    const id = resolveProductIdFromParam(raw);
    
    // Try new Product model first
    let product = await prisma.product.findUnique({
      where: { id },
      include: {
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
                image: true,
                place: true,
                city: true,
                lat: true,
                lng: true,
                displayFullName: true,
                displayNameOption: true,
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
      }
    });

    // Get analytics statistics
    const [viewCount, orderCount, favoriteCount, reviewAgg] = await Promise.all([
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
      }),
      prisma.productReview.aggregate({
        where: {
          productId: id,
          reviewSubmittedAt: { not: null },
          rating: { gt: 0 },
        },
        _count: { _all: true },
        _avg: { rating: true },
      }),
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
                      ((dish.materials && dish.materials.length > 0) ||
                       dish.dimensions ||
                       dish.notes ||
                       (dish.instructions && dish.instructions.length > 0));
      
      if (isRecipe || isGarden || isDesign) {
        isDish = true;
        dishCategory = dish.category || null;
      }
    }

    const reviewStats = {
      averageRating: reviewAgg._avg.rating ?? 0,
      reviewCount: reviewAgg._count._all ?? 0,
    };

    // Sort Video array by createdAt if it exists
    const sortedVideo = product.Video && Array.isArray(product.Video) && product.Video.length > 0
      ? [...product.Video].sort((a: any, b: any) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate; // Descending order
        })
      : product.Video;

    const sellerUserId =
      product.seller?.User?.id ?? (product as { User?: { id?: string } }).User?.id;
    const publicContactChannels = await loadPublicContactChannelsForUser(sellerUserId);

    const sellerBadgesMap = sellerUserId
      ? await fetchAuthorBadgeSummariesByUserIds([sellerUserId], 2)
      : new Map();
    const sellerBadges = sellerUserId ? sellerBadgesMap.get(sellerUserId) ?? [] : [];
    const isBusiness = Boolean(
      product.seller?.kvk && product.seller?.companyName,
    );

    let sellerStripe = sellerUserId
      ? await prisma.user.findUnique({
          where: { id: sellerUserId },
          select: {
            stripeConnectAccountId: true,
            stripeConnectOnboardingCompleted: true,
          },
        })
      : null;

    if (sellerUserId && sellerStripe?.stripeConnectAccountId) {
      sellerStripe = await refreshSellerStripeSnapshotIfStale(
        sellerUserId,
        sellerStripe,
      );
    }

    const productCheckoutShape = {
      orderMethod: (product as { orderMethod?: string }).orderMethod,
      priceCents: product.priceCents,
    };
    const requiresStripeCheckout =
      requiresStripeForHomecheffCheckout(productCheckoutShape);

    const paymentStatus = buildPublicPaymentStatus({
      requiresStripeCheckout,
      seller: sellerStripe,
    });
    const checkoutAvailable = requiresStripeCheckout
      ? paymentStatus.canCheckout
      : false;
    const checkoutBlockedReason = paymentStatus.reason;

    const trustBundles = sellerUserId
      ? await fetchSellerTrustBundles([sellerUserId])
      : new Map();
    const trustBundle = sellerUserId ? trustBundles.get(sellerUserId) : undefined;
    const discoveryTrust = buildDiscoveryTrust({
      listingProductReviewCount: reviewStats.reviewCount,
      listingIsActive: Boolean((product as { isActive?: boolean }).isActive ?? true),
      sellerSnapshot: trustBundle?.snapshot,
      trustBadges: trustBundle?.trustBadges,
    });

    let linkedInspiration: {
      href: string;
      category: InspirationCategory;
      status: string;
      isOwner: boolean;
    } | null = null;

    if (isDish && dish && dishCategory) {
      const session = await auth();
      let viewerId: string | null = null;
      if (session?.user?.email) {
        const viewer = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        });
        viewerId = viewer?.id ?? null;
      }
      const isOwner = Boolean(viewerId && sellerUserId && viewerId === sellerUserId);
      const canViewLinked = dish.status === 'PUBLISHED' || isOwner;
      if (canViewLinked) {
        linkedInspiration = {
          href: getInspiratieDetailHref(dishCategory as InspirationCategory, id),
          category: dishCategory as InspirationCategory,
          status: dish.status,
          isOwner,
        };
      }
    }

    return NextResponse.json({
      product: {
        ...product,
        Video: sortedVideo
      },
      publicContactChannels,
      checkoutAvailable,
      checkoutBlockedReason,
      paymentStatus,
      sellerBadges,
      isBusiness,
      companyName: product.seller?.companyName ?? null,
      isDish: isDish || false,
      dishCategory: dishCategory || null,
      linkedInspiration,
      dish: dish ? {
        ingredients: dish.ingredients || [],
        instructions: dish.instructions || [],
        stepPhotos: dish.stepPhotos || [],
        growthPhotos: dish.growthPhotos || [],
        materials: dish.materials || [],
        plantType: dish.plantType,
        prepTime: dish.prepTime,
        servings: dish.servings,
        difficulty: dish.difficulty,
        tags: dish.tags || [],
        subcategory: dish.subcategory,
        sunlight: dish.sunlight,
        waterNeeds: dish.waterNeeds,
        harvestDate: dish.harvestDate,
        location: dish.location,
        soilType: dish.soilType,
        growthDuration: dish.growthDuration,
        dimensions: dish.dimensions,
        notes: dish.notes,
        video: dish.videos?.[0] || null
      } : null,
      stats: {
        viewCount,
        orderCount,
        favoriteCount,
        ...reviewStats
      },
      discoveryTrust,
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
    const raw = (await params).id;
    const id = resolveProductIdFromParam(raw);
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

        const sellerUserForPublish = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            stripeConnectAccountId: true,
            stripeConnectOnboardingCompleted: true,
          },
        });

        const publishState = computePublishGateFromProductUpdate(
          body,
          product,
          sellerUserForPublish,
        );

        if (publishState.isActive && isNewModel) {
          const orderMethod =
            body.orderMethod !== undefined
              ? parseProductOrderMethod(body.orderMethod)
              : (product as { orderMethod?: string }).orderMethod;
          const priceCents =
            body.priceCents ?? (product as { priceCents?: number }).priceCents;
          if (saleProductRequiresLocation(orderMethod, priceCents)) {
            const sellerProfile = await prisma.sellerProfile.findUnique({
              where: { id: (product as { sellerId: string }).sellerId },
              include: {
                User: {
                  select: { place: true, city: true, lat: true, lng: true },
                },
              },
            });
            const locCheck = validateProductLocationForPublish({
              pickupAddress:
                body.pickupAddress !== undefined
                  ? body.pickupAddress
                  : (product as { pickupAddress?: string | null }).pickupAddress,
              pickupLat:
                body.pickupLat !== undefined
                  ? body.pickupLat != null
                    ? Number(body.pickupLat)
                    : null
                  : (product as { pickupLat?: number | null }).pickupLat,
              pickupLng:
                body.pickupLng !== undefined
                  ? body.pickupLng != null
                    ? Number(body.pickupLng)
                    : null
                  : (product as { pickupLng?: number | null }).pickupLng,
              seller: sellerProfile,
            });
            if (!locCheck.ok) {
              return NextResponse.json(
                { error: locCheck.message, code: locCheck.errorCode },
                { status: 400 }
              );
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
            isActive: publishState.isActive,
            unit: body.unit || 'PORTION',
            delivery: body.delivery,
            maxStock: body.maxStock !== undefined ? body.maxStock : null,
            stock: body.stock !== undefined ? body.stock : 0,
            displayNameType: body.displayNameType,
            isFutureProduct: body.isFutureProduct !== undefined ? body.isFutureProduct : false,
            availabilityDate: body.availabilityDate ? new Date(body.availabilityDate) : null,
            subcategory: body.subcategory !== undefined ? body.subcategory : undefined,
            tags: Array.isArray(body.tags)
              ? body.tags.filter((tag: string) => tag && tag.trim().length > 0)
              : undefined,
            // Pickup location fields
            pickupAddress: body.pickupAddress !== undefined ? body.pickupAddress : null,
            pickupLat: body.pickupLat !== undefined && body.pickupLat !== null ? Number(body.pickupLat) : null,
            pickupLng: body.pickupLng !== undefined && body.pickupLng !== null ? Number(body.pickupLng) : null,
            // Seller delivery fields
            sellerCanDeliver: body.sellerCanDeliver !== undefined ? Boolean(body.sellerCanDeliver) : undefined,
            deliveryRadiusKm: body.deliveryRadiusKm !== undefined && body.deliveryRadiusKm !== null ? Number(body.deliveryRadiusKm) : null,
            ...(body.orderMethod !== undefined
              ? { orderMethod: parseProductOrderMethod(body.orderMethod) }
              : {}),
            ...buildMarketplaceV2PatchFields(body, {
              priceCents: (product as { priceCents: number }).priceCents,
              marketplaceCategory: (product as { marketplaceCategory?: MarketplaceCategory | null })
                .marketplaceCategory,
            }),
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
          const sellerUid = (product as { seller?: { User?: { id?: string } } }).seller?.User?.id;
          if (sellerUid) {
            void awardProductLifecycleHcp(
              sellerUid,
              updatedProduct.id,
              updatedProduct.Image?.length ?? 0,
            ).catch((e) => console.warn('[gamification] product PATCH', e));
          }
          const sellerProfileId = (product as { sellerId?: string }).sellerId;
          const patchPickupLat = updateData.pickupLat as number | null | undefined;
          const patchPickupLng = updateData.pickupLng as number | null | undefined;
          if (
            sellerProfileId &&
            patchPickupLat != null &&
            patchPickupLng != null
          ) {
            await syncSellerProfileCoordsIfEmpty(sellerProfileId, {
              lat: patchPickupLat,
              lng: patchPickupLng,
            }).catch((e) => console.warn('[product PATCH] seller coords sync', e));
          }

          await syncLinkedDishFromProductPatch(
            {
              id: updatedProduct.id,
              title: updatedProduct.title,
              description: updatedProduct.description,
              priceCents: updatedProduct.priceCents,
              category: updatedProduct.category,
              subcategory: updatedProduct.subcategory,
              tags: updatedProduct.tags,
              stock: updatedProduct.stock,
              maxStock: updatedProduct.maxStock,
              pickupAddress: updatedProduct.pickupAddress,
              pickupLat: updatedProduct.pickupLat,
              pickupLng: updatedProduct.pickupLng,
              delivery: updatedProduct.delivery,
            },
            body,
            (product as { seller?: { User?: { id?: string } } }).seller?.User?.id ?? user.id,
          ).catch((e) => console.warn('[product PATCH] linked dish sync', e));

          return NextResponse.json({
            product: updatedProduct,
            publishBlocked: publishState.publishBlocked,
            publishBlockReason: publishState.publishBlockReason ?? null,
          });
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
            subcategory: body.subcategory !== undefined ? body.subcategory : undefined,
            tags: Array.isArray(body.tags)
              ? body.tags.filter((tag: string) => tag && tag.trim().length > 0)
              : undefined,
            // Pickup location fields
            pickupAddress: body.pickupAddress !== undefined ? body.pickupAddress : null,
            pickupLat: body.pickupLat !== undefined && body.pickupLat !== null ? Number(body.pickupLat) : null,
            pickupLng: body.pickupLng !== undefined && body.pickupLng !== null ? Number(body.pickupLng) : null,
            // Seller delivery fields
            sellerCanDeliver: body.sellerCanDeliver !== undefined ? Boolean(body.sellerCanDeliver) : undefined,
            deliveryRadiusKm: body.deliveryRadiusKm !== undefined && body.deliveryRadiusKm !== null ? Number(body.deliveryRadiusKm) : null,
            ...(body.orderMethod !== undefined
              ? { orderMethod: parseProductOrderMethod(body.orderMethod) }
              : {}),
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
          const sellerUidV4 = (product as { seller?: { User?: { id?: string } } }).seller?.User?.id;
          if (sellerUidV4) {
            void awardProductLifecycleHcp(
              sellerUidV4,
              updatedProduct.id,
              updatedProduct.Image?.length ?? 0,
            ).catch((e) => console.warn('[gamification] product PATCH', e));
          }
          await syncLinkedDishFromProductPatch(
            {
              id: updatedProduct.id,
              title: updatedProduct.title,
              description: updatedProduct.description,
              priceCents: updatedProduct.priceCents,
              category: updatedProduct.category,
              subcategory: updatedProduct.subcategory,
              tags: updatedProduct.tags,
              stock: updatedProduct.stock,
              maxStock: updatedProduct.maxStock,
              pickupAddress: updatedProduct.pickupAddress,
              pickupLat: updatedProduct.pickupLat,
              pickupLng: updatedProduct.pickupLng,
              delivery: updatedProduct.delivery,
            },
            body,
            (product as { seller?: { User?: { id?: string } } }).seller?.User?.id ?? user.id,
          ).catch((e) => console.warn('[product PATCH v4] linked dish sync', e));
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
    const raw = (await params).id;
    const id = resolveProductIdFromParam(raw);
    
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