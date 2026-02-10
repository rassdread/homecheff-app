import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geocoding';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    const { searchParams } = new URL(req.url);
    
    const userId = (session as any)?.user?.id || searchParams.get('userId');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    const recommendations: any[] = [];

    // 1. Trending products (most viewed in last 7 days)
    const trendingProducts = await prisma.analyticsEvent.groupBy({
      by: ['entityId'],
      where: {
        eventType: 'VIEW',
        entityType: 'PRODUCT',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      _count: { entityId: true },
      orderBy: { _count: { entityId: 'desc' } },
      take: 10,
    });

    if (trendingProducts.length > 0) {
      const trendingProductIds = trendingProducts.map(p => p.entityId);
      const trendingProductsData = await prisma.product.findMany({
        where: {
          id: { in: trendingProductIds },
          isActive: true,
        },
        include: {
          seller: {
            include: {
              User: { select: { name: true, profileImage: true } },
            },
          },
          Image: { select: { fileUrl: true }, take: 1 },
        },
        take: 8,
      });

      recommendations.push({
        id: 'trending_1',
        type: 'trending',
        title: 'Trending in Nederland',
        description: 'Populaire producten die anderen ook bekijken',
        confidence: 0.85,
        reason: 'Gebaseerd op bekijkgedrag van alle gebruikers',
        products: trendingProductsData.map(product => ({
          id: product.id,
          title: product.title,
          description: product.description,
          priceCents: product.priceCents,
          image: product.Image[0]?.fileUrl,
          category: product.category,
          createdAt: product.createdAt,
          seller: {
            name: 'Verkoper',
            followerCount: 0,
          },
        })),
      });
    }

    // 2. Nearby products (if location provided)
    if (lat && lng && userId) {
      const userLat = Number(lat);
      const userLng = Number(lng);
      const radius = 10; // 10km radius

      const nearbyProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          seller: {
            lat: {
              gte: userLat - (radius / 111.32),
              lte: userLat + (radius / 111.32),
            },
            lng: {
              gte: userLng - (radius / (111.32 * Math.cos((userLat * Math.PI) / 180))),
              lte: userLng + (radius / (111.32 * Math.cos((userLat * Math.PI) / 180))),
            },
          },
        },
        include: {
          seller: {
            include: {
              User: { select: { name: true, profileImage: true } },
            },
          },
          Image: { select: { fileUrl: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      });

      if (nearbyProducts.length > 0) {
        recommendations.push({
          id: 'nearby_1',
          type: 'nearby',
          title: 'Dichtbij jou',
          description: `Producten binnen ${radius}km van jouw locatie`,
          confidence: 0.92,
          reason: 'Gebaseerd op jouw locatie',
          products: nearbyProducts.map(product => ({
            id: product.id,
            title: product.title,
            description: product.description,
            priceCents: product.priceCents,
            image: product.Image[0]?.fileUrl,
            category: product.category,
            createdAt: product.createdAt,
            location: {
              place: 'Lokaal',
              distanceKm: Math.round(calculateDistance(userLat, userLng, product.seller?.lat || 0, product.seller?.lng || 0) * 10) / 10,
            },
            seller: {
              name: 'Verkoper',
              followerCount: 0,
            },
          })),
        });
      }
    }

    // 3. Similar products based on user's favorite categories
    if (userId) {
      // Get user's most viewed categories
      const userViews = await prisma.analyticsEvent.findMany({
        where: {
          eventType: 'VIEW',
          entityType: 'PRODUCT',
          userId: userId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
      });

      const categoryCounts = userViews.reduce((acc, view) => {
        const category = 'FOOD'; // Mock category for now
        if (category) {
          acc[category] = (acc[category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topCategory = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0];

      if (topCategory) {
        const similarProducts = await prisma.product.findMany({
          where: {
            isActive: true,
            category: topCategory as any,
          },
          include: {
            seller: {
              include: {
                User: { select: { name: true, profileImage: true } },
              },
            },
            Image: { select: { fileUrl: true }, take: 1 },
          },
          orderBy: { createdAt: 'desc' },
          take: 8,
        });

        if (similarProducts.length > 0) {
          recommendations.push({
            id: 'similar_1',
            type: 'similar',
            title: 'Vergelijkbare smaak',
            description: `Meer ${topCategory.toLowerCase()} producten zoals jij leuk vindt`,
            confidence: 0.78,
            reason: 'Gebaseerd op jouw browsegeschiedenis',
            products: similarProducts.map(product => ({
              id: product.id,
              title: product.title,
              description: product.description,
              priceCents: product.priceCents,
              image: product.Image[0]?.fileUrl,
              category: product.category,
              createdAt: product.createdAt,
              seller: {
                name: 'Verkoper',
                followerCount: 0,
              },
            })),
          });
        }
      }
    }

    // 4. New sellers (sellers with first products)
    const newSellers = await prisma.sellerProfile.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      },
      include: {
        User: { select: { name: true, profileImage: true } },
        products: {
          where: { isActive: true },
          include: {
            Image: { select: { fileUrl: true }, take: 1 },
          },
          take: 1,
        },
      },
      take: 8,
    });

    const newSellerProducts = newSellers
      .filter(seller => seller.products.length > 0)
      .map(seller => seller.products[0]);

    if (newSellerProducts.length > 0) {
      recommendations.push({
        id: 'new_sellers_1',
        type: 'new_seller',
        title: 'Nieuwe verkopers',
        description: 'Ontdek producten van nieuwe verkopers op het platform',
        confidence: 0.88,
        reason: 'Nieuwe verkopers die net zijn begonnen',
        products: newSellerProducts.map(product => ({
          id: product.id,
          title: product.title,
          description: product.description,
          priceCents: product.priceCents,
          image: product.Image[0]?.fileUrl,
          category: product.category,
          createdAt: product.createdAt,
          seller: {
            name: 'Verkoper',
            followerCount: 0,
          },
        })),
      });
    }

    return NextResponse.json({
      recommendations: recommendations.slice(0, 4), // Limit to 4 recommendations
      userId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating smart recommendations:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
