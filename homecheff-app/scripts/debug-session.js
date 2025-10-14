const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugSession() {
  try {
    console.log('🔍 Debugging user session and conversations...\n');

    // Check all users and their conversation counts
    console.log('1. All users with conversation counts:');
    const usersWithConversations = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        _count: {
          select: {
            ConversationParticipant: true
          }
        }
      },
      orderBy: {
        ConversationParticipant: {
          _count: 'desc'
        }
      }
    });

    usersWithConversations.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || user.username || 'No name'} (${user.email})`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Conversations: ${user._count.ConversationParticipant}`);
      console.log('');
    });

    // Check if there are any active conversations
    console.log('\n2. Active conversations:');
    const activeConversations = await prisma.conversation.findMany({
      where: {
        isActive: true
      },
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

    activeConversations.forEach((conv, index) => {
      console.log(`\n📝 Active Conversation ${index + 1}:`);
      console.log(`   ID: ${conv.id}`);
      console.log(`   Title: ${conv.title}`);
      console.log(`   Participants:`);
      conv.ConversationParticipant.forEach((p, i) => {
        console.log(`     ${i + 1}. ${p.User.name || p.User.username} (${p.User.email}) - ID: ${p.User.id}`);
      });
      if (conv.Message.length > 0) {
        const msg = conv.Message[0];
        console.log(`   Last Message: "${msg.text?.substring(0, 50) || 'No text'}" by ${msg.User.name || msg.User.username}`);
      }
    });

    // Check inactive conversations too
    console.log('\n3. Inactive conversations:');
    const inactiveConversations = await prisma.conversation.findMany({
      where: {
        isActive: false
      },
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
        }
      }
    });

    console.log(`Found ${inactiveConversations.length} inactive conversations`);
    inactiveConversations.forEach((conv, index) => {
      console.log(`   ${index + 1}. ${conv.title} - Participants: ${conv.ConversationParticipant.map(p => p.User.name || p.User.username).join(', ')}`);
    });

    // Test the exact API query for Sergio
    console.log('\n4. Testing API query for Sergio:');
    const sergioUser = await prisma.user.findUnique({
      where: { email: 'sergio@homecheff.eu' },
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
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (sergioUser) {
      console.log(`   Sergio found: ${sergioUser.name} (${sergioUser.email})`);
      console.log(`   Conversation participants: ${sergioUser.ConversationParticipant.length}`);
      sergioUser.ConversationParticipant.forEach((p, i) => {
        const conv = p.Conversation;
        console.log(`     ${i + 1}. ${conv.title} - Active: ${conv.isActive} - Last: ${conv.lastMessageAt}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSession();
