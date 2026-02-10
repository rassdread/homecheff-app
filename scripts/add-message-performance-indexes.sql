-- Performance optimization indexes for messages and conversations
-- Run this script to improve message loading performance

-- Add composite index for conversation messages with read status
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_conversation_read" 
ON "Message" ("conversationId", "readAt", "createdAt" DESC);

-- Add composite index for unread messages by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_unread_by_user" 
ON "Message" ("senderId", "readAt", "createdAt" DESC) 
WHERE "readAt" IS NULL;

-- Add composite index for conversation participants with hidden status
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_conversation_participant_user_hidden" 
ON "ConversationParticipant" ("userId", "isHidden", "conversationId");

-- Add composite index for messages with encryption status
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_encryption_status" 
ON "Message" ("conversationId", "isEncrypted", "createdAt" DESC);

-- Add index for conversation last message ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_conversation_last_message_active" 
ON "Conversation" ("lastMessageAt" DESC, "isActive") 
WHERE "lastMessageAt" IS NOT NULL;

-- Add composite index for message notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_notifications" 
ON "Message" ("conversationId", "senderId", "readAt", "createdAt" DESC) 
WHERE "readAt" IS NULL AND "isEncrypted" = false;

-- Analyze tables to update statistics
ANALYZE "Message";
ANALYZE "Conversation";
ANALYZE "ConversationParticipant";

-- Show index usage (run after adding indexes)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE tablename IN ('Message', 'Conversation', 'ConversationParticipant')
-- ORDER BY idx_scan DESC;
