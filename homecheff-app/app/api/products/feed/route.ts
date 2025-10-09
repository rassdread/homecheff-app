import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Optimize: return minimal data for feed, paginated
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20'); // Default 20 items
    const skip = (page - 1) * limit;

    console.log(`[Feed API] Fetching page ${page}, limit ${limit}`);

    // Optimized query: only essential fields, with pagination
    const products = await prisma.product.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        priceCents: true,
        category: true,
        subcategory: true,
        delivery: true,
        createdAt: true,
        // Only get first image for feed
        Image: {
          select: {
            id: true,
            fileUrl: true,
            sortOrder: true
          },
          orderBy: { sortOrder: 'asc' },
          take: 1
        },
        seller: {
          select: {
            id: true,
            lat: true,
            lng: true,
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
                displayFullName: true,
                displayNameOption: true,
                place: true,
                city: true
              }
            }
          }
        },
        _count: {
          select: {
            favorites: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip
    });

    // Transform data
    const items = products.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description,
      priceCents: product.priceCents,
      category: product.category,
      subcategory: product.subcategory,
      delivery: product.delivery,
      createdAt: product.createdAt.toISOString(),
      image: product.Image[0]?.fileUrl || null,
      images: product.Image.map(img => img.fileUrl),
      favoriteCount: product._count.favorites,
      location: {
        place: product.seller?.User?.place || null,
        city: product.seller?.User?.city || null,
        lat: product.seller?.lat || null,
        lng: product.seller?.lng || null
      },
      seller: product.seller?.User ? {
        id: product.seller.User.id,
        name: product.seller.User.name,
        username: product.seller.User.username,
        avatar: product.seller.User.profileImage,
        displayFullName: product.seller.User.displayFullName,
        displayNameOption: product.seller.User.displayNameOption
      } : null
    }));

    console.log(`[Feed API] Returning ${items.length} products`);

    return NextResponse.json({ 
      items,
      page,
      hasMore: items.length === limit // If we got full page, there might be more
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });

  } catch (error) {
    console.error('[Feed API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

