import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCorsHeaders } from '@/lib/apiCors';

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ items: [] }, { headers: cors });
    }

    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email! }, 
      select: { id: true } 
    });
    if (!user) return NextResponse.json({ items: [] }, { headers: cors });

    const items = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        Listing: {
          select: {
            id: true,
            title: true,
            priceCents: true,
            description: true,
            category: true,
            status: true,
            place: true,
            lat: true,
            lng: true,
            isPublic: true,
            viewCount: true,
            createdAt: true,
            updatedAt: true
          }
        },
        Product: {
          select: {
            id: true,
            title: true,
            priceCents: true,
            description: true,
            category: true,
            unit: true,
            delivery: true,
            createdAt: true,
            isActive: true,
            Image: {
              select: {
                id: true,
                fileUrl: true,
                sortOrder: true
              },
              orderBy: {
                sortOrder: 'asc'
              },
              take: 1
            }
          }
        },
        Dish: {
          select: {
            id: true,
            title: true,
            description: true,
            priceCents: true,
            category: true,
            subcategory: true,
            status: true,
            createdAt: true,
            photos: {
              select: { id: true, url: true, idx: true, isMain: true },
              orderBy: { idx: 'asc' },
              take: 1
            }
          }
        }
      }
    });
    
    return NextResponse.json({ items }, { headers: cors });
  } catch (e) {
    console.error("Error in /api/profile/favorites:", e);
    return NextResponse.json({ items: [] }, { headers: cors });
  }
}
