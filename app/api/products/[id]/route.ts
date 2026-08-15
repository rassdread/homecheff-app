import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
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
import {
  saleProductRequiresLocation,
  validateProductLocationForPublish,
} from '@/lib/geo/product-location-requirements';
import {
  ambiguousLocationResponse,
  ensureCoordsFromPlaceQuery,
} from '@/lib/geo/ensure-place-coords';
import { placeTextMateriallyChanged } from '@/lib/geo/resolve-place-input';
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
import {
  revalidatePublicFeedCache,
  shouldRevalidateAfterListingMutation,
  shouldRevalidateAfterProductMutation,
} from '@/lib/feed/revalidate-public-feed';
import { assertOrApplyCommerceDeclarationForPaidOffer } from '@/lib/legal/assert-commerce-declaration-for-paid-offer';
import { productRequiresAllergenConfirmation } from '@/lib/legal/food-allergen-applicability';
import { buildAllergenConfirmationUpdate } from '@/lib/legal/food-allergen-context';
import {
  contributionRequiredForPublish,
  parseContributionPayloadFromBody,
} from '@/lib/trust/seller-contribution';
import { syncLinkedDishFromProductPatch } from '@/lib/items/sync-linked-product-dish';
import { listingProductCacheTag } from '@/lib/marketplace/detail/get-cached-listing-product-core';

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

    const sellerUserId =
      product.seller?.User?.id ?? (product as { User?: { id?: string } }).User?.id;

    // Parallelize public secondary data — do NOT block on Stripe network refresh.
    const [
      [viewCount, orderCount, favoriteCount, reviewAgg],
      dish,
      publicContactChannels,
      sellerBadgesMap,
      sellerStripe,
      trustBundles,
    ] = await Promise.all([
      Promise.all([
        prisma.analyticsEvent.count({
          where: {
            entityId: id,
            eventType: { in: ['VIEW', 'PRODUCT_VIEW'] },
            entityType: 'PRODUCT',
          },
        }),
        prisma.orderItem.count({
          where: {
            productId: id,
            Order: {
              status: {
                in: ['PROCESSING', 'SHIPPED', 'DELIVERED'],
              },
            },
          },
        }),
        prisma.favorite.count({
          where: { productId: id },
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
      ]),
      prisma.dish.findUnique({
        where: { id },
        include: {
          stepPhotos: {
            select: {
              id: true,
              url: true,
              stepNumber: true,
              description: true,
              idx: true,
            },
            orderBy: [{ stepNumber: 'asc' }, { idx: 'asc' }],
          },
          growthPhotos: {
            select: {
              id: true,
              url: true,
              phaseNumber: true,
              description: true,
              idx: true,
            },
            orderBy: [{ phaseNumber: 'asc' }, { idx: 'asc' }],
          },
          videos: {
            select: {
              id: true,
              url: true,
              thumbnail: true,
              duration: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      loadPublicContactChannelsForUser(sellerUserId),
      sellerUserId
        ? fetchAuthorBadgeSummariesByUserIds([sellerUserId], 2)
        : Promise.resolve(new Map()),
      sellerUserId
        ? prisma.user.findUnique({
            where: { id: sellerUserId },
            select: {
              stripeConnectAccountId: true,
              stripeConnectOnboardingCompleted: true,
            },
          })
        : Promise.resolve(null),
      sellerUserId
        ? fetchSellerTrustBundles([sellerUserId])
        : Promise.resolve(new Map()),
    ]);

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

    const sellerBadges = sellerUserId ? sellerBadgesMap.get(sellerUserId) ?? [] : [];
    const isBusiness = Boolean(
      product.seller?.kvk && product.seller?.companyName,
    );

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

    // Public listings: published inspiration links without waiting on auth.
    // Owner-only draft visibility still requires a session (rare on public GET).
    if (isDish && dish && dishCategory) {
      if (dish.status === 'PUBLISHED') {
        linkedInspiration = {
          href: getInspiratieDetailHref(dishCategory as InspirationCategory, id),
          category: dishCategory as InspirationCategory,
          status: dish.status,
          isOwner: false,
        };
      } else {
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
        if (isOwner) {
          linkedInspiration = {
            href: getInspiratieDetailHref(dishCategory as InspirationCategory, id),
            category: dishCategory as InspirationCategory,
            status: dish.status,
            isOwner: true,
          };
        }
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

    const session = await auth();
    const email: string | undefined = session?.user?.email || undefined;
    if (!email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

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

    // Continue with existing update body (was nested under session email check)
    {
        const sellerUserForPublish = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            stripeConnectAccountId: true,
            stripeConnectOnboardingCompleted: true,
          },
        });

        if (isNewModel) {
          const priceCentsGate =
            body.priceCents ?? (product as { priceCents?: number }).priceCents ?? 0;
          const priceModelGate =
            body.priceModel !== undefined
              ? body.priceModel
              : (product as { priceModel?: string | null }).priceModel;
          const barterGate =
            body.barterOpenness !== undefined
              ? body.barterOpenness
              : (product as { barterOpenness?: string | null }).barterOpenness;
          const commerceBlock = await assertOrApplyCommerceDeclarationForPaidOffer({
            sellerProfileId: (product as { sellerId: string }).sellerId,
            gate: {
              priceCents: Number(priceCentsGate) || 0,
              priceModel:
                typeof priceModelGate === 'string' ? priceModelGate : null,
              barterOpenness:
                typeof barterGate === 'string' ? barterGate : null,
            },
            bodyDeclaration: body.commerceDeclaration,
          });
          if (commerceBlock) return commerceBlock;
        }

        if (
          isNewModel &&
          (body.allergens !== undefined || body.allergensConfirmed !== undefined)
        ) {
          const mcat =
            body.marketplaceCategory !== undefined
              ? body.marketplaceCategory
              : (product as { marketplaceCategory?: string | null })
                  .marketplaceCategory;
          const specs =
            body.specializations !== undefined
              ? body.specializations
              : (product as { specializations?: string[] }).specializations;
          const sub =
            body.subcategory !== undefined
              ? body.subcategory
              : (product as { subcategory?: string | null }).subcategory;
          const cat = (product as { category?: string }).category;
          if (
            productRequiresAllergenConfirmation({
              category: typeof cat === 'string' ? cat : null,
              marketplaceCategory:
                typeof mcat === 'string' ? mcat : null,
              specializations: Array.isArray(specs) ? specs : null,
              subcategory: typeof sub === 'string' ? sub : null,
            })
          ) {
            const allergenUpdate = buildAllergenConfirmationUpdate({
              allergens: body.allergens,
              confirmed: body.allergensConfirmed === true,
            });
            if (allergenUpdate) {
              (body as Record<string, unknown>).__allergenPatch = allergenUpdate;
            }
          }
        }

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
          const priceModel =
            body.priceModel !== undefined
              ? body.priceModel
              : (product as { priceModel?: string | null }).priceModel;
          if (saleProductRequiresLocation(orderMethod, priceCents, priceModel)) {
            const sellerProfile = await prisma.sellerProfile.findUnique({
              where: { id: (product as { sellerId: string }).sellerId },
              include: {
                User: {
                  select: {
                    place: true,
                    city: true,
                    lat: true,
                    lng: true,
                    country: true,
                  },
                },
              },
            });
            const useProfileLocation =
              body.useProfileLocation !== undefined
                ? body.useProfileLocation !== false &&
                  body.useProfileLocation !== 'false'
                : (product as { useProfileLocation?: boolean }).useProfileLocation !==
                  false;
            const pickupAddress =
              body.pickupAddress !== undefined
                ? body.pickupAddress
                : (product as { pickupAddress?: string | null }).pickupAddress;
            const placeNameIncoming =
              typeof body.placeName === 'string'
                ? body.placeName.trim()
                : (product as { placeName?: string | null }).placeName || null;
            const placeChanged =
              body.placeName !== undefined &&
              placeTextMateriallyChanged(
                (product as { placeName?: string | null }).placeName,
                body.placeName,
              );

            let pickupLat =
              body.pickupLat !== undefined
                ? body.pickupLat != null
                  ? Number(body.pickupLat)
                  : null
                : (product as { pickupLat?: number | null }).pickupLat;
            let pickupLng =
              body.pickupLng !== undefined
                ? body.pickupLng != null
                  ? Number(body.pickupLng)
                  : null
                : (product as { pickupLng?: number | null }).pickupLng;

            // New place text must never keep old coordinates.
            if (placeChanged) {
              const bodyHasNewCoords =
                body.pickupLat != null &&
                body.pickupLng != null &&
                Number.isFinite(Number(body.pickupLat)) &&
                Number.isFinite(Number(body.pickupLng));
              if (!bodyHasNewCoords) {
                pickupLat = null;
                pickupLng = null;
              }
            }

            const countryForGeo =
              typeof sellerProfile?.User?.country === 'string' &&
              sellerProfile.User.country.trim()
                ? sellerProfile.User.country
                : 'NL';
            const placeQuery =
              (typeof pickupAddress === 'string' && pickupAddress.trim()) ||
              placeNameIncoming ||
              (useProfileLocation
                ? sellerProfile?.User?.place || sellerProfile?.User?.city || null
                : null);

            if (
              (pickupLat == null || pickupLng == null) &&
              placeQuery
            ) {
              const ensured = await ensureCoordsFromPlaceQuery({
                placeQuery,
                countryCode: countryForGeo,
                lat: pickupLat,
                lng: pickupLng,
              });
              if (ensured.resolution?.status === 'ambiguous') {
                return NextResponse.json(
                  ambiguousLocationResponse(ensured.resolution.candidates),
                  { status: 400 },
                );
              }
              pickupLat = ensured.lat;
              pickupLng = ensured.lng;
            }

            // Persist resolved coords for later updateData
            (body as { pickupLat?: number | null }).pickupLat = pickupLat;
            (body as { pickupLng?: number | null }).pickupLng = pickupLng;

            const locCheck = validateProductLocationForPublish(
              useProfileLocation
                ? {
                    pickupAddress,
                    pickupLat,
                    pickupLng,
                    seller: sellerProfile,
                  }
                : {
                    pickupAddress,
                    pickupLat,
                    pickupLng,
                    seller: {
                      User: {
                        place: placeNameIncoming,
                      },
                    },
                  }
            );
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
            // Pickup location fields — use write-time resolved coords when present on body
            pickupAddress: body.pickupAddress !== undefined ? body.pickupAddress : null,
            pickupLat:
              body.pickupLat !== undefined
                ? body.pickupLat != null
                  ? Number(body.pickupLat)
                  : null
                : null,
            pickupLng:
              body.pickupLng !== undefined
                ? body.pickupLng != null
                  ? Number(body.pickupLng)
                  : null
                : null,
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

          const allergenPatch = (body as { __allergenPatch?: {
            allergens: string[];
            allergensConfirmedAt: Date | null;
          } }).__allergenPatch;
          if (allergenPatch) {
            updateData.allergens = allergenPatch.allergens;
            updateData.allergensConfirmedAt = allergenPatch.allergensConfirmedAt;
          }

          if (
            body.sellerContributionTypes !== undefined ||
            body.sellerContributionNote !== undefined
          ) {
            const contribution = parseContributionPayloadFromBody(body);
            const intent =
              body.listingIntent !== undefined
                ? body.listingIntent
                : (product as { listingIntent?: string }).listingIntent;
            if (
              contributionRequiredForPublish({
                listingIntent:
                  typeof intent === 'string' ? intent : 'OFFER',
                isEdit: true,
                integrityStatus: (product as { integrityStatus?: string })
                  .integrityStatus,
              }) &&
              contribution.sellerContributionTypes.length === 0
            ) {
              return NextResponse.json(
                {
                  error:
                    'Geef aan wat jij zelf aan dit aanbod hebt gedaan (minimaal één bijdrage).',
                  errorKey: 'trust.contribution.required',
                },
                { status: 400 },
              );
            }
            updateData.sellerContributionTypes =
              contribution.sellerContributionTypes;
            updateData.sellerContributionNote =
              contribution.sellerContributionNote;
            updateData.sellerContributionUpdatedAt = new Date();
          }

          // Update images if provided
          if (body.images && Array.isArray(body.images)) {
            const validUrls = body.images.filter(
              (url: unknown) => typeof url === 'string' && url.trim().length > 0,
            );
            if (validUrls.length === 0) {
              return NextResponse.json(
                { error: 'Minimaal één geldige foto is verplicht.' },
                { status: 400 },
              );
            }
            // Delete existing images and create new ones
            await prisma.image.deleteMany({
              where: { productId: id }
            });
            
            updateData.Image = {
              create: validUrls.map((url: string, i: number) => ({
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

          if (shouldRevalidateAfterProductMutation(product, updatedProduct)) {
            revalidatePublicFeedCache('product:patch');
          }
          revalidateTag(listingProductCacheTag(updatedProduct.id));

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
          if (shouldRevalidateAfterListingMutation(product, updatedListing)) {
            revalidatePublicFeedCache('listing:patch');
          }
          revalidateTag(listingProductCacheTag(updatedListing.id));
          return NextResponse.json({ product: updatedListing });
        }
    }
  } catch (e) {
    console.error('[products PATCH]', e);
    return NextResponse.json(
      {
        error: "Server error",
        message: e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const raw = (await params).id;
    const id = resolveProductIdFromParam(raw);

    const session = await auth();
    const email: string | undefined = session?.user?.email || undefined;
    if (!email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
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

            // Linked Dish shares product id (create dual-write for inspiration parity).
            // Remove only that same-id Dish so Product delete does not leave an orphan recipe.
            await tx.dish.deleteMany({
              where: { id },
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

        if (isNewModel) {
          if (shouldRevalidateAfterProductMutation(product, null)) {
            revalidatePublicFeedCache('product:delete');
          }
        } else if (shouldRevalidateAfterListingMutation(product, null)) {
          revalidatePublicFeedCache('listing:delete');
        }
        revalidateTag(listingProductCacheTag(id));

        return NextResponse.json({ success: true });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
