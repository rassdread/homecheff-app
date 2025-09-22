import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const radius = Number(searchParams.get('radius')) || 10;
    const hours = Number(searchParams.get('hours')) || 24;

    // Get user's last notification check
    const lastCheck = await prisma.analyticsEvent.findFirst({
      where: {
        eventType: 'NOTIFICATION_CHECK',
        userId: (session as any).user.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    const since = lastCheck?.createdAt || new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get user location
    const user = await prisma.user.findUnique({
      where: { id: (session as any).user.id },
      select: { lat: true, lng: true },
    });

    if (!user?.lat || !user?.lng) {
      return NextResponse.json({ 
        newProducts: [], 
        radius, 
        message: 'User location not available' 
      });
    }

    // Find new products in user's area
    const newProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        createdAt: { gte: since },
        seller: {
          lat: {
            gte: user.lat - (radius / 111.32),
            lte: user.lat + (radius / 111.32),
          },
          lng: {
            gte: user.lng - (radius / (111.32 * Math.cos((user.lat * Math.PI) / 180))),
            lte: user.lng + (radius / (111.32 * Math.cos((user.lat * Math.PI) / 180))),
          },
        },
      },
      include: {
        seller: {
          include: {
            User: {
              select: { name: true, profileImage: true },
            },
          },
        },
        Image: {
          select: { fileUrl: true },
          take: 1,
        },
      },
      take: 10,
    });

    // Log this check
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'NOTIFICATION_CHECK',
        entityType: 'USER',
        entityId: (session as any).user.id,
        userId: (session as any).user.id,
        metadata: {
          radius,
          hours,
          newProductsCount: newProducts.length,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      newProducts: newProducts.map(product => ({
        id: product.id,
        title: product.title,
        priceCents: product.priceCents,
        image: product.Image[0]?.fileUrl,
        seller: product.seller?.User?.name,
        createdAt: product.createdAt,
      })),
      radius,
      hours,
      count: newProducts.length,
    });

  } catch (error) {
    console.error('Error checking for new products:', error);
    return NextResponse.json({ error: 'Failed to check for new products' }, { status: 500 });
  }
}
