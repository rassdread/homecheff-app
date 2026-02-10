import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// In-memory cache for messages (in production, use Redis)
const messageCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;
    const { page = '1', limit = '50' } = Object.fromEntries(req.nextUrl.searchParams);

    // Check cache first
    const cacheKey = `${conversationId}-${page}-${limit}`;
    const cached = messageCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // Add cache headers for client-side caching
      const response = NextResponse.json(cached.data);
      response.headers.set('Cache-Control', 'private, max-age=30');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true } // Only select ID for faster query
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Optimized participant check
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      },
      select: { id: true } // Only select ID
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Super optimized message query - only essential fields
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isEncrypted: false // Skip encrypted messages for speed
        // Note: We don't filter on deletedAt anymore - conversation visibility is handled via isHidden on participant level
      },
      select: {
        id: true,
        text: true,
        messageType: true,
        createdAt: true,
        readAt: true,
        attachmentUrl: true,
        senderId: true,
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
            displayFullName: true,
            displayNameOption: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit), 50), // Cap at 50 for performance
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const responseData = {
      messages: messages.reverse(), // Reverse for chronological order
      hasMore: messages.length === parseInt(limit),
      page: parseInt(page),
      limit: parseInt(limit)
    };

    // Cache the result
    messageCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    // Clean old cache entries
    for (const [key, value] of messageCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL) {
        messageCache.delete(key);
      }
    }

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'private, max-age=30');
    response.headers.set('X-Cache', 'MISS');
    
    return response;

  } catch (error) {
    console.error('Fast messages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
