const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugConversations() {
  try {
    console.log('🔍 Debugging conversations...\n');

    // Check database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Count all conversations
    console.log('2. Counting conversations...');
    const conversationCount = await prisma.conversation.count();
    console.log(`📊 Total conversations in database: ${conversationCount}\n`);

    if (conversationCount === 0) {
      console.log('❌ No conversations found in database!\n');
      
      // Check if there are any users
      console.log('3. Checking users...');
      const userCount = await prisma.user.count();
      console.log(`👥 Total users: ${userCount}`);
      
      if (userCount > 0) {
        console.log('\n4. Sample users:');
        const sampleUsers = await prisma.user.findMany({
          take: 3,
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        });
        console.log(sampleUsers);
      }
      
      // Check conversation participants
      console.log('\n5. Checking conversation participants...');
      const participantCount = await prisma.conversationParticipant.count();
      console.log(`👥 Total conversation participants: ${participantCount}`);
      
      // Check messages
      console.log('\n6. Checking messages...');
      const messageCount = await prisma.message.count();
      console.log(`💬 Total messages: ${messageCount}`);
      
    } else {
      console.log('3. Sample conversations:');
      const sampleConversations = await prisma.conversation.findMany({
        take: 5,
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

      sampleConversations.forEach((conv, index) => {
        console.log(`\n📝 Conversation ${index + 1}:`);
        console.log(`   ID: ${conv.id}`);
        console.log(`   Title: ${conv.title || 'No title'}`);
        console.log(`   Active: ${conv.isActive}`);
        console.log(`   Created: ${conv.createdAt}`);
        console.log(`   Last Message: ${conv.lastMessageAt || 'Never'}`);
        console.log(`   Participants: ${conv.ConversationParticipant.length}`);
        conv.ConversationParticipant.forEach((p, i) => {
          console.log(`     ${i + 1}. ${p.User.name || p.User.username || p.User.email} (${p.User.id})`);
        });
        if (conv.Message.length > 0) {
          const msg = conv.Message[0];
          console.log(`   Last Message: "${msg.text?.substring(0, 50) || 'No text'}" by ${msg.User.name || msg.User.username}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugConversations();
