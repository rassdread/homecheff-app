const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMessagePerformance() {
  console.log('🧪 Testing message performance optimizations...');
  
  try {
    // Test 1: Get a sample conversation
    const sampleConversation = await prisma.conversation.findFirst({
      select: { id: true },
      where: {
        Message: {
          some: {}
        }
      }
    });
    
    if (!sampleConversation) {
      console.log('❌ No conversations with messages found for testing');
      return;
    }
    
    console.log(`📝 Testing with conversation: ${sampleConversation.id}`);
    
    // Test 2: Original query performance
    console.log('\n🔄 Testing original query...');
    const startOriginal = Date.now();
    
    const originalMessages = await prisma.message.findMany({
      where: {
        conversationId: sampleConversation.id
      },
      include: {
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
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    const originalTime = Date.now() - startOriginal;
    console.log(`✅ Original query: ${originalTime}ms, ${originalMessages.length} messages`);
    
    // Test 3: Optimized query performance
    console.log('\n🚀 Testing optimized query...');
    const startOptimized = Date.now();
    
    const optimizedMessages = await prisma.message.findMany({
      where: {
        conversationId: sampleConversation.id,
        isEncrypted: false,
        deletedAt: null
      },
      select: {
        id: true,
        text: true,
        messageType: true,
        createdAt: true,
        readAt: true,
        deliveredAt: true,
        attachmentUrl: true,
        attachmentName: true,
        attachmentType: true,
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
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    const optimizedTime = Date.now() - startOptimized;
    console.log(`✅ Optimized query: ${optimizedTime}ms, ${optimizedMessages.length} messages`);
    
    // Test 4: Performance comparison
    const improvement = ((originalTime - optimizedTime) / originalTime * 100).toFixed(1);
    console.log(`\n📊 Performance improvement: ${improvement}% faster`);
    
    if (optimizedTime < originalTime) {
      console.log('🎉 Optimization successful!');
    } else {
      console.log('⚠️ No significant improvement detected');
    }
    
    // Test 5: Conversations query performance
    console.log('\n🔄 Testing conversations query...');
    const startConversations = Date.now();
    
    const conversations = await prisma.user.findFirst({
      where: {
        ConversationParticipant: {
          some: {}
        }
      },
      select: {
        ConversationParticipant: {
          where: {
            isHidden: false
          },
          select: {
            Conversation: {
              select: {
                id: true,
                title: true,
                lastMessageAt: true,
                isActive: true,
                createdAt: true,
                Message: {
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                  select: {
                    id: true,
                    text: true,
                    createdAt: true,
                    User: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        profileImage: true
                      }
                    }
                  }
                },
                ConversationParticipant: {
                  select: {
                    User: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        profileImage: true
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
    
    const conversationsTime = Date.now() - startConversations;
    const conversationCount = conversations?.ConversationParticipant?.length || 0;
    console.log(`✅ Conversations query: ${conversationsTime}ms, ${conversationCount} conversations`);
    
    // Test 6: Database index usage
    console.log('\n📊 Checking index usage...');
    const indexStats = await prisma.$queryRaw`
      SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
      FROM pg_stat_user_indexes 
      WHERE tablename IN ('Message', 'Conversation', 'ConversationParticipant')
      AND idx_scan > 0
      ORDER BY idx_scan DESC
      LIMIT 10
    `;
    
    if (indexStats.length > 0) {
      console.log('✅ Index usage statistics:');
      console.table(indexStats);
    } else {
      console.log('⚠️ No index usage statistics available yet');
    }
    
    console.log('\n🎉 Performance testing completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the performance test
testMessagePerformance();
