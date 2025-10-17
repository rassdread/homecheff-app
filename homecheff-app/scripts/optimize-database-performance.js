const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function optimizeDatabasePerformance() {
  console.log('🚀 Starting comprehensive database performance optimization...');
  
  try {
    // 1. Add critical performance indexes
    console.log('📊 Adding performance indexes...');
    
    const indexes = [
      // Product performance indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_product_active_category_created" 
       ON "Product" ("isActive", "category", "createdAt" DESC)`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_product_seller_active_created" 
       ON "Product" ("sellerId", "isActive", "createdAt" DESC)`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_product_price_range" 
       ON "Product" ("priceCents", "isActive") WHERE "isActive" = true`,
      
      // User performance indexes  
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_location_active"
       ON "User" ("lat", "lng", "role") WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_username_email"
       ON "User" ("username", "email")`,
      
      // Analytics performance indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_analytics_event_type_entity"
       ON "AnalyticsEvent" ("eventType", "entityId", "createdAt" DESC)`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_analytics_user_events"
       ON "AnalyticsEvent" ("userId", "eventType", "createdAt" DESC) WHERE "userId" IS NOT NULL`,
      
      // Order performance indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_order_user_status_created"
       ON "Order" ("userId", "status", "createdAt" DESC)`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_order_status_created"
       ON "Order" ("status", "createdAt" DESC)`,
      
      // Favorite performance indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_favorite_user_product"
       ON "Favorite" ("userId", "productId", "createdAt" DESC)`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_favorite_product_count"
       ON "Favorite" ("productId") WHERE "productId" IS NOT NULL`,
      
      // Review performance indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_review_product_rating"
       ON "ProductReview" ("productId", "rating", "createdAt" DESC)`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_review_buyer_verified"
       ON "ProductReview" ("buyerId", "isVerified", "createdAt" DESC)`,
      
      // Follow performance indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_follow_seller_follower"
       ON "Follow" ("sellerId", "followerId", "createdAt" DESC)`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_follow_follower_seller"
       ON "Follow" ("followerId", "sellerId", "createdAt" DESC)`,
      
      // Image performance indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_image_product_order"
       ON "Image" ("productId", "sortOrder")`,
      
      // Delivery performance indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_delivery_profile_user_active"
       ON "DeliveryProfile" ("userId", "isActive", "createdAt" DESC)`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_delivery_order_status_created"
       ON "DeliveryOrder" ("status", "createdAt" DESC)`,
      
      // Notification performance indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notification_user_read"
       ON "Notification" ("userId", "readAt", "createdAt" DESC)`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notification_type_created"
       ON "Notification" ("type", "createdAt" DESC)`,
      
      // Workspace content performance indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_workspace_content_user_type"
       ON "WorkspaceContent" ("userId", "contentType", "createdAt" DESC)`,
      
      // Props performance indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_workspace_content_prop_content"
       ON "WorkspaceContentProp" ("workspaceContentId", "createdAt" DESC)`,
      
      // Comments performance indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_workspace_content_comment_content"
       ON "WorkspaceContentComment" ("workspaceContentId", "createdAt" DESC)`,
      
      // Fan request performance indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_fan_request_target_status"
       ON "FanRequest" ("targetId", "status", "createdAt" DESC)`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_fan_request_requester_status"
       ON "FanRequest" ("requesterId", "status", "createdAt" DESC)`
    ];
    
    for (const indexQuery of indexes) {
      try {
        const indexName = indexQuery.split('"')[1];
        console.log(`Adding index: ${indexName}...`);
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
    
    // 2. Analyze all tables to update statistics
    console.log('📈 Updating table statistics...');
    const tables = [
      'User', 'Product', 'Order', 'Message', 'Conversation', 
      'ConversationParticipant', 'Favorite', 'ProductReview', 
      'Follow', 'Image', 'DeliveryProfile', 'DeliveryOrder',
      'Notification', 'WorkspaceContent', 'AnalyticsEvent',
      'FanRequest', 'WorkspaceContentProp', 'WorkspaceContentComment'
    ];
    
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`ANALYZE "${table}"`);
        console.log(`✅ Analyzed table: ${table}`);
      } catch (error) {
        console.error(`❌ Error analyzing table ${table}:`, error.message);
      }
    }
    
    // 3. Show index usage statistics
    console.log('📊 Index usage statistics:');
    const stats = await prisma.$queryRaw`
      SELECT 
        schemaname, 
        tablename, 
        indexname, 
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
      FROM pg_stat_user_indexes 
      WHERE tablename IN ('User', 'Product', 'Order', 'Message', 'Conversation', 'Favorite', 'ProductReview')
      AND idx_scan > 0
      ORDER BY idx_scan DESC
      LIMIT 20
    `;
    
    if (stats.length > 0) {
      console.log('✅ Top performing indexes:');
      console.table(stats);
    } else {
      console.log('⚠️ No index usage statistics available yet (indexes need to be used first)');
    }
    
    // 4. Show table sizes
    console.log('📊 Table sizes:');
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename IN ('User', 'Product', 'Order', 'Message', 'Conversation', 'Favorite', 'ProductReview')
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;
    
    console.table(tableSizes);
    
    // 5. Show slow query candidates
    console.log('🐌 Checking for potential slow queries...');
    const slowQueries = await prisma.$queryRaw`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements 
      WHERE mean_time > 100 -- queries taking more than 100ms on average
      ORDER BY mean_time DESC
      LIMIT 10
    `.catch(() => {
      console.log('⚠️ pg_stat_statements not available (extension not enabled)');
      return [];
    });
    
    if (slowQueries.length > 0) {
      console.log('⚠️ Slow query candidates:');
      console.table(slowQueries);
    }
    
    console.log('🎉 Database performance optimization completed!');
    
    // 6. Performance recommendations
    console.log('\n📋 Performance Recommendations:');
    console.log('1. Monitor index usage with pg_stat_user_indexes');
    console.log('2. Enable pg_stat_statements for query monitoring');
    console.log('3. Consider connection pooling with PgBouncer');
    console.log('4. Implement query result caching in application layer');
    console.log('5. Use EXPLAIN ANALYZE for slow queries');
    console.log('6. Consider partitioning for large tables');
    
  } catch (error) {
    console.error('❌ Error during optimization:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the optimization
optimizeDatabasePerformance();
