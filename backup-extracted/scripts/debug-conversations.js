const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugConversations() {
  try {
    // 1. Find conversations with multiple participants but wrong message attribution
    const conversationsWithIssues = await prisma.conversation.findMany({
      include: {
        ConversationParticipant: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true
              }
            }
          }
        },
        Message: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
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
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 10
    });

    conversationsWithIssues.forEach((conv, index) => {
      conv.ConversationParticipant.forEach((participant, pIndex) => {
      });
      conv.Message.forEach((message, mIndex) => {
      });

      // Check for mismatches
      const participantIds = conv.ConversationParticipant.map(p => p.User.id);
      const messageSenderIds = conv.Message.map(m => m.User.id);
      const unknownSenders = messageSenderIds.filter(id => !participantIds.includes(id));
      
      if (unknownSenders.length > 0) {
      }
    });

    // 2. Check for duplicate conversations between same users
    const allParticipants = await prisma.conversationParticipant.findMany({
      include: {
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
            title: true,
            isActive: true,
            createdAt: true
          }
        }
      }
    });

    // Group by user pairs
    const userPairs = {};
    allParticipants.forEach(participant => {
      const userId = participant.userId;
      const conversationId = participant.conversationId;
      
      if (!userPairs[userId]) {
        userPairs[userId] = [];
      }
      userPairs[userId].push({
        conversationId,
        conversation: participant.Conversation
      });
    });

    // Check for users with multiple conversations
    Object.entries(userPairs).forEach(([userId, conversations]) => {
      if (conversations.length > 5) { // Users with many conversations
        conversations.forEach(conv => {
        });
      }
    });

    // 3. Check for conversations with wrong message attribution
    const messagesWithIssues = await prisma.message.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        },
        Conversation: {
          include: {
            ConversationParticipant: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    username: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    messagesWithIssues.forEach((message, index) => {
      const participantIds = message.Conversation.ConversationParticipant.map(p => p.User.id);
      const senderIsParticipant = participantIds.includes(message.User.id);
      
      if (!senderIsParticipant) {
      }
    });

    // 4. Summary
    const totalParticipants = await prisma.conversationParticipant.count();
    const totalMessages = await prisma.message.count();
    const totalConversations = await prisma.conversation.count();
  } catch (error) {
    console.error('❌ Error debugging conversations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugConversations();