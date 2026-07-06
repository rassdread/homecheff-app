import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import {
  discoveryEnrichmentFromBundle,
  fetchSellerTrustBundles,
  mapProductToDiscoveryReadModel,
} from "@/lib/discovery";
import { fetchAuthorBadgeSummariesByUserIds } from "@/lib/gamification/author-badge-summaries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let user;
    
    if (userId) {
      // Get user by ID for public profile
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, username: true }
      });
    } else {
      // Get current user for private profile
      // NextAuth v5
      try {
        const mod: any = await import("@/lib/auth");
        const session = await mod.auth?.();
        const email: string | undefined = session?.user?.email || undefined;
        if (email) {
          user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, username: true }
          });
        }
      } catch {}
      
      // NextAuth v4 fallback
      if (!user) {
        try {
          const { getServerSession } = await import("next-auth");
          const { authOptions } = await import("@/lib/auth");
          const session = await getServerSession(authOptions as any);
          const email: string | undefined = (session as any)?.user?.email;
          if (email) {
            user = await prisma.user.findUnique({
              where: { email },
              select: { id: true, name: true, username: true }
            });
          }
        } catch {}
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get seller profile
    let sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    // If no sellerProfile exists, create one automatically
    // This ensures admin users (or other users) who have products can see them
    if (!sellerProfile) {
      const crypto = require('crypto');
      try {
        sellerProfile = await prisma.sellerProfile.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            displayName: user.name || user.username || 'Mijn Bedrijf',
            bio: 'Verkoop via HomeCheff',
            deliveryMode: 'FIXED',
            deliveryRadius: 5
          },
          select: { id: true }
        });
      } catch (error) {
        // If creation fails (e.g., already exists or constraint violation), try to find it again
        sellerProfile = await prisma.sellerProfile.findUnique({
          where: { userId: user.id },
          select: { id: true }
        });
        
        // If still no sellerProfile after error, return empty array
        if (!sellerProfile) {
          return NextResponse.json({ products: [] });
        }
      }
    }

    // Get products - include both active and inactive products
    // Inactive products with orders should still be visible on seller's profile
    const products = await prisma.product.findMany({
      where: { 
        sellerId: sellerProfile.id,
        // Show all products (active and inactive) on seller's own profile
      },
      include: {
        Image: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform products to match expected format
    const productIds = products.map((p) => p.id);
    const reviewCounts =
      productIds.length > 0
        ? await prisma.productReview.groupBy({
            by: ['productId'],
            where: {
              productId: { in: productIds },
              reviewSubmittedAt: { not: null },
              rating: { gt: 0 },
            },
            _count: { id: true },
          })
        : [];
    const reviewCountMap = new Map<string, number>();
    for (const row of reviewCounts) {
      reviewCountMap.set(row.productId, row._count.id);
    }

    const badgeMap = await fetchAuthorBadgeSummariesByUserIds([user.id], 2);
    const trustBundles = await fetchSellerTrustBundles([user.id], badgeMap);
    const trustBundle = trustBundles.get(user.id);

    const transformedProducts = products.map(product => {
      const row = {
      id: product.id,
      title: product.title,
      description: product.description,
      priceCents: product.priceCents,
      image: product.Image?.[0]?.fileUrl || null,
      Image: product.Image,
      createdAt: product.createdAt,
      category: product.category,
      marketplaceCategory: product.marketplaceCategory ?? null,
      specializations: product.specializations ?? [],
      listingIntent: product.listingIntent ?? null,
      barterOpenness: product.barterOpenness ?? null,
      acceptedSpecializations: product.acceptedSpecializations ?? [],
      subcategory: product.subcategory,
      delivery: product.delivery,
      stock: product.stock,
      maxStock: product.maxStock,
      isActive: product.isActive,
    };
      return {
        ...row,
        discovery: mapProductToDiscoveryReadModel(row, {
          ...discoveryEnrichmentFromBundle(trustBundle, {
            productReviewCount: reviewCountMap.get(product.id) || 0,
            listingIsActive: product.isActive !== false,
          }),
        }),
      };
    });

    return NextResponse.json({ products: transformedProducts });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}