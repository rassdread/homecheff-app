import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check both old and new models
    const [listings, products] = await Promise.all([
      prisma.listing.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      listings: {
        count: listings.length,
        items: listings
      },
      products: {
        count: products.length,
        items: products
      }
    });
  } catch (error) {
    console.error('Debug products error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}



