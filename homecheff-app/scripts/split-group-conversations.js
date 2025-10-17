const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function splitGroupConversations() {
  console.log('🔧 Splitting group conversations into 1-on-1 conversations...\n');

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
      console.log(`\n⚠️  Found group conversation: ${conv.id}`);
      console.log(`   Title: ${conv.title}`);
      console.log(`   Participants (${conv.ConversationParticipant.length}):`);
      conv.ConversationParticipant.forEach(p => {
        console.log(`     - ${p.User.username || p.User.name} (${p.User.email})`);
      });
      console.log(`   Messages: ${conv.Message.length}`);

      // Analyze who is talking to whom
      const messagesBySender = {};
      conv.Message.forEach(msg => {
        if (!messagesBySender[msg.senderId]) {
          messagesBySender[msg.senderId] = [];
        }
        messagesBySender[msg.senderId].push(msg);
      });

      console.log(`\n   Message breakdown:`);
      Object.entries(messagesBySender).forEach(([senderId, messages]) => {
        const sender = conv.ConversationParticipant.find(p => p.userId === senderId);
        const senderName = sender?.User.username || sender?.User.name || 'Unknown';
        console.log(`     - ${senderName}: ${messages.length} messages`);
      });

      // Determine correct 1-on-1 pairs
      // Strategy: Find the original 2 participants (first 2), then create separate conv for the 3rd
      const originalParticipants = conv.ConversationParticipant.slice(0, 2);
      const additionalParticipants = conv.ConversationParticipant.slice(2);

      console.log(`\n   📋 Original conversation: ${originalParticipants.map(p => p.User.username || p.User.name).join(' ↔ ')}`);

      // Move messages from additional participants to new conversations
      for (const additionalParticipant of additionalParticipants) {
        const extraUserId = additionalParticipant.userId;
        const extraUserName = additionalParticipant.User.username || additionalParticipant.User.name;

        // Find messages sent by this extra participant
        const messagesFromExtra = conv.Message.filter(m => m.senderId === extraUserId);

        if (messagesFromExtra.length === 0) {
          console.log(`\n   ⏭️  Skipping ${extraUserName} - no messages sent`);
          // Just remove from participants
          await prisma.conversationParticipant.delete({
            where: { id: additionalParticipant.id }
          });
          console.log(`   ✅ Removed ${extraUserName} from conversation`);
          continue;
        }

        // Determine who the extra user was talking to (based on message context)
        // For simplicity, we'll create a conversation with the first original participant
        const otherParticipant = originalParticipants[0];
        const otherUserId = otherParticipant.userId;
        const otherUserName = otherParticipant.User.username || otherParticipant.User.name;

        console.log(`\n   🔀 Creating new conversation: ${extraUserName} ↔ ${otherUserName}`);

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
          console.log(`   ✅ Created new conversation: ${newConv.id}`);
          newConversationsCreated++;
        } else {
          console.log(`   ✅ Using existing conversation: ${newConv.id}`);
        }

        // Move messages from extra user to new conversation
        for (const message of messagesFromExtra) {
          await prisma.message.update({
            where: { id: message.id },
            data: { conversationId: newConv.id }
          });
        }
        console.log(`   📦 Moved ${messagesFromExtra.length} messages to new conversation`);

        // Remove extra participant from original conversation
        await prisma.conversationParticipant.delete({
          where: { id: additionalParticipant.id }
        });
        console.log(`   ✅ Removed ${extraUserName} from original conversation`);
      }

      conversationsSplit++;
      console.log(`\n   ✅ Split complete!`);
    }
  }

  console.log(`\n\n📊 SUMMARY:`);
  console.log(`🔀 Conversations split: ${conversationsSplit}`);
  console.log(`✨ New 1-on-1 conversations created: ${newConversationsCreated}`);
  
  // Verify all conversations now have exactly 2 participants
  const allConversations = await prisma.conversation.findMany({
    include: {
      ConversationParticipant: true
    }
  });

  const invalidConversations = allConversations.filter(c => c.ConversationParticipant.length !== 2);
  
  if (invalidConversations.length > 0) {
    console.log(`\n⚠️  WARNING: ${invalidConversations.length} conversations still have != 2 participants`);
    invalidConversations.forEach(c => {
      console.log(`   - ${c.id}: ${c.ConversationParticipant.length} participants`);
    });
  } else {
    console.log(`\n✅ All conversations are now 1-on-1 (2 participants each)`);
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

