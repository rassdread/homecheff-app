
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertAccountRequirementsOr403 } from '@/lib/account-requirements-server';
import { normalizeDeliveryModeInput } from '@/lib/productDeliveryMode';
import {
  parseProductOrderMethod,
  resolveProductPublishState,
} from '@/lib/product/order-method';
import { awardProductLifecycleHcp } from '@/lib/gamification/product-hcp';
import {
  saleProductRequiresLocation,
  validateProductLocationForPublish,
} from '@/lib/geo/product-location-requirements';
import { syncSellerProfileCoordsIfEmpty } from '@/lib/seller/sync-seller-profile-coords';
import {
  parseMarketplaceV2FromBody,
  validateMarketplacePrice,
} from '@/lib/marketplace/parse-v2-payload';
import { MARKETPLACE_ERROR_KEYS } from '@/lib/marketplace/i18n-keys';
import { fulfillmentIsDigitalOnly } from '@/lib/marketplace/listing-taxonomy';

const CATEGORY_MAP: Record<string, any> = {
  CHEFF: 'CHEFF',
  GARDEN: 'GROWN', // Note: GARDEN maps to GROWN in schema
  DESIGNER: 'DESIGNER',
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as { id?: string })?.id;
    const sessionEmail = session?.user?.email;
    if (!session?.user || (!sessionUserId && !sessionEmail)) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error:
            'Kon de gegevens niet verwerken. Probeer kleinere foto’s (upload i.p.v. zeer grote plakken) of minder tegelijk.',
        },
        { status: 400 }
      );
    }
    console.log('[Products Create API] Received request body:', {
      hasTitle: !!body.title,
      hasDescription: !!body.description,
      priceCents: body.priceCents,
      category: body.category,
      isPublic: body.isPublic,
      isActive: body.isActive, // Check if isActive is passed instead of isPublic
      imagesCount: body.images?.length || 0
    });
    
    const {
      title,
      description,
      priceCents,
      category,
      deliveryMode = 'PICKUP',
      images = [],
      video,
      isPublic, // Don't default to true - use explicit value or isActive
      isActive, // Support both isPublic and isActive for backwards compatibility
      displayNameType = 'fullname',
      subcategory,
      availabilityDate,
      isFutureProduct = false,
      pickupAddress,
      pickupLat,
      pickupLng,
      sellerCanDeliver = false,
      deliveryRadiusKm,
      stock,
      maxStock,
      tags = [],
      growthPhotos = [],
      stepPhotos = [],
      ingredients = [],
      instructions = [],
      prepTime,
      servings,
      difficulty,
      mealType,
      plantType,
      sunlight,
      waterNeeds,
      harvestDate,
      location,
      growthDuration,
      plantDate,
      soilType,
      plantDistance,
      notes,
      materials = [],
      dimensions,
      orderMethod: orderMethodRaw,
      listingIntent: listingIntentRaw,
      marketplaceCategory: marketplaceCategoryRaw,
      priceModel: priceModelRaw,
      acceptHomeCheffPayment: acceptHomeCheffPaymentRaw,
      acceptDirectContact: acceptDirectContactRaw,
      fulfillmentOptions: fulfillmentOptionsRaw,
      barterOpenness: barterOpennessRaw,
      placeName: placeNameRaw,
      useProfileLocation: useProfileLocationRaw,
    } = body || {};
    
    const v2Preview = parseMarketplaceV2FromBody(body as Record<string, unknown>, Number(priceCents) || 0);
    let orderMethod = parseProductOrderMethod(
      orderMethodRaw ?? v2Preview.orderMethod,
    );
    if (acceptHomeCheffPaymentRaw === false && acceptDirectContactRaw === true) {
      orderMethod = 'CONTACT';
    }
    const isContactOrder =
      orderMethod === 'CONTACT' || v2Preview.priceModel === 'ON_REQUEST';
    
    // Use isActive if provided, otherwise use isPublic, otherwise default to true
    const finalIsPublic = isActive !== undefined ? isActive : (isPublic !== undefined ? isPublic : true);
    console.log('[Products Create API] Final isPublic value:', finalIsPublic, '(from isActive:', isActive, ', isPublic:', isPublic, ')');

    const titleStr = typeof title === 'string' ? title.trim() : '';
    const descStr = typeof description === 'string' ? description.trim() : '';
    const priceCentsNum = Number(priceCents);
    const imageList = Array.isArray(images) ? images : [];
    const validImageUrls = imageList.filter(
      (u): u is string => typeof u === 'string' && u.trim().length > 0
    );

    const priceValid =
      Number.isFinite(priceCentsNum) &&
      priceCentsNum >= 0 &&
      (isContactOrder ||
        v2Preview.priceModel === 'ON_REQUEST' ||
        v2Preview.priceModel === 'VOLUNTARY' ||
        priceCentsNum > 0);

    const priceCheck = validateMarketplacePrice(
      v2Preview.priceModel,
      priceCentsNum,
      v2Preview.acceptHomeCheffPayment,
      v2Preview.acceptDirectContact,
    );

    if (!titleStr || !descStr || !priceValid || validImageUrls.length === 0 || !priceCheck.ok) {
      let errorKey: string = MARKETPLACE_ERROR_KEYS.invalidFields;
      let detailsKey: string | undefined;

      if (!priceCheck.ok) {
        errorKey = priceCheck.errorKey;
      } else if (validImageUrls.length === 0) {
        detailsKey = MARKETPLACE_ERROR_KEYS.validPhotoUrlRequired;
      } else if (!priceValid) {
        detailsKey = isContactOrder
          ? MARKETPLACE_ERROR_KEYS.priceInvalidContact
          : MARKETPLACE_ERROR_KEYS.priceMissingOrInvalid;
      }

      return NextResponse.json(
        { errorKey, detailsKey },
        { status: 400 },
      );
    }

    // Get user with seller profile (id preferred; email fallback matches other seller APIs)
    let user =
      sessionUserId &&
      (await prisma.user.findUnique({
        where: { id: sessionUserId },
        include: { SellerProfile: true, Account: { select: { provider: true } } },
      }));
    if (!user && sessionEmail) {
      user = await prisma.user.findUnique({
        where: { email: sessionEmail },
        include: { SellerProfile: true, Account: { select: { provider: true } } },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    const accBlock = assertAccountRequirementsOr403(user, 'postItem');
    if (accBlock) return accBlock;

    // Always create SellerProfile if it doesn't exist (user is trying to sell, so allow it)
    let sellerProfileId = user.SellerProfile?.id;
    
    if (!sellerProfileId) {
      console.log('[Products Create API] No SellerProfile found, creating one automatically');
      try {
        const newSellerProfile = await prisma.sellerProfile.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            displayName: user.name || user.username || 'Mijn Bedrijf',
            bio: 'Verkoop via HomeCheff',
            deliveryMode: 'FIXED',
            deliveryRadius: 5
          }
        });
        
        sellerProfileId = newSellerProfile.id;
        console.log('[Products Create API] Created SellerProfile:', newSellerProfile.id);
      } catch (profileError: any) {
        console.error('[Products Create API] Failed to create SellerProfile:', profileError);
        // If it's a unique constraint error, try to fetch existing one
        if (profileError?.code === 'P2002') {
          const existingProfile = await prisma.sellerProfile.findUnique({
            where: { userId: user.id }
          });
          if (existingProfile) {
            sellerProfileId = existingProfile.id;
            console.log('[Products Create API] Found existing SellerProfile:', sellerProfileId);
          }
        }
        // If still no profile, this is a critical error
        if (!sellerProfileId) {
          return NextResponse.json({ 
            error: 'Kon geen verkopersprofiel aanmaken. Probeer het opnieuw.' 
          }, { status: 500 });
        }
      }
    }
    
    console.log('[Products Create API] Using sellerProfileId:', sellerProfileId);

    const publishState = resolveProductPublishState({
      requestedActive: finalIsPublic,
      orderMethod,
      priceCents: priceCentsNum,
      sellerUser: user,
    });

    const pickupLatNum =
      pickupLat !== undefined && pickupLat !== null ? Number(pickupLat) : null;
    const pickupLngNum =
      pickupLng !== undefined && pickupLng !== null ? Number(pickupLng) : null;
    const pickupAddressStr =
      typeof pickupAddress === 'string' ? pickupAddress.trim() : '';

    const v2Resolved = parseMarketplaceV2FromBody(
      body as Record<string, unknown>,
      priceCentsNum,
    );
    const digitalOnly = fulfillmentIsDigitalOnly(v2Resolved.fulfillmentOptions);
    const placeNameStr =
      typeof placeNameRaw === 'string' ? placeNameRaw.trim() : v2Resolved.placeName;

    if (
      publishState.isActive &&
      !digitalOnly &&
      saleProductRequiresLocation(orderMethod, priceCentsNum, v2Resolved.priceModel)
    ) {
      const locCheck = validateProductLocationForPublish({
        pickupAddress: pickupAddressStr || placeNameStr || null,
        pickupLat: pickupLatNum,
        pickupLng: pickupLngNum,
        seller: user.SellerProfile
          ? {
              lat: user.SellerProfile.lat,
              lng: user.SellerProfile.lng,
              User: {
                place: placeNameStr || user.place,
                city: placeNameStr || user.city,
                lat: user.lat,
                lng: user.lng,
              },
            }
          : {
              User: {
                place: placeNameStr || user.place,
                city: placeNameStr || user.city,
                lat: user.lat,
                lng: user.lng,
              },
            },
      });
      if (!locCheck.ok) {
        return NextResponse.json(
          { error: locCheck.message, code: locCheck.errorCode },
          { status: 400 }
        );
      }
    }

    const cat = v2Resolved.productCategory;
    const delivery = normalizeDeliveryModeInput(
      typeof deliveryMode === 'string' ? deliveryMode : v2Resolved.deliveryMode
    );

    // Create Product (not Listing)
    const productId = randomUUID();
    console.log('[Products Create API] Creating product with:', {
      productId,
      title: titleStr,
      category: cat,
      priceCents: priceCentsNum,
      isActive: publishState.isActive,
      finalIsPublic,
      publishBlocked: publishState.publishBlocked,
      sellerProfileId
    });
    
    const result = await prisma.product.create({
      data: {
        id: productId,
        title: titleStr,
        description: descStr,
        priceCents: priceCentsNum,
        category: cat as any,
        unit: 'PORTION', // Default unit
        delivery: delivery as any,
        isActive: publishState.isActive,
        displayNameType: displayNameType === 'firstname' ? 'first' : 
                        displayNameType === 'lastname' ? 'last' : 
                        displayNameType === 'username' ? 'username' : 'full',
        subcategory: v2Resolved.subcategory,
        specializations: v2Resolved.specializations,
        availabilityDate: availabilityDate ? new Date(availabilityDate) : null,
        isFutureProduct: Boolean(isFutureProduct),
        pickupAddress: pickupAddress || null,
        pickupLat: pickupLat !== undefined && pickupLat !== null ? Number(pickupLat) : null,
        pickupLng: pickupLng !== undefined && pickupLng !== null ? Number(pickupLng) : null,
        sellerCanDeliver: Boolean(sellerCanDeliver),
        deliveryRadiusKm: deliveryRadiusKm !== undefined && deliveryRadiusKm !== null ? Number(deliveryRadiusKm) : null,
        stock: stock !== undefined && stock !== null ? Number(stock) : 0,
        maxStock: maxStock !== undefined && maxStock !== null ? Number(maxStock) : null,
        tags: Array.isArray(tags) ? tags.filter((tag: string) => tag && tag.trim().length > 0) : [],
        orderMethod,
        listingIntent: v2Resolved.listingIntent,
        marketplaceCategory: v2Resolved.marketplaceCategory,
        priceModel: v2Resolved.priceModel,
        acceptHomeCheffPayment: v2Resolved.acceptHomeCheffPayment,
        acceptDirectContact: v2Resolved.acceptDirectContact,
        fulfillmentOptions: v2Resolved.fulfillmentOptions as object,
        barterOpenness: v2Resolved.barterOpenness,
        placeName: placeNameStr || null,
        useProfileLocation:
          useProfileLocationRaw !== false && useProfileLocationRaw !== 'false',
        sellerId: sellerProfileId!,
        Image: {
          create: validImageUrls.map((url: string, i: number) => ({
            id: randomUUID(),
            fileUrl: url,
            sortOrder: i,
          })),
        },
        ...(video && video.url && {
          Video: {
            create: {
              id: randomUUID(),
              url: video.url,
              thumbnail: video.thumbnail || null,
              duration: video.duration ? Math.round(video.duration) : null,
              fileSize: null
            }
          }
        })
      },
      include: {
        Image: true,
        Video: true,
        seller: {
          include: {
            User: {
              select: {
                name: true,
                username: true,
                profileImage: true
              }
            }
          }
        }
      },
    });

    // Linked Dish records share the product ID for inspiration ↔ sale parity.
    const tagList = Array.isArray(tags)
      ? tags.filter((tag: string) => tag && tag.trim().length > 0)
      : [];
    const growthPhotoList = Array.isArray(growthPhotos) ? growthPhotos : [];
    const stepPhotoList = Array.isArray(stepPhotos) ? stepPhotos : [];
    const materialList = Array.isArray(materials)
      ? materials.filter((m: unknown) => typeof m === 'string' && m.trim().length > 0)
      : [];

    if (cat === 'GROWN') {
      await prisma.dish.upsert({
        where: { id: productId },
        create: {
          id: productId,
          userId: user.id,
          title: titleStr,
          description: descStr || null,
          status: 'PUBLISHED',
          category: 'GROWN',
          subcategory: subcategory || null,
          tags: tagList,
          priceCents: priceCentsNum,
          deliveryMode: delivery as any,
          place: pickupAddress || null,
          lat: pickupLat !== undefined && pickupLat !== null ? Number(pickupLat) : null,
          lng: pickupLng !== undefined && pickupLng !== null ? Number(pickupLng) : null,
          stock: stock !== undefined && stock !== null ? Number(stock) : 0,
          maxStock: maxStock !== undefined && maxStock !== null ? Number(maxStock) : null,
          ingredients: [],
          instructions: [],
          plantType: typeof plantType === 'string' ? plantType : null,
          sunlight: typeof sunlight === 'string' ? sunlight : null,
          waterNeeds: typeof waterNeeds === 'string' ? waterNeeds : null,
          harvestDate: typeof harvestDate === 'string' ? harvestDate : null,
          location: typeof location === 'string' ? location : null,
          growthDuration:
            growthDuration !== undefined && growthDuration !== null && growthDuration !== ''
              ? Number(growthDuration)
              : null,
          plantDate: typeof plantDate === 'string' ? plantDate : null,
          soilType: typeof soilType === 'string' ? soilType : null,
          plantDistance: typeof plantDistance === 'string' ? plantDistance : null,
          difficulty: typeof difficulty === 'string' ? difficulty : null,
          notes: typeof notes === 'string' ? notes : null,
          photos: {
            create: validImageUrls.map((url: string, i: number) => ({
              id: randomUUID(),
              url,
              idx: i,
              isMain: i === 0,
            })),
          },
          ...(growthPhotoList.length > 0 && {
            growthPhotos: {
              create: growthPhotoList.map((photo: any, index: number) => ({
                id: randomUUID(),
                url: photo.url,
                phaseNumber: photo.phaseNumber || index + 1,
                idx: index,
                description: photo.description || null,
              })),
            },
          }),
          ...(video && video.url && {
            videos: {
              create: {
                id: randomUUID(),
                url: video.url,
                thumbnail: video.thumbnail || null,
                duration: video.duration ? Math.round(video.duration) : null,
                fileSize: null,
              },
            },
          }),
        },
        update: {
          title: titleStr,
          description: descStr || null,
          subcategory: subcategory || null,
          tags: tagList,
          priceCents: priceCentsNum,
          plantType: typeof plantType === 'string' ? plantType : null,
          sunlight: typeof sunlight === 'string' ? sunlight : null,
          waterNeeds: typeof waterNeeds === 'string' ? waterNeeds : null,
          harvestDate: typeof harvestDate === 'string' ? harvestDate : null,
          location: typeof location === 'string' ? location : null,
          growthDuration:
            growthDuration !== undefined && growthDuration !== null && growthDuration !== ''
              ? Number(growthDuration)
              : null,
          plantDate: typeof plantDate === 'string' ? plantDate : null,
          soilType: typeof soilType === 'string' ? soilType : null,
          plantDistance: typeof plantDistance === 'string' ? plantDistance : null,
          difficulty: typeof difficulty === 'string' ? difficulty : null,
          notes: typeof notes === 'string' ? notes : null,
        },
      });
    }

    if (cat === 'CHEFF') {
      const ingredientList = Array.isArray(ingredients)
        ? ingredients.filter((ing: unknown) => typeof ing === 'string' && ing.trim().length > 0)
        : [];
      const instructionList = Array.isArray(instructions)
        ? instructions.filter((ins: unknown) => typeof ins === 'string' && ins.trim().length > 0)
        : [];
      const mealSubcategory =
        (typeof subcategory === 'string' && subcategory.trim()) ||
        (typeof mealType === 'string' && mealType.trim()) ||
        null;

      await prisma.dish.upsert({
        where: { id: productId },
        create: {
          id: productId,
          userId: user.id,
          title: titleStr,
          description: descStr || null,
          status: 'PUBLISHED',
          category: 'CHEFF',
          subcategory: mealSubcategory,
          tags: tagList,
          priceCents: priceCentsNum,
          deliveryMode: delivery as any,
          place: pickupAddress || null,
          lat: pickupLat !== undefined && pickupLat !== null ? Number(pickupLat) : null,
          lng: pickupLng !== undefined && pickupLng !== null ? Number(pickupLng) : null,
          stock: stock !== undefined && stock !== null ? Number(stock) : 0,
          maxStock: maxStock !== undefined && maxStock !== null ? Number(maxStock) : null,
          ingredients: ingredientList,
          instructions: instructionList,
          prepTime:
            prepTime !== undefined && prepTime !== null && prepTime !== ''
              ? Number(prepTime)
              : null,
          servings:
            servings !== undefined && servings !== null && servings !== ''
              ? Number(servings)
              : null,
          difficulty: typeof difficulty === 'string' ? difficulty : null,
          photos: {
            create: validImageUrls.map((url: string, i: number) => ({
              id: randomUUID(),
              url,
              idx: i,
              isMain: i === 0,
            })),
          },
          ...(stepPhotoList.length > 0 && {
            stepPhotos: {
              create: stepPhotoList.map((photo: any, index: number) => ({
                id: randomUUID(),
                url: photo.url,
                stepNumber: photo.stepNumber ?? index + 1,
                idx: photo.idx ?? index,
                description: photo.description || null,
              })),
            },
          }),
          ...(video && video.url && {
            videos: {
              create: {
                id: randomUUID(),
                url: video.url,
                thumbnail: video.thumbnail || null,
                duration: video.duration ? Math.round(video.duration) : null,
                fileSize: null,
              },
            },
          }),
        },
        update: {
          title: titleStr,
          description: descStr || null,
          subcategory: mealSubcategory,
          tags: tagList,
          priceCents: priceCentsNum,
          ingredients: ingredientList,
          instructions: instructionList,
          prepTime:
            prepTime !== undefined && prepTime !== null && prepTime !== ''
              ? Number(prepTime)
              : null,
          servings:
            servings !== undefined && servings !== null && servings !== ''
              ? Number(servings)
              : null,
          difficulty: typeof difficulty === 'string' ? difficulty : null,
        },
      });
    }

    if (cat === 'DESIGNER') {
      await prisma.dish.upsert({
        where: { id: productId },
        create: {
          id: productId,
          userId: user.id,
          title: titleStr,
          description: descStr || null,
          status: 'PUBLISHED',
          category: 'DESIGNER',
          subcategory: subcategory || null,
          tags: tagList,
          priceCents: priceCentsNum,
          deliveryMode: delivery as any,
          place: pickupAddress || null,
          lat: pickupLat !== undefined && pickupLat !== null ? Number(pickupLat) : null,
          lng: pickupLng !== undefined && pickupLng !== null ? Number(pickupLng) : null,
          stock: stock !== undefined && stock !== null ? Number(stock) : 0,
          maxStock: maxStock !== undefined && maxStock !== null ? Number(maxStock) : null,
          materials: materialList,
          instructions: Array.isArray(instructions)
            ? instructions.filter((ins: unknown) => typeof ins === 'string' && ins.trim().length > 0)
            : [],
          dimensions: typeof dimensions === 'string' ? dimensions : null,
          notes: typeof notes === 'string' ? notes : null,
          ingredients: [],
          photos: {
            create: validImageUrls.map((url: string, i: number) => ({
              id: randomUUID(),
              url,
              idx: i,
              isMain: i === 0,
            })),
          },
          ...(video && video.url && {
            videos: {
              create: {
                id: randomUUID(),
                url: video.url,
                thumbnail: video.thumbnail || null,
                duration: video.duration ? Math.round(video.duration) : null,
                fileSize: null,
              },
            },
          }),
        },
        update: {
          title: titleStr,
          description: descStr || null,
          subcategory: subcategory || null,
          tags: tagList,
          priceCents: priceCentsNum,
          materials: materialList,
          instructions: Array.isArray(instructions)
            ? instructions.filter((ins: unknown) => typeof ins === 'string' && ins.trim().length > 0)
            : [],
          dimensions: typeof dimensions === 'string' ? dimensions : null,
          notes: typeof notes === 'string' ? notes : null,
        },
      });
    }

    // Verify product was created correctly
    console.log('[Products Create API] ✅ Product created successfully:', {
      id: result.id,
      title: result.title,
      isActive: result.isActive,
      category: result.category,
      sellerId: result.sellerId
    });
    
    // Double-check by fetching the product from database
    const verifyProduct = await prisma.product.findUnique({
      where: { id: result.id },
      select: { id: true, title: true, isActive: true, category: true, sellerId: true }
    });
    
    if (verifyProduct) {
      console.log('[Products Create API] ✅ Verified product in database:', {
        id: verifyProduct.id,
        isActive: verifyProduct.isActive,
        matches: verifyProduct.isActive === publishState.isActive
      });
      
      if (verifyProduct.isActive !== publishState.isActive) {
        console.error('[Products Create API] ⚠️ WARNING: isActive mismatch! Expected:', publishState.isActive, 'Got:', verifyProduct.isActive);
      }
    } else {
      console.error('[Products Create API] ❌ ERROR: Product not found in database after creation!');
    }

    if (sellerProfileId && pickupLatNum != null && pickupLngNum != null) {
      await syncSellerProfileCoordsIfEmpty(sellerProfileId, {
        lat: pickupLatNum,
        lng: pickupLngNum,
      }).catch((e) => console.warn('[Products Create] seller coords sync', e));
    } else if (sellerProfileId && user.lat != null && user.lng != null) {
      await syncSellerProfileCoordsIfEmpty(sellerProfileId, {
        lat: user.lat,
        lng: user.lng,
      }).catch((e) => console.warn('[Products Create] seller coords sync from user', e));
    }

    // Send notifications to followers
    if (sellerProfileId) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/new-product`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: result.id,
            sellerId: sellerProfileId
          })
        });
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
        // Don't fail the product creation if notifications fail
      }
    }

    // Generate initial analytics data for the new product
    try {
      // Create a "product created" event
      await prisma.analyticsEvent.create({
        data: {
          eventType: 'CREATE',
          entityType: 'PRODUCT',
          entityId: result.id,
          userId: user.id,
          metadata: {
            category: cat,
            title: titleStr,
            priceCents: priceCentsNum,
            sellerId: sellerProfileId,
            createdAt: new Date().toISOString()
          }
        }
      });

      // Generate some initial view events to simulate organic discovery
      const initialViews = Math.floor(Math.random() * 5) + 1; // 1-5 initial views
      for (let i = 0; i < initialViews; i++) {
        // Create views from the last few hours
        const viewTime = new Date();
        viewTime.setHours(viewTime.getHours() - Math.floor(Math.random() * 6));
        viewTime.setMinutes(Math.floor(Math.random() * 60));
        
        // Create view event
        await prisma.analyticsEvent.create({
          data: {
            eventType: 'VIEW',
            entityType: 'PRODUCT',
            entityId: result.id,
            userId: user.id,
            metadata: {
              category: cat,
              source: 'product_creation',
              isInitialView: true
            },
            createdAt: viewTime
          }
        });
      }

    } catch (analyticsError) {
      console.error('Failed to generate initial analytics data:', analyticsError);
      // Don't fail the product creation if analytics fail
    }

    void awardProductLifecycleHcp(user.id, result.id, result.Image?.length ?? 0).catch((e) =>
      console.warn('[gamification] product lifecycle', e),
    );

    // Return product with explicit isActive field
    return NextResponse.json({ 
      ok: true, 
      product: {
        ...result,
        isActive: result.isActive
      },
      item: result,
      publishBlocked: publishState.publishBlocked,
      publishBlockReason: publishState.publishBlockReason ?? null,
    }, { status: 201 });
  } catch (err: any) {
    console.error('❌ [Products Create API] Create product failed:', err);
    console.error('❌ [Products Create API] Error details:', {
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
      name: err?.name
    });
    
    // Provide more helpful error messages
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Dit product bestaat al' }, { status: 400 });
    }
    
    if (err?.code === 'P2003') {
      return NextResponse.json({ error: 'Ongeldige relatie met seller profile' }, { status: 400 });
    }
    
    if (err?.message?.includes('required')) {
      return NextResponse.json({ error: 'Ontbrekende verplichte velden: ' + err.message }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: err?.message || 'Serverfout bij aanmaken product',
      details: process.env.NODE_ENV === 'development' ? String(err) : undefined
    }, { status: 500 });
  }
}
