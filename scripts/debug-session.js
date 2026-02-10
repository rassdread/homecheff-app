const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugSession() {
  try {
    // Check all users and their conversation counts
    const usersWithConversations = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        _count: {
          select: {
            ConversationParticipant: true
          }
        }
      },
      orderBy: {
        ConversationParticipant: {
          _count: 'desc'
        }
      }
    });

    usersWithConversations.forEach((user, index) => {
    });

    // Check if there are any active conversations
    const activeConversations = await prisma.conversation.findMany({
      where: {
        isActive: true
      },
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
          take: 1,
          orderBy: { createdAt: 'desc' },
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
    });

    activeConversations.forEach((conv, index) => {
      conv.ConversationParticipant.forEach((p, i) => {
      });
      if (conv.Message.length > 0) {
        const msg = conv.Message[0];
      }
    });

    // Check inactive conversations too
    const inactiveConversations = await prisma.conversation.findMany({
      where: {
        isActive: false
      },
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
        }
      }
    });
    inactiveConversations.forEach((conv, index) => {
    });

    // Test the exact API query for Sergio
    const sergioUser = await prisma.user.findUnique({
      where: { email: 'sergio@homecheff.eu' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        ConversationParticipant: {
          select: {
            Conversation: {
              select: {
                id: true,
                title: true,
                lastMessageAt: true,
                isActive: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (sergioUser) {
      sergioUser.ConversationParticipant.forEach((p, i) => {
        const conv = p.Conversation;
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSession();
