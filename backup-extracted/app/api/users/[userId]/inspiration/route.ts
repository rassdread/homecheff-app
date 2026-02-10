import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { userId } = params;

    // Check if user is requesting their own data or if it's public data
    const isOwnProfile = session?.user?.email && 
      await prisma.user.findFirst({
        where: { 
          id: userId,
          email: session.user.email 
        }
      });

    // Build where clause - show only published items for public view
    const where: any = {
      userId: userId,
    };

    // If not own profile, only show published items
    if (!isOwnProfile) {
      where.status = 'PUBLISHED';
    }

    // Fetch inspiration items (Dish model)
    const items = await prisma.dish.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    // Get view counts, props counts, and review counts for each item
    const itemIds = items.map(item => item.id);
    
    const [viewCounts, reviewCounts] = await Promise.all([
      // View counts
      prisma.analyticsEvent.groupBy({
        by: ['entityId'],
        where: {
          entityId: { in: itemIds },
          eventType: 'VIEW',
          entityType: 'DISH',
        },
        _count: {
          entityId: true,
        },
      }),
      // Review counts for inspiration items
      prisma.productReview.groupBy({
        by: ['dishId'],
        where: {
          dishId: { in: itemIds }
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

    const reviewCountMap = new Map();
    reviewCounts.forEach(item => {
      reviewCountMap.set(item.dishId, item._count.dishId);
    });

    // Transform to consistent format
    const transformedItems = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      subcategory: item.subcategory,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      viewCount: viewCountMap.get(item.id) || 0,
      propsCount: 0, // Props system to be implemented
      reviewCount: reviewCountMap.get(item.id) || 0,
      user: {
        id: item.user.id,
        name: item.user.name,
        username: item.user.username,
        profileImage: item.user.image,
        displayFullName: item.user.displayFullName,
        displayNameOption: item.user.displayNameOption,
      },
      photos: item.photos.map((photo) => ({
        id: photo.id,
        url: photo.url,
        isMain: photo.idx === 0,
      })),
    }));

    return NextResponse.json({
      items: transformedItems,
      total: transformedItems.length,
    });
  } catch (error) {
    console.error('❌ Error fetching user inspiration items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspiration items' },
      { status: 500 }
    );
  }
}



