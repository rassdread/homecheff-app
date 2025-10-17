const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugConversations() {
  console.log('🔍 Debugging conversation issues...\n');

  try {
    // 1. Find conversations with multiple participants but wrong message attribution
    console.log('1. Checking for conversation participant mismatches...');
    
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
      console.log(`\n--- Conversation ${index + 1} (${conv.id}) ---`);
      console.log(`Title: ${conv.title}`);
      console.log(`Active: ${conv.isActive}`);
      console.log(`Created: ${conv.createdAt}`);
      
      console.log('\nParticipants:');
      conv.ConversationParticipant.forEach((participant, pIndex) => {
        console.log(`  ${pIndex + 1}. ${participant.User.name || participant.User.username} (${participant.User.email}) - ID: ${participant.User.id}`);
      });
      
      console.log('\nRecent Messages:');
      conv.Message.forEach((message, mIndex) => {
        console.log(`  ${mIndex + 1}. From: ${message.User.name || message.User.username} (${message.User.email}) - ID: ${message.User.id}`);
        console.log(`     Text: ${message.text?.substring(0, 50)}...`);
        console.log(`     Date: ${message.createdAt}`);
      });

      // Check for mismatches
      const participantIds = conv.ConversationParticipant.map(p => p.User.id);
      const messageSenderIds = conv.Message.map(m => m.User.id);
      const unknownSenders = messageSenderIds.filter(id => !participantIds.includes(id));
      
      if (unknownSenders.length > 0) {
        console.log(`⚠️  MISMATCH: Messages from non-participants: ${unknownSenders}`);
      }
    });

    // 2. Check for duplicate conversations between same users
    console.log('\n\n2. Checking for duplicate conversations...');
    
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
        console.log(`\nUser ${userId} has ${conversations.length} conversations:`);
        conversations.forEach(conv => {
          console.log(`  - ${conv.conversation.id} (${conv.conversation.title}) - Active: ${conv.conversation.isActive}`);
        });
      }
    });

    // 3. Check for conversations with wrong message attribution
    console.log('\n\n3. Checking message attribution issues...');
    
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
        console.log(`\n⚠️  Message ${index + 1}: Sender not in conversation participants`);
        console.log(`   Message ID: ${message.id}`);
        console.log(`   Conversation: ${message.Conversation.id}`);
        console.log(`   Sender: ${message.User.name || message.User.username} (${message.User.id})`);
        console.log(`   Participants: ${message.Conversation.ConversationParticipant.map(p => `${p.User.name || p.User.username} (${p.User.id})`).join(', ')}`);
        console.log(`   Text: ${message.text?.substring(0, 50)}...`);
      }
    });

    // 4. Summary
    console.log('\n\n📊 SUMMARY:');
    console.log(`Total conversations checked: ${conversationsWithIssues.length}`);
    console.log(`Recent messages checked: ${messagesWithIssues.length}`);
    
    const totalParticipants = await prisma.conversationParticipant.count();
    const totalMessages = await prisma.message.count();
    const totalConversations = await prisma.conversation.count();
    
    console.log(`Total conversations in DB: ${totalConversations}`);
    console.log(`Total participants in DB: ${totalParticipants}`);
    console.log(`Total messages in DB: ${totalMessages}`);

  } catch (error) {
    console.error('❌ Error debugging conversations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugConversations();