import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Haal review count en gemiddelde rating op voor een inspiratie item
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if dish exists
    const dish = await prisma.dish.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!dish) {
      return NextResponse.json({ error: 'Inspiratie item niet gevonden' }, { status: 404 });
    }

    // Get review count and average rating - gracefully handle if table doesn't exist
    const [count, avgRating] = await Promise.all([
      prisma.dishReview.count({
        where: { dishId: id }
      }).catch(() => 0),
      prisma.dishReview.aggregate({
        where: { dishId: id },
        _avg: { rating: true }
      }).catch(() => ({ _avg: { rating: null } }))
    ]);

    return NextResponse.json({
      count,
      averageRating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : 0
    });
  } catch (error) {
    console.error('Error fetching dish review count:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


