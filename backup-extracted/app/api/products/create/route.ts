
import { NextResponse } from 'next/server';

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
    const {
      title,
      description,
      priceCents,
      category,
      deliveryMode = 'PICKUP',
      images = [],
      isPublic = true,
      displayNameType = 'fullname',
      subcategory,
      availabilityDate,
      isFutureProduct = false,
    } = body || {};

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

    // Check if user has seller roles or is a seller
    const isSeller = user.role === 'SELLER' || 
                     user.sellerRoles?.length > 0 || 
                     !!user.SellerProfile;

    if (!isSeller) {
      return NextResponse.json({ 
        error: 'Geen verkopersprofiel gevonden. Je moet eerst registreren als verkoper in je profielinstellingen.' 
      }, { status: 400 });
    }

    // If user has seller roles but no SellerProfile, create one
    let sellerProfileId = user.SellerProfile?.id;
    
    if (!sellerProfileId && (user.role === 'SELLER' || user.sellerRoles?.length > 0)) {

      const crypto = require('crypto');
      const newSellerProfile = await prisma.sellerProfile.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          displayName: user.name || user.username || 'Mijn Bedrijf',
          bio: 'Verkoop via HomeCheff',
          deliveryMode: 'FIXED',
          deliveryRadius: 5
        }
      });
      
      sellerProfileId = newSellerProfile.id;

    }

    const cat = CATEGORY_MAP[category] ?? 'CHEFF';
    const delivery = DELIVERY_MAP[deliveryMode] ?? 'PICKUP';

    // Create Product (not Listing)
    const result = await prisma.product.create({
      data: {
        id: crypto.randomUUID(),
        title,
        description,
        priceCents: Number(priceCents),
        category: cat as any,
        unit: 'PORTION', // Default unit
        delivery: delivery as any,
        isActive: Boolean(isPublic),
        displayNameType: displayNameType === 'firstname' ? 'first' : 
                        displayNameType === 'lastname' ? 'last' : 
                        displayNameType === 'username' ? 'username' : 'full',
        subcategory: subcategory || null,
        availabilityDate: availabilityDate ? new Date(availabilityDate) : null,
        isFutureProduct: Boolean(isFutureProduct),
        sellerId: sellerProfileId!,
        Image: {
          create: images.map((url: string, i: number) => ({
            id: crypto.randomUUID(),
            fileUrl: url,
            sortOrder: i,
          })),
        },
      },
      include: {
        Image: true,
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

    return NextResponse.json({ ok: true, item: result }, { status: 201 });
  } catch (err: any) {
    console.error('Create product failed:', err);
    return NextResponse.json({ error: err?.message || 'Serverfout' }, { status: 500 });
  }
}
