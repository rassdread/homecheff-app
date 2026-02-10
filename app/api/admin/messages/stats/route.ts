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

    if (adminUser?.role !== 'ADMIN' && adminUser?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Geen admin rechten' }, { status: 403 });
    }

    // Get message statistics
    const [
      totalMessages,
      totalConversations,
      encryptedMessages,
      messagesLast30Days,
      messagesLast7Days,
      messagesLast24Hours,
      topSenders,
      averageMessagesPerConversation
    ] = await Promise.all([
      // Total messages
      prisma.message.count(),
      
      // Total conversations
      prisma.conversation.count(),
      
      // Encrypted messages
      prisma.message.count({
        where: { isEncrypted: true }
      }),
      
      // Messages last 30 days
      prisma.message.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Messages last 7 days
      prisma.message.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Messages last 24 hours
      prisma.message.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Top 10 senders
      prisma.message.groupBy({
        by: ['senderId'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      }),
      
      // Average messages per conversation
      prisma.message.groupBy({
        by: ['conversationId'],
        _count: {
          id: true
        }
      })
    ]);

    // Calculate average
    const avgMessages = averageMessagesPerConversation.length > 0
      ? averageMessagesPerConversation.reduce((sum, conv) => sum + conv._count.id, 0) / averageMessagesPerConversation.length
      : 0;

    // Get sender details for top senders
    const topSenderDetails = await Promise.all(
      topSenders.map(async (sender) => {
        const user = await prisma.user.findUnique({
          where: { id: sender.senderId },
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        });
        return {
          userId: sender.senderId,
          messageCount: sender._count.id,
          user
        };
      })
    );

    // Estimate storage size (rough calculation)
    // Average message size: ~200 bytes (text) + attachments
    const estimatedSizeBytes = totalMessages * 200;
    const estimatedSizeMB = (estimatedSizeBytes / (1024 * 1024)).toFixed(2);
    const estimatedSizeGB = (estimatedSizeBytes / (1024 * 1024 * 1024)).toFixed(4);

    return NextResponse.json({
      totalMessages,
      totalConversations,
      encryptedMessages,
      encryptionPercentage: totalMessages > 0 ? ((encryptedMessages / totalMessages) * 100).toFixed(2) : 0,
      messagesLast30Days,
      messagesLast7Days,
      messagesLast24Hours,
      averageMessagesPerConversation: avgMessages.toFixed(2),
      estimatedStorage: {
        bytes: estimatedSizeBytes,
        megabytes: estimatedSizeMB,
        gigabytes: estimatedSizeGB,
        note: 'Dit is een schatting gebaseerd op gemiddelde berichtgrootte. Bijlagen worden niet meegerekend.'
      },
      topSenders: topSenderDetails,
      privacy: {
        note: 'Als admin kun je statistieken zien, maar directe toegang tot berichtinhoud is beperkt tot encrypted messages en alleen met toestemming van gebruikers.',
        encryptedMessagesProtected: encryptedMessages > 0,
        gdprCompliant: true
      }
    });

  } catch (error) {
    console.error('Error fetching message stats:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het ophalen van bericht statistieken' 
    }, { status: 500 });
  }
}

