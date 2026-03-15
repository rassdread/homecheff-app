import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const region = searchParams.get('region');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const takeParam = searchParams.get('take');
    const take = Math.min(Math.max(parseInt(takeParam || '24', 10) || 24, 1), 100);
    const skipParam = searchParams.get('skip');
    const skip = Math.max(parseInt(skipParam || '0', 10) || 0, 0);

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

    // Filter by region (using tags array)
    if (region && region !== 'all') {
      where.tags = {
        has: region // Check if tags array contains the region
      };
    }

    console.log('🔍 Fetching dishes with where clause:', JSON.stringify(where, null, 2));

    // Fetch Dish items (old model) with view counts and location data
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
        tags: true, // Add tags for region filtering
        lat: true, // Add location data
        lng: true,
        place: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            displayFullName: true,
            displayNameOption: true,
            lat: true, // User location as fallback
            lng: true,
            place: true,
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
        videos: {
          select: {
            id: true,
            url: true,
            thumbnail: true,
            duration: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    console.log(`📊 Found ${dishes.length} dishes with status PUBLISHED`);

    // Get view counts and props counts for each dish
    const dishIds = dishes.map(dish => dish.id);
    
    // If no dishes, return empty array early
    if (dishIds.length === 0) {
      console.log('⚠️ No published dishes found, returning empty array');
      return NextResponse.json({ items: [], total: 0 }, { headers: cors });
    }
    
    const [viewCounts, propsCounts, reviewCounts, avgRatings] = await Promise.all([
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
      }).catch(() => []),
      // Props counts (from Favorite table using dishId)
      prisma.favorite.groupBy({
        by: ['dishId'],
        where: {
          dishId: { in: dishIds },
        },
        _count: {
          dishId: true,
        },
      }).catch(() => []),
      // Review counts - gracefully handle if table doesn't exist yet
      prisma.dishReview.groupBy({
        by: ['dishId'],
        where: {
          dishId: { in: dishIds },
        },
        _count: {
          dishId: true,
        },
      }).catch(() => []),
      // Average ratings - gracefully handle if table doesn't exist yet
      prisma.dishReview.groupBy({
        by: ['dishId'],
        where: {
          dishId: { in: dishIds },
        },
        _avg: {
          rating: true,
        },
      }).catch(() => [])
    ]);

    // Create maps for counts
    const viewCountMap = new Map();
    viewCounts.forEach((item: any) => {
      viewCountMap.set(item.entityId, item._count.entityId);
    });

    const propsCountMap = new Map();
    (propsCounts as Array<{ dishId: string; _count: { dishId: number } }>).forEach((item: any) => {
      if (item.dishId) {
        propsCountMap.set(item.dishId, item._count.dishId);
      }
    });

    const reviewCountMap = new Map();
    reviewCounts.forEach((item: any) => {
      reviewCountMap.set(item.dishId, item._count.dishId);
    });

    const avgRatingMap = new Map();
    avgRatings.forEach((item: any) => {
      if (item._avg.rating) {
        avgRatingMap.set(item.dishId, Math.round(item._avg.rating * 10) / 10);
      }
    });

    // Transform to consistent format with location data
    let items = dishes.map((dish) => ({
      id: dish.id,
      title: dish.title,
      description: dish.description,
      category: dish.category,
      subcategory: dish.subcategory,
      status: dish.status,
      tags: dish.tags || [], // Include tags for frontend filtering
      createdAt: dish.createdAt.toISOString(),
      viewCount: viewCountMap.get(dish.id) || 0,
      propsCount: propsCountMap.get(dish.id) || 0,
      reviewCount: reviewCountMap.get(dish.id) || 0,
      averageRating: avgRatingMap.get(dish.id) || 0,
      location: {
        // Use dish location if available, otherwise use user location
        lat: dish.lat ?? dish.user.lat ?? null,
        lng: dish.lng ?? dish.user.lng ?? null,
        place: dish.place ?? dish.user.place ?? null,
      },
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
      // Video volledig uit database: id, url, thumbnail, duration (werkt op desktop + mobiel via video-proxy)
      videos: dish.videos && dish.videos.length > 0 ? dish.videos.map((video) => ({
        id: video.id,
        url: video.url,
        thumbnail: video.thumbnail ?? null,
        duration: video.duration ?? null,
        autoplay: true,
      })) : [],
    }));
    
    // Apply sorting based on sortBy parameter
    if (sortBy === 'popular') {
      items.sort((a, b) => {
        // Calculate popularity score: views + (props * 2) + (reviews * 3) + (rating * 10)
        const aPopularity = a.viewCount + (a.propsCount * 2) + (a.reviewCount * 3) + (a.averageRating * 10);
        const bPopularity = b.viewCount + (b.propsCount * 2) + (b.reviewCount * 3) + (b.averageRating * 10);
        if (aPopularity !== bPopularity) {
          return bPopularity - aPopularity; // Descending
        }
        // If same popularity, sort by newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      // Default to newest (already sorted by createdAt desc from DB)
      items.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    
    return NextResponse.json({ items, total: items.length }, { headers: cors });
  } catch (error) {
    console.error('❌ Error fetching inspiration items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspiration items' },
      { status: 500, headers: cors }
    );
  }
}

