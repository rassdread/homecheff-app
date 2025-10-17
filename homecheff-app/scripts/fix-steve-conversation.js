const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSteveConversation() {
  console.log('🔧 Fixing Steve Brown conversation issues...');

  const steveId = 'c54bbbcf-1323-4539-8e30-c2a6b7f95662';
  const jasonId = '5f7b9973-cbab-4391-b324-2aba547ec069';
  
  // Find the conversation where Steve's messages are but he's not a participant
  const conversation = await prisma.conversation.findFirst({
    where: {
      ConversationParticipant: {
        some: {
          userId: jasonId
        }
      },
      Message: {
        some: {
          senderId: steveId
        }
      }
    },
    include: {
      ConversationParticipant: true
    }
  });

  if (!conversation) {
    console.log('❌ No problematic conversation found');
    return;
  }

  console.log(`📋 Found conversation: ${conversation.id}`);
  console.log(`📋 Current participants: ${conversation.ConversationParticipant.map(p => p.userId).join(', ')}`);

  // Check if Steve is already a participant
  const steveParticipant = conversation.ConversationParticipant.find(p => p.userId === steveId);
  
  if (!steveParticipant) {
    console.log('👤 Adding Steve as participant...');
    
    // Add Steve as participant
    await prisma.conversationParticipant.create({
      data: {
        id: `steve-${conversation.id}-${steveId}`,
        conversationId: conversation.id,
        userId: steveId,
        joinedAt: new Date(),
        lastSeen: new Date(),
        isHidden: false
      }
    });
    
    console.log('✅ Steve added as participant');
  } else {
    console.log('✅ Steve is already a participant');
  }

  // Check for other conversations with similar issues
  console.log('\n🔍 Checking for other conversation issues...');
  
  const allConversations = await prisma.conversation.findMany({
    include: {
      ConversationParticipant: true,
      Message: {
        select: {
          senderId: true
        }
      }
    }
  });

  let fixedCount = 0;
  for (const conv of allConversations) {
    const participantIds = conv.ConversationParticipant.map(p => p.userId);
    const messageSenderIds = [...new Set(conv.Message.map(m => m.senderId))];
    
    const orphanSenders = messageSenderIds.filter(senderId => !participantIds.includes(senderId));
    
    if (orphanSenders.length > 0) {
      console.log(`⚠️  Conversation ${conv.id} has messages from non-participants: ${orphanSenders.join(', ')}`);
      
      // Add missing participants
      for (const senderId of orphanSenders) {
        const existingParticipant = conv.ConversationParticipant.find(p => p.userId === senderId);
        if (!existingParticipant) {
          await prisma.conversationParticipant.create({
            data: {
              id: `auto-${conv.id}-${senderId}`,
              conversationId: conv.id,
              userId: senderId,
              joinedAt: new Date(),
              lastSeen: new Date(),
              isHidden: false
            }
          });
          console.log(`✅ Added participant ${senderId} to conversation ${conv.id}`);
          fixedCount++;
        }
      }
    }
  }

  console.log(`\n🎉 Fixed ${fixedCount} participant issues`);
  console.log('✨ Steve should now see his conversation with Jason!');
}

fixSteveConversation()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
