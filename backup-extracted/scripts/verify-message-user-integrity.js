const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMessageUserIntegrity() {
  // Get all messages with their sender info
  const messages = await prisma.message.findMany({
    include: {
      User: {
        select: {
          id: true,
          email: true,
          username: true,
          name: true
        }
      },
      Conversation: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });
  let validMessages = 0;
  let orphanedMessages = 0;
  let messagesWithInvalidSender = 0;

  const issues = [];

  for (const message of messages) {
    // Check if sender exists
    if (!message.User) {
      orphanedMessages++;
      issues.push({
        messageId: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        issue: 'ORPHANED_MESSAGE',
        description: 'Message sender does not exist in database'
      });
      continue;
    }

    // Verify sender has valid email (UNIQUE constraint)
    if (!message.User.email) {
      messagesWithInvalidSender++;
      issues.push({
        messageId: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        issue: 'MISSING_EMAIL',
        description: 'Sender has no email address'
      });
      continue;
    }

    // Verify sender has valid username (should be unique)
    if (!message.User.username) {
    }

    // Verify sender is a participant in the conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: message.conversationId,
        userId: message.senderId
      }
    });

    if (!participant) {
      messagesWithInvalidSender++;
      issues.push({
        messageId: message.id,
        conversationId: message.conversationId,
        conversationTitle: message.Conversation?.title,
        senderId: message.senderId,
        senderEmail: message.User.email,
        senderUsername: message.User.username,
        issue: 'NOT_PARTICIPANT',
        description: 'Message sender is not a participant in the conversation'
      });
      continue;
    }

    validMessages++;
  }
  const integrityPercentage = ((validMessages / messages.length) * 100).toFixed(2);
  if (issues.length > 0) {
    issues.forEach((issue, index) => {
    });
  } else {
  }

  // Generate watermark summary for each conversation
  const conversations = await prisma.conversation.findMany({
    include: {
      ConversationParticipant: {
        include: {
          User: {
            select: {
              id: true,
              email: true,
              username: true
            }
          }
        }
      },
      Message: {
        select: {
          id: true,
          senderId: true
        }
      }
    }
  });

  for (const conv of conversations) {
    const participantWatermarks = conv.ConversationParticipant.map(p => ({
      id: p.userId,
      email: p.User.email,
      username: p.User.username
    }));

    const uniqueSenders = [...new Set(conv.Message.map(m => m.senderId))];
    const allSendersAreParticipants = uniqueSenders.every(senderId => 
      participantWatermarks.some(p => p.id === senderId)
    );
  }

  return {
    totalMessages: messages.length,
    validMessages,
    orphanedMessages,
    messagesWithInvalidSender,
    integrityPercentage: parseFloat(integrityPercentage),
    issues,
    status: issues.length === 0 ? 'WATERDICHT' : 'ISSUES_FOUND'
  };
}

verifyMessageUserIntegrity()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

