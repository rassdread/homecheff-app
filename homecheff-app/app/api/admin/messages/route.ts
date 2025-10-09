import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen admin rechten' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    // Build where clause
    const where: any = {};
    
    if (conversationId) {
      where.conversationId = conversationId;
    }
    
    if (userId) {
      where.OR = [
        { senderId: userId },
        {
          Conversation: {
            ConversationParticipant: {
              some: {
                userId: userId
              }
            }
          }
        }
      ];
    }

    // Get messages with limited information for privacy
    const messages = await prisma.message.findMany({
      where,
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        // Only show message text if not encrypted
        text: true,
        isEncrypted: true,
        // Show metadata but not encrypted content
        createdAt: true,
        readAt: true,
        messageType: true,
        deletedAt: true,
        editedAt: true,
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        },
        Conversation: {
          select: {
            id: true,
            productId: true,
            orderId: true,
            ConversationParticipant: {
              select: {
                userId: true,
                User: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Transform messages to hide encrypted content
    const sanitizedMessages = messages.map(msg => ({
      ...msg,
      text: msg.isEncrypted ? '[VERSLEUTELD BERICHT - Niet leesbaar door admin]' : msg.text
    }));

    const totalCount = await prisma.message.count({ where });

    return NextResponse.json({
      messages: sanitizedMessages,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      notice: 'Versleutelde berichten zijn niet leesbaar, zelfs niet voor admins. Dit beschermt de privacy van gebruikers.'
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het ophalen van berichten' 
    }, { status: 500 });
  }
}

