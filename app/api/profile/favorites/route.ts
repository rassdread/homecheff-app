import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ items: [] });
    }

    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email! }, 
      select: { id: true } 
    });
    if (!user) return NextResponse.json({ items: [] });

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
        }
      }
    });
    
    return NextResponse.json({ items });
  } catch (e) {
    console.error("Error in /api/profile/favorites:", e);
    return NextResponse.json({ items: [] });
  }
}
