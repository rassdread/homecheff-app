import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// In-memory cache for messages (in production, use Redis)
const messageCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 15000; // 15 seconds cache for faster updates

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
    // Check cache first for faster response
    const cacheKey = `${conversationId}-${page}-${limit}`;
    const cached = messageCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const response = NextResponse.json(cached.data);
      response.headers.set('Cache-Control', 'private, max-age=15');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Optimized user lookup - only get ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Optimized participant check - only get ID
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      },
      select: { id: true }
    });
    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // SUPER OPTIMIZED message query - only essential fields, no encryption overhead
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isEncrypted: false, // Skip encrypted messages for speed
        deletedAt: null // Only get non-deleted messages
      },
      select: {
        id: true,
        text: true,
        messageType: true,
        createdAt: true,
        readAt: true,
        deliveredAt: true,
        attachmentUrl: true,
        attachmentName: true,
        attachmentType: true,
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
    // Mark messages as read in background (don't wait for it)
    prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        readAt: null
      },
      data: { readAt: new Date() }
    }).catch(err => console.error('Background read update failed:', err));

    const finalMessages = messages.reverse(); // Reverse for chronological order
    const responseData = {
      messages: finalMessages,
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
    response.headers.set('Cache-Control', 'private, max-age=15');
    response.headers.set('X-Cache', 'MISS');
    
    return response;

  } catch (error) {
    console.error('[Messages API OPTIMIZED] ❌ Critical error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
