import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all products (no filters)
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        isActive: true,
        priceCents: true,
        category: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            User: {
              select: {
                id: true,
                username: true,
                stripeConnectAccountId: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const summary = {
      total: allProducts.length,
      active: allProducts.filter(p => p.isActive).length,
      inactive: allProducts.filter(p => !p.isActive).length,
      withPrice: allProducts.filter(p => p.priceCents && p.priceCents > 0).length,
      withoutPrice: allProducts.filter(p => !p.priceCents || p.priceCents === 0).length,
      withSeller: allProducts.filter(p => p.seller).length,
      withoutSeller: allProducts.filter(p => !p.seller).length,
      products: allProducts.map(p => ({
        id: p.id,
        title: p.title,
        isActive: p.isActive,
        priceCents: p.priceCents,
        category: p.category,
        hasSeller: !!p.seller,
        hasStripeAccount: !!p.seller?.User?.stripeConnectAccountId,
        createdAt: p.createdAt
      }))
    };

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug info', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}







