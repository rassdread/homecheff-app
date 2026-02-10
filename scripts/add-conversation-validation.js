const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addConversationValidation() {
  console.log('🔒 Adding conversation validation and watermarking...');

  // Get all conversations with their participants and messages
  const conversations = await prisma.conversation.findMany({
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

  console.log(`\n📊 Found ${conversations.length} conversations to validate\n`);

  let validConversations = 0;
  let issuesFound = 0;
  let fixedCount = 0;

  for (const conv of conversations) {
    const participantIds = conv.ConversationParticipant.map(p => p.userId);
    const participantNames = conv.ConversationParticipant.map(p => 
      p.User.username || p.User.name || p.User.email
    ).join(' & ');

    console.log(`\n--- Conversation: ${conv.id} ---`);
    console.log(`📋 Title: ${conv.title || 'N/A'}`);
    console.log(`👥 Participants (${participantIds.length}): ${participantNames}`);

    // Check all messages are from valid participants
    const invalidMessages = conv.Message.filter(
      msg => !participantIds.includes(msg.senderId)
    );

    if (invalidMessages.length > 0) {
      console.log(`⚠️  Found ${invalidMessages.length} messages from non-participants:`);
      
      // Get unique sender IDs that need to be added as participants
      const orphanSenders = [...new Set(invalidMessages.map(msg => msg.senderId))];
      
      for (const senderId of orphanSenders) {
        const senderMessages = invalidMessages.filter(msg => msg.senderId === senderId);
        const senderName = senderMessages[0].User?.username || senderMessages[0].User?.name || senderMessages[0].User?.email || 'Unknown';
        console.log(`   - Message from: ${senderName} (${senderId})`);
        console.log(`     ${senderMessages.length} message(s) found`);
        console.log(`     🔧 FIXING: Adding ${senderName} as participant...`);
        
        // Check if participant already exists (race condition check)
        const existingParticipant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId: conv.id,
            userId: senderId
          }
        });
        
        if (!existingParticipant) {
          // Add missing participant
          await prisma.conversationParticipant.create({
            data: {
              id: `auto-fix-${conv.id}-${senderId}`,
              conversationId: conv.id,
              userId: senderId,
              joinedAt: new Date(),
              lastSeen: new Date(),
              isHidden: false
            }
          });
          console.log(`     ✅ Added ${senderName} as participant`);
          fixedCount++;
        } else {
          console.log(`     ℹ️  Participant already exists (race condition resolved)`);
        }
      }
      
      issuesFound++;
    } else {
      console.log(`✅ All ${conv.Message.length} messages are from valid participants`);
      validConversations++;
    }

    // Generate conversation "watermark" (hash of sorted participant IDs)
    const watermark = participantIds.sort().join('-');
    console.log(`🔖 Conversation Watermark: ${watermark}`);

    // Check if conversation title matches participants
    const expectedTitle = participantNames;
    if (conv.title && conv.title !== expectedTitle) {
      console.log(`⚠️  Title mismatch:`);
      console.log(`   Current: "${conv.title}"`);
      console.log(`   Expected: "${expectedTitle}"`);
      console.log(`   🔧 FIXING: Updating title...`);
      
      // Update title to match participants
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { title: expectedTitle }
      });
      console.log(`   ✅ Title updated`);
    }
  }

  console.log(`\n\n📊 VALIDATION SUMMARY:`);
  console.log(`✅ Valid conversations: ${validConversations}`);
  console.log(`⚠️  Conversations with issues: ${issuesFound}`);
  console.log(`🔧 Participants fixed: ${fixedCount}`);
  console.log(`📦 Total conversations: ${conversations.length}`);

  if (issuesFound > 0) {
    console.log(`\n✅ FIXED: ${fixedCount} missing participants have been added!`);
    console.log(`   All conversations are now WATERDICHT with correct participant-message coupling.`);
  } else {
    console.log(`\n🎉 All conversations are WATERDICHT! No data integrity issues found.`);
  }

  // Create a validation report
  const report = {
    timestamp: new Date().toISOString(),
    totalConversations: conversations.length,
    validConversations,
    conversationsWithIssues: issuesFound,
    status: issuesFound === 0 ? 'WATERDICHT' : 'ISSUES_FOUND'
  };

  console.log(`\n📄 Validation Report:`);
  console.log(JSON.stringify(report, null, 2));

  return report;
}

addConversationValidation()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

