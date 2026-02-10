
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CATEGORY_MAP: Record<string, any> = {
  CHEFF: 'CHEFF',
  GARDEN: 'GROWN', // Note: GARDEN maps to GROWN in schema
  DESIGNER: 'DESIGNER',
};

const DELIVERY_MAP: Record<string, any> = {
  PICKUP: 'PICKUP',
  DELIVERY: 'DELIVERY',
  BOTH: 'BOTH',
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await req.json();
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
    } = body || {};
    
    // Use isActive if provided, otherwise use isPublic, otherwise default to true
    const finalIsPublic = isActive !== undefined ? isActive : (isPublic !== undefined ? isPublic : true);
    console.log('[Products Create API] Final isPublic value:', finalIsPublic, '(from isActive:', isActive, ', isPublic:', isPublic, ')');

    if (!title || !description || !priceCents || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Ontbrekende velden' }, { status: 400 });
    }

    // Get user with seller profile
    const user = await prisma.user.findUnique({
      where: { id: (session?.user as any)?.id },
      include: { SellerProfile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

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

    const cat = CATEGORY_MAP[category] ?? 'CHEFF';
    const delivery = DELIVERY_MAP[deliveryMode] ?? 'PICKUP';

    // Create Product (not Listing)
    const productId = randomUUID();
    console.log('[Products Create API] Creating product with:', {
      productId,
      title,
      category: cat,
      priceCents: Number(priceCents),
      isActive: Boolean(finalIsPublic),
      finalIsPublic,
      sellerProfileId
    });
    
    const result = await prisma.product.create({
      data: {
        id: productId,
        title,
        description,
        priceCents: Number(priceCents),
        category: cat as any,
        unit: 'PORTION', // Default unit
        delivery: delivery as any,
        isActive: Boolean(finalIsPublic),
        displayNameType: displayNameType === 'firstname' ? 'first' : 
                        displayNameType === 'lastname' ? 'last' : 
                        displayNameType === 'username' ? 'username' : 'full',
        subcategory: subcategory || null,
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
        sellerId: sellerProfileId!,
        Image: {
          create: images.map((url: string, i: number) => ({
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

    // If growth photos are provided, create a Dish record with same ID as product for easy linking
    if (Array.isArray(growthPhotos) && growthPhotos.length > 0 && cat === 'GROWN') {
      // Use the same ID as the product so they're automatically linked
      await prisma.dish.create({
        data: {
          id: productId,
          userId: user.id,
          title,
          description: description || null,
          status: 'PUBLISHED',
          category: 'GROWN',
          subcategory: subcategory || null,
          tags: Array.isArray(tags) ? tags.filter((tag: string) => tag && tag.trim().length > 0) : [],
          // Set other fields to null/empty for garden projects
          priceCents: Number(priceCents),
          deliveryMode: delivery as any,
          place: pickupAddress || null,
          lat: pickupLat !== undefined && pickupLat !== null ? Number(pickupLat) : null,
          lng: pickupLng !== undefined && pickupLng !== null ? Number(pickupLng) : null,
          stock: stock !== undefined && stock !== null ? Number(stock) : 0,
          maxStock: maxStock !== undefined && maxStock !== null ? Number(maxStock) : null,
          ingredients: [],
          instructions: [],
          prepTime: null,
          servings: null,
          // Create main photos
          photos: {
            create: images.map((url: string, i: number) => ({
              id: randomUUID(),
              url: url,
              idx: i,
              isMain: i === 0
            }))
          },
          // Create growth photos with descriptions
          growthPhotos: {
            create: growthPhotos.map((photo: any, index: number) => ({
              id: randomUUID(),
              url: photo.url,
              phaseNumber: photo.phaseNumber || index + 1,
              idx: index,
              description: photo.description || null
            }))
          },
          // Create video if provided
          ...(video && video.url && {
            videos: {
              create: {
                id: randomUUID(),
                url: video.url,
                thumbnail: video.thumbnail || null,
                duration: video.duration ? Math.round(video.duration) : null,
                fileSize: null
              }
            }
          })
        }
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
        matches: verifyProduct.isActive === Boolean(finalIsPublic)
      });
      
      if (verifyProduct.isActive !== Boolean(finalIsPublic)) {
        console.error('[Products Create API] ⚠️ WARNING: isActive mismatch! Expected:', Boolean(finalIsPublic), 'Got:', verifyProduct.isActive);
      }
    } else {
      console.error('[Products Create API] ❌ ERROR: Product not found in database after creation!');
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
            title: title,
            priceCents: Number(priceCents),
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

    // Return product with explicit isActive field
    return NextResponse.json({ 
      ok: true, 
      product: {
        ...result,
        isActive: result.isActive // Explicitly include isActive
      },
      item: result // For backwards compatibility
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
