const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function optimizeMessagePerformance() {
  console.log('🚀 Starting message performance optimization...');
  
  try {
    // Add performance indexes
    console.log('📊 Adding database indexes...');
    
    const indexes = [
      // Composite index for conversation messages with read status
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_conversation_read" 
       ON "Message" ("conversationId", "readAt", "createdAt" DESC)`,
      
      // Composite index for unread messages by user
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_unread_by_user" 
       ON "Message" ("senderId", "readAt", "createdAt" DESC) 
       WHERE "readAt" IS NULL`,
      
      // Composite index for conversation participants with hidden status
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_conversation_participant_user_hidden" 
       ON "ConversationParticipant" ("userId", "isHidden", "conversationId")`,
      
      // Composite index for messages with encryption status
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_encryption_status" 
       ON "Message" ("conversationId", "isEncrypted", "createdAt" DESC)`,
      
      // Add index for conversation last message ordering
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_conversation_last_message_active" 
       ON "Conversation" ("lastMessageAt" DESC, "isActive") 
       WHERE "lastMessageAt" IS NOT NULL`,
      
      // Composite index for message notifications
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_notifications" 
       ON "Message" ("conversationId", "senderId", "readAt", "createdAt" DESC) 
       WHERE "readAt" IS NULL AND "isEncrypted" = false`
    ];
    
    for (const indexQuery of indexes) {
      try {
        console.log(`Adding index: ${indexQuery.split('"')[1]}...`);
        await prisma.$executeRawUnsafe(indexQuery);
        console.log('✅ Index added successfully');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ Index already exists, skipping...');
        } else {
          console.error('❌ Error adding index:', error.message);
        }
      }
    }
    
    // Analyze tables to update statistics
    console.log('📈 Updating table statistics...');
    await prisma.$executeRaw`ANALYZE "Message"`;
    await prisma.$executeRaw`ANALYZE "Conversation"`;
    await prisma.$executeRaw`ANALYZE "ConversationParticipant"`;
    
    console.log('✅ Table statistics updated');
    
    // Show index usage statistics
    console.log('📊 Index usage statistics:');
    const stats = await prisma.$queryRaw`
      SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
      FROM pg_stat_user_indexes 
      WHERE tablename IN ('Message', 'Conversation', 'ConversationParticipant')
      ORDER BY idx_scan DESC
    `;
    
    console.table(stats);
    
    console.log('🎉 Message performance optimization completed!');
    
  } catch (error) {
    console.error('❌ Error during optimization:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the optimization
optimizeMessagePerformance();
