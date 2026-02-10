const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function splitGroupConversations() {
  // Find all conversations with more than 2 participants
  const conversations = await prisma.conversation.findMany({
    include: {
      ConversationParticipant: {
        include: {
          User: {
            select: {
              id: true,
              email: true,
              username: true,
              name: true
            }
          }
        }
      },
      Message: {
        include: {
          User: {
            select: {
              id: true,
              email: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      },
      Product: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  let conversationsSplit = 0;
  let newConversationsCreated = 0;

  for (const conv of conversations) {
    if (conv.ConversationParticipant.length > 2) {
      conv.ConversationParticipant.forEach(p => {
      });
      // Analyze who is talking to whom
      const messagesBySender = {};
      conv.Message.forEach(msg => {
        if (!messagesBySender[msg.senderId]) {
          messagesBySender[msg.senderId] = [];
        }
        messagesBySender[msg.senderId].push(msg);
      });
      Object.entries(messagesBySender).forEach(([senderId, messages]) => {
        const sender = conv.ConversationParticipant.find(p => p.userId === senderId);
        const senderName = sender?.User.username || sender?.User.name || 'Unknown';
      });

      // Determine correct 1-on-1 pairs
      // Strategy: Find the original 2 participants (first 2), then create separate conv for the 3rd
      const originalParticipants = conv.ConversationParticipant.slice(0, 2);
      const additionalParticipants = conv.ConversationParticipant.slice(2);
      // Move messages from additional participants to new conversations
      for (const additionalParticipant of additionalParticipants) {
        const extraUserId = additionalParticipant.userId;
        const extraUserName = additionalParticipant.User.username || additionalParticipant.User.name;

        // Find messages sent by this extra participant
        const messagesFromExtra = conv.Message.filter(m => m.senderId === extraUserId);

        if (messagesFromExtra.length === 0) {
          // Just remove from participants
          await prisma.conversationParticipant.delete({
            where: { id: additionalParticipant.id }
          });
          continue;
        }

        // Determine who the extra user was talking to (based on message context)
        // For simplicity, we'll create a conversation with the first original participant
        const otherParticipant = originalParticipants[0];
        const otherUserId = otherParticipant.userId;
        const otherUserName = otherParticipant.User.username || otherParticipant.User.name;
        // Check if a 1-on-1 conversation already exists between these two
        let newConv = await prisma.conversation.findFirst({
          where: {
            AND: [
              {
                ConversationParticipant: {
                  some: { userId: extraUserId }
                }
              },
              {
                ConversationParticipant: {
                  some: { userId: otherUserId }
                }
              }
            ]
          },
          include: {
            ConversationParticipant: true
          }
        });

        // Only use existing if it's exactly 2 participants
        if (newConv && newConv.ConversationParticipant.length !== 2) {
          newConv = null;
        }

        if (!newConv) {
          // Create new 1-on-1 conversation
          newConv = await prisma.conversation.create({
            data: {
              id: `conv-${extraUserId.substring(0, 8)}-${otherUserId.substring(0, 8)}-${Date.now()}`,
              title: `Gesprek met ${otherUserName}`,
              isActive: true,
              lastMessageAt: messagesFromExtra[messagesFromExtra.length - 1].createdAt,
              productId: conv.productId,
              ConversationParticipant: {
                create: [
                  {
                    id: `part-${extraUserId}-${Date.now()}`,
                    userId: extraUserId,
                    joinedAt: new Date(),
                    isHidden: false
                  },
                  {
                    id: `part-${otherUserId}-${Date.now()}`,
                    userId: otherUserId,
                    joinedAt: new Date(),
                    isHidden: false
                  }
                ]
              }
            }
          });
          newConversationsCreated++;
        } else {
        }

        // Move messages from extra user to new conversation
        for (const message of messagesFromExtra) {
          await prisma.message.update({
            where: { id: message.id },
            data: { conversationId: newConv.id }
          });
        }
        // Remove extra participant from original conversation
        await prisma.conversationParticipant.delete({
          where: { id: additionalParticipant.id }
        });
      }

      conversationsSplit++;
    }
  }
  // Verify all conversations now have exactly 2 participants
  const allConversations = await prisma.conversation.findMany({
    include: {
      ConversationParticipant: true
    }
  });

  const invalidConversations = allConversations.filter(c => c.ConversationParticipant.length !== 2);
  
  if (invalidConversations.length > 0) {
    invalidConversations.forEach(c => {
    });
  } else {
  }
}

splitGroupConversations()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

