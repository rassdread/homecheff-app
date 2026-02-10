import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const sortBy = searchParams.get('sortBy') || 'newest';

    // Build where clause
    const where: any = {
      status: 'PUBLISHED', // Only show published items
    };

    // Filter by category if specified
    if (category && category !== 'all') {
      where.category = category;
    }

    // Filter by subcategory if specified
    if (subcategory) {
      where.subcategory = subcategory;
    }

    // Fetch Dish items (old model) with view counts
    const dishes = await prisma.dish.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        subcategory: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            displayFullName: true,
            displayNameOption: true,
          },
        },
        photos: {
          select: {
            id: true,
            url: true,
            idx: true,
          },
          orderBy: {
            idx: 'asc',
          },
        },
      },
      orderBy: sortBy === 'newest' ? { createdAt: 'desc' } : { createdAt: 'desc' }, // TODO: add popularity sort
      take: 100,
    });

    // Get view counts, props counts, and review counts for each dish
    const dishIds = dishes.map(dish => dish.id);
    
    const [viewCounts, propsCounts, reviewCounts] = await Promise.all([
      // View counts
      prisma.analyticsEvent.groupBy({
        by: ['entityId'],
        where: {
          entityId: { in: dishIds },
          eventType: 'VIEW',
          entityType: 'DISH',
        },
        _count: {
          entityId: true,
        },
      }),
      // Props counts - use favorites for now (props system to be implemented)
      Promise.resolve([]),
      // Review counts for inspiration items
      prisma.productReview.groupBy({
        by: ['dishId'],
        where: {
          dishId: { in: dishIds }
        },
        _count: {
          dishId: true
        }
      })
    ]);

    // Create maps for counts
    const viewCountMap = new Map();
    viewCounts.forEach(item => {
      viewCountMap.set(item.entityId, item._count.entityId);
    });

    const propsCountMap = new Map();
    // Props system to be implemented - for now return 0

    const reviewCountMap = new Map();
    reviewCounts.forEach(item => {
      reviewCountMap.set(item.dishId, item._count.dishId);
    });

    // Transform to consistent format
    const items = dishes.map((dish) => ({
      id: dish.id,
      title: dish.title,
      description: dish.description,
      category: dish.category,
      subcategory: dish.subcategory,
      status: dish.status,
      createdAt: dish.createdAt.toISOString(),
      viewCount: viewCountMap.get(dish.id) || 0,
      propsCount: 0, // Props system to be implemented
      reviewCount: reviewCountMap.get(dish.id) || 0,
      user: {
        id: dish.user.id,
        name: dish.user.name,
        username: dish.user.username,
        profileImage: dish.user.image,
        displayFullName: dish.user.displayFullName,
        displayNameOption: dish.user.displayNameOption,
      },
      photos: dish.photos.map((photo) => ({
        id: photo.id,
        url: photo.url,
        isMain: photo.idx === 0,
      })),
      videos: [],
    }));
    return NextResponse.json({
      items,
      total: items.length,
    });
  } catch (error) {
    console.error('❌ Error fetching inspiration items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspiration items' },
      { status: 500 }
    );
  }
}

