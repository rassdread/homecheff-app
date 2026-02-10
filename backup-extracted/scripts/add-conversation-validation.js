const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addConversationValidation() {
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
  let validConversations = 0;
  let issuesFound = 0;

  for (const conv of conversations) {
    const participantIds = conv.ConversationParticipant.map(p => p.userId);
    const participantNames = conv.ConversationParticipant.map(p => 
      p.User.username || p.User.name || p.User.email
    ).join(' & ');
    // Check all messages are from valid participants
    const invalidMessages = conv.Message.filter(
      msg => !participantIds.includes(msg.senderId)
    );

    if (invalidMessages.length > 0) {
      for (const msg of invalidMessages) {
        const senderName = msg.User?.username || msg.User?.name || msg.User?.email || 'Unknown';
      }
      
      issuesFound++;
    } else {
      validConversations++;
    }

    // Generate conversation "watermark" (hash of sorted participant IDs)
    const watermark = participantIds.sort().join('-');
    // Check if conversation title matches participants
    const expectedTitle = participantNames;
    if (conv.title && conv.title !== expectedTitle) {
    }
  }
  if (issuesFound > 0) {
  } else {
  }

  // Create a validation report
  const report = {
    timestamp: new Date().toISOString(),
    totalConversations: conversations.length,
    validConversations,
    conversationsWithIssues: issuesFound,
    status: issuesFound === 0 ? 'WATERDICHT' : 'ISSUES_FOUND'
  };
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

