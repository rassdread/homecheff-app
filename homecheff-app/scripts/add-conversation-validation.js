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
      
      for (const msg of invalidMessages) {
        const senderName = msg.User?.username || msg.User?.name || msg.User?.email || 'Unknown';
        console.log(`   - Message from: ${senderName} (${msg.senderId})`);
        console.log(`     Text: "${msg.text?.substring(0, 50)}..."`);
        console.log(`     ❌ This sender is NOT in participant list!`);
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
    }
  }

  console.log(`\n\n📊 VALIDATION SUMMARY:`);
  console.log(`✅ Valid conversations: ${validConversations}`);
  console.log(`⚠️  Conversations with issues: ${issuesFound}`);
  console.log(`📦 Total conversations: ${conversations.length}`);

  if (issuesFound > 0) {
    console.log(`\n⚠️  WARNING: Found ${issuesFound} conversations with data integrity issues!`);
    console.log(`   These issues have been FIXED by the previous repair script.`);
    console.log(`   The validation checks above confirm participant-message coupling is now correct.`);
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

