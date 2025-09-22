import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);

  if (!session || (session as any).user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { days = 7, eventsPerDay = 10 } = await req.json();

    // Get all products and users
    const products = await prisma.product.findMany({
      select: { id: true, title: true, category: true, createdAt: true }
    });

    const users = await prisma.user.findMany({
      where: { role: { not: 'ADMIN' } },
      select: { id: true }
    });

    if (products.length === 0 || users.length === 0) {
      return NextResponse.json({ error: 'No products or users found' }, { status: 400 });
    }

    const events: any[] = [];
    const now = new Date();

    // Generate organic events for the specified number of days
    for (let day = 0; day < days; day++) {
      const eventDate = new Date(now);
      eventDate.setDate(eventDate.getDate() - day);

      for (let i = 0; i < eventsPerDay; i++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const randomUser = users[Math.floor(Math.random() * users.length)];

        // Create event time within the day
        const eventTime = new Date(eventDate);
        eventTime.setHours(Math.floor(Math.random() * 24));
        eventTime.setMinutes(Math.floor(Math.random() * 60));

        // Determine event type based on probability
        const eventTypeRand = Math.random();
        let eventType = 'VIEW';
        
        if (eventTypeRand < 0.7) {
          eventType = 'VIEW';
        } else if (eventTypeRand < 0.85) {
          eventType = 'CLICK';
        } else if (eventTypeRand < 0.95) {
          eventType = 'FAVORITE';
        } else {
          eventType = 'SHARE';
        }

        events.push({
          eventType: eventType,
          entityType: 'PRODUCT',
          entityId: randomProduct.id,
          userId: randomUser.id,
          metadata: {
            category: randomProduct.category,
            source: 'organic',
            day: day,
            productAge: Math.floor((now.getTime() - randomProduct.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          } as any,
          createdAt: eventTime
        } as any);
      }
    }

    // Insert all events
    const result = await prisma.analyticsEvent.createMany({
      data: events,
      skipDuplicates: true
    });

    // Get summary statistics
    const viewCount = events.filter(e => e.eventType === 'VIEW').length;
    const clickCount = events.filter(e => e.eventType === 'CLICK').length;
    const favoriteCount = events.filter(e => e.eventType === 'FAVORITE').length;
    const shareCount = events.filter(e => e.eventType === 'SHARE').length;

    return NextResponse.json({
      success: true,
      generated: result.count,
      summary: {
        views: viewCount,
        clicks: clickCount,
        favorites: favoriteCount,
        shares: shareCount,
        days: days,
        eventsPerDay: eventsPerDay
      }
    });

  } catch (error) {
    console.error('Error generating organic analytics data:', error);
    return NextResponse.json({ error: 'Failed to generate organic analytics data' }, { status: 500 });
  }
}
