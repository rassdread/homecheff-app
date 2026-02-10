-- Add indexes for better query performance and reduced data transfer

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_username ON "User"(username);
CREATE INDEX IF NOT EXISTS idx_user_created_at ON "User"("createdAt");

-- Product table indexes
CREATE INDEX IF NOT EXISTS idx_product_seller ON "Product"("sellerId");
CREATE INDEX IF NOT EXISTS idx_product_active ON "Product"("isActive");
CREATE INDEX IF NOT EXISTS idx_product_created_at ON "Product"("createdAt");
CREATE INDEX IF NOT EXISTS idx_product_category ON "Product"(category);
CREATE INDEX IF NOT EXISTS idx_product_price ON "Product"("priceCents");

-- Message table indexes
CREATE INDEX IF NOT EXISTS idx_message_conversation ON "Message"("conversationId");
CREATE INDEX IF NOT EXISTS idx_message_sender ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS idx_message_created_at ON "Message"("createdAt");
CREATE INDEX IF NOT EXISTS idx_message_read_at ON "Message"("readAt");

-- Conversation indexes
CREATE INDEX IF NOT EXISTS idx_conversation_last_message ON "Conversation"("lastMessageAt");
CREATE INDEX IF NOT EXISTS idx_conversation_active ON "Conversation"("isActive");

-- ConversationParticipant indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participant_user ON "ConversationParticipant"("userId");
CREATE INDEX IF NOT EXISTS idx_conversation_participant_conversation ON "ConversationParticipant"("conversationId");

-- Follow table indexes
CREATE INDEX IF NOT EXISTS idx_follow_follower ON "Follow"("followerId");
CREATE INDEX IF NOT EXISTS idx_follow_seller ON "Follow"("sellerId");
CREATE INDEX IF NOT EXISTS idx_follow_created_at ON "Follow"("createdAt");

-- Favorite table indexes
CREATE INDEX IF NOT EXISTS idx_favorite_user ON "Favorite"("userId");
CREATE INDEX IF NOT EXISTS idx_favorite_product ON "Favorite"("productId");
CREATE INDEX IF NOT EXISTS idx_favorite_created_at ON "Favorite"("createdAt");

-- Order table indexes
CREATE INDEX IF NOT EXISTS idx_order_user ON "Order"("userId");
CREATE INDEX IF NOT EXISTS idx_order_status ON "Order"(status);
CREATE INDEX IF NOT EXISTS idx_order_created_at ON "Order"("createdAt");

-- OrderItem indexes
CREATE INDEX IF NOT EXISTS idx_order_item_order ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS idx_order_item_product ON "OrderItem"("productId");

-- Review indexes
CREATE INDEX IF NOT EXISTS idx_review_product ON "ProductReview"("productId");
CREATE INDEX IF NOT EXISTS idx_review_buyer ON "ProductReview"("buyerId");
CREATE INDEX IF NOT EXISTS idx_review_created_at ON "ProductReview"("createdAt");

-- Image indexes
CREATE INDEX IF NOT EXISTS idx_image_product ON "Image"("productId");
CREATE INDEX IF NOT EXISTS idx_image_sort_order ON "Image"("sortOrder");

-- SellerProfile indexes
CREATE INDEX IF NOT EXISTS idx_seller_profile_user ON "SellerProfile"("userId");

-- AnalyticsEvent indexes
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON "AnalyticsEvent"("eventType");
CREATE INDEX IF NOT EXISTS idx_analytics_event_user ON "AnalyticsEvent"("userId");
CREATE INDEX IF NOT EXISTS idx_analytics_event_created_at ON "AnalyticsEvent"("createdAt");
