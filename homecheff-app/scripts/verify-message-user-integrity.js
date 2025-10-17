const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMessageUserIntegrity() {
  console.log('🔍 Verifying Message-User integrity with Email & Username watermarks...\n');

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

  console.log(`📊 Total messages to verify: ${messages.length}\n`);

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
      console.log(`❌ Message ${message.id}: ORPHANED (sender ${message.senderId} not found)`);
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
      console.log(`⚠️  Message ${message.id}: Sender has NO EMAIL`);
      continue;
    }

    // Verify sender has valid username (should be unique)
    if (!message.User.username) {
      console.log(`⚠️  Message ${message.id}: Sender has NO USERNAME (user: ${message.User.email})`);
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
      console.log(`❌ Message ${message.id}: Sender ${message.User.email} (${message.User.username}) is NOT a participant in conversation ${message.conversationId}`);
      continue;
    }

    validMessages++;
  }

  console.log(`\n\n📊 INTEGRITY REPORT:\n`);
  console.log(`✅ Valid messages (watermarked correctly): ${validMessages}`);
  console.log(`❌ Orphaned messages (sender not found): ${orphanedMessages}`);
  console.log(`⚠️  Messages with invalid sender: ${messagesWithInvalidSender}`);
  console.log(`📦 Total messages checked: ${messages.length}`);

  const integrityPercentage = ((validMessages / messages.length) * 100).toFixed(2);
  console.log(`\n🎯 Data Integrity: ${integrityPercentage}%`);

  if (issues.length > 0) {
    console.log(`\n⚠️  Found ${issues.length} integrity issues:\n`);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.issue}:`);
      console.log(`   Message ID: ${issue.messageId}`);
      console.log(`   Conversation: ${issue.conversationTitle || issue.conversationId}`);
      console.log(`   Sender: ${issue.senderEmail || issue.senderId}`);
      console.log(`   Username: ${issue.senderUsername || 'N/A'}`);
      console.log(`   Description: ${issue.description}\n`);
    });
  } else {
    console.log(`\n✅ 🎉 ALL MESSAGES ARE WATERMARKED CORRECTLY!`);
    console.log(`   - All messages have valid senders with email & username`);
    console.log(`   - All senders are participants in their respective conversations`);
    console.log(`   - Data integrity is WATERDICHT! 🔒\n`);
  }

  // Generate watermark summary for each conversation
  console.log(`\n📋 CONVERSATION WATERMARK SUMMARY:\n`);
  
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

    console.log(`Conversation: ${conv.id}`);
    console.log(`  Participants: ${participantWatermarks.map(p => `${p.username} (${p.email})`).join(', ')}`);
    console.log(`  Messages: ${conv.Message.length}`);
    console.log(`  Status: ${allSendersAreParticipants ? '✅ VALID' : '❌ INVALID'}\n`);
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

