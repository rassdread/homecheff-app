
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Pas deze mappings aan als jouw Prisma enums anders heten:
const CATEGORY_MAP: Record<string, any> = {
  CHEFF: 'CHEFF',
  GARDEN: 'GARDEN',
  DESIGNER: 'DESIGNER',
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
      images = [],
      isPublic = true,
    } = body || {};

    if (!title || !description || !priceCents || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Ontbrekende velden' }, { status: 400 });
    }

    const cat = CATEGORY_MAP[category] ?? CATEGORY_MAP.CHEFF;

    // Probeer Listing aan te maken (met ListingMedia)
    const result = await prisma.listing.create({
      data: {
        id: crypto.randomUUID(),
        title,
        description,
        priceCents: Number(priceCents),
        isPublic: Boolean(isPublic),
        category: cat as any,
        ownerId: (session?.user as any)?.id as string,
        updatedAt: new Date(),
        ListingMedia: {
          create: images.map((url: string, i: number) => ({
            id: crypto.randomUUID(),
            url,
            order: i,
          })),
        },
      },
      include: {
        ListingMedia: true,
      },
    });

    return NextResponse.json({ ok: true, item: result }, { status: 201 });
  } catch (err: any) {
    console.error('Create product failed:', err);
    return NextResponse.json({ error: err?.message || 'Serverfout' }, { status: 500 });
  }
}
