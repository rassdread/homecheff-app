const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConversationsAPI() {
  try {
    console.log('🔍 Testing conversations API logic...\n');

    // Simulate the API logic
    const testEmail = 'sergio@homecheff.eu'; // Sergio's email
    
    console.log(`1. Looking for user with email: ${testEmail}`);
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        ConversationParticipant: {
          select: {
            Conversation: {
              select: {
                id: true,
                title: true,
                lastMessageAt: true,
                isActive: true,
                createdAt: true,
                Product: {
                  select: {
                    id: true,
                    title: true,
                    priceCents: true,
                    Image: {
                      select: {
                        fileUrl: true,
                        sortOrder: true
                      },
                      take: 1,
                      orderBy: { sortOrder: 'asc' }
                    }
                  }
                },
                Message: {
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                  select: {
                    id: true,
                    text: true,
                    messageType: true,
                    createdAt: true,
                    readAt: true,
                    senderId: true,
                    User: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        profileImage: true,
                        displayFullName: true,
                        displayNameOption: true
                      }
                    }
                  }
                },
                ConversationParticipant: {
                  select: {
                    userId: true,
                    User: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        profileImage: true,
                        displayFullName: true,
                        displayNameOption: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found!');
      
      // Show all users
      console.log('\n📋 All users in database:');
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          email: true
        }
      });
      allUsers.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.name || u.username || 'No name'} (${u.email}) - ID: ${u.id}`);
      });
      return;
    }

    console.log(`✅ User found: ${user.name || user.username} (${user.email})`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Conversation participants: ${user.ConversationParticipant.length}\n`);

    // Transform conversations like the API does
    const conversations = user.ConversationParticipant
      .map(participant => {
        const conversation = participant.Conversation;
        
        // Get other participants (exclude current user)
        const otherParticipants = conversation.ConversationParticipant
          .filter(p => p.userId !== user.id)
          .map(p => ({
            id: p.User.id,
            name: p.User.name,
            username: p.User.username,
            profileImage: p.User.profileImage,
            displayFullName: p.User.displayFullName,
            displayNameOption: p.User.displayNameOption
          }));

        // Get the first other participant
        const otherParticipant = otherParticipants[0] || null;

        return {
          id: conversation.id,
          title: conversation.title || 
                 (conversation.Product ? conversation.Product.title : 
                 otherParticipant ? (otherParticipant.name || otherParticipant.username || 'Gesprek') : 'Nieuwe conversatie'),
          product: conversation.Product,
          lastMessage: conversation.Message[0] || null,
          participants: otherParticipants,
          otherParticipant: otherParticipant,
          lastMessageAt: conversation.lastMessageAt,
          isActive: conversation.isActive,
          createdAt: conversation.createdAt
        };
      })
      .sort((a, b) => {
        const aTime = a.lastMessageAt || a.createdAt;
        const bTime = b.lastMessageAt || b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

    console.log(`2. Transformed conversations: ${conversations.length}\n`);

    conversations.forEach((conv, index) => {
      console.log(`📝 Conversation ${index + 1}:`);
      console.log(`   ID: ${conv.id}`);
      console.log(`   Title: ${conv.title}`);
      console.log(`   Active: ${conv.isActive}`);
      console.log(`   Participants: ${conv.participants.length}`);
      conv.participants.forEach((p, i) => {
        console.log(`     ${i + 1}. ${p.name || p.username || 'No name'} (${p.id})`);
      });
      if (conv.lastMessage) {
        console.log(`   Last Message: "${conv.lastMessage.text?.substring(0, 50) || 'No text'}" by ${conv.lastMessage.User.name || conv.lastMessage.User.username}`);
      }
      console.log('');
    });

    // Test with different emails
    console.log('\n3. Testing with all user emails...');
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        username: true
      }
    });

    for (const testUser of allUsers) {
      const userConversations = await prisma.conversationParticipant.count({
        where: {
          User: {
            email: testUser.email
          }
        }
      });
      console.log(`   ${testUser.email}: ${userConversations} conversations`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConversationsAPI();
