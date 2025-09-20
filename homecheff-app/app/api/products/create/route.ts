
import { NextResponse } from 'next/server';
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
    } = body || {};

    if (!title || !description || !priceCents || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Ontbrekende velden' }, { status: 400 });
    }

    // Get user's seller profile
    const user = await prisma.user.findUnique({
      where: { id: (session?.user as any)?.id },
      include: { SellerProfile: true }
    });

    if (!user?.SellerProfile) {
      return NextResponse.json({ error: 'Geen verkopersprofiel gevonden. Registreer eerst als verkoper.' }, { status: 400 });
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
        displayNameType,
        sellerId: user.SellerProfile.id,
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

    return NextResponse.json({ ok: true, item: result }, { status: 201 });
  } catch (err: any) {
    console.error('Create product failed:', err);
    return NextResponse.json({ error: err?.message || 'Serverfout' }, { status: 500 });
  }
}
