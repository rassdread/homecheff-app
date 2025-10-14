import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    console.log('[Admin Messages API] Fetching all conversations...');

    // Fetch all conversations with metadata
    // Note: Admin sees ALL conversations, including hidden ones (for moderation)
    const conversations = await prisma.conversation.findMany({
      select: {
        id: true,
        title: true,
        isActive: true,
        createdAt: true,
        lastMessageAt: true,
        Product: {
          select: {
            id: true,
            title: true
          }
        },
        ConversationParticipant: {
          select: {
            isHidden: true,
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true
              }
            }
          }
        },
        Message: {
          select: {
            id: true,
            text: true,
            isEncrypted: true,
            createdAt: true,
            User: {
              select: {
                name: true,
                username: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            Message: true
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    // Transform conversations with encryption info
    const conversationSummaries = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      isActive: conv.isActive,
      createdAt: conv.createdAt,
      lastMessageAt: conv.lastMessageAt,
      messageCount: conv._count.Message,
      // Check if conversation has encrypted messages
      isEncrypted: conv.Message.length > 0 && conv.Message[0].isEncrypted,
      participants: conv.ConversationParticipant.map(p => p.User),
      product: conv.Product,
      lastMessage: conv.Message[0] ? {
        text: conv.Message[0].isEncrypted ? '[VERSLEUTELD]' : conv.Message[0].text,
        createdAt: conv.Message[0].createdAt,
        isEncrypted: conv.Message[0].isEncrypted,
        sender: conv.Message[0].User
      } : null
    }));

    console.log('[Admin Messages API] Returning:', {
      count: conversationSummaries.length,
      encrypted: conversationSummaries.filter(c => c.isEncrypted).length,
      plaintext: conversationSummaries.filter(c => !c.isEncrypted).length
    });

    return NextResponse.json({ conversations: conversationSummaries });

  } catch (error) {
    console.error('[Admin Messages API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
