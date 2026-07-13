-- CreateTable
CREATE TABLE "NotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    
    -- Email Notifications
    "emailNewMessages" BOOLEAN NOT NULL DEFAULT true,
    "emailNewOrders" BOOLEAN NOT NULL DEFAULT true,
    "emailOrderUpdates" BOOLEAN NOT NULL DEFAULT true,
    "emailDeliveryUpdates" BOOLEAN NOT NULL DEFAULT true,
    "emailMarketing" BOOLEAN NOT NULL DEFAULT false,
    "emailWeeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "emailSecurityAlerts" BOOLEAN NOT NULL DEFAULT true,
    
    -- Push Notifications (In-app via Pusher)
    "pushNewMessages" BOOLEAN NOT NULL DEFAULT true,
    "pushNewOrders" BOOLEAN NOT NULL DEFAULT true,
    "pushOrderUpdates" BOOLEAN NOT NULL DEFAULT true,
    "pushDeliveryUpdates" BOOLEAN NOT NULL DEFAULT true,
    "pushNearbyProducts" BOOLEAN NOT NULL DEFAULT false,
    "pushSecurityAlerts" BOOLEAN NOT NULL DEFAULT true,
    
    -- SMS Notifications
    "smsOrderUpdates" BOOLEAN NOT NULL DEFAULT false,
    "smsDeliveryUpdates" BOOLEAN NOT NULL DEFAULT false,
    "smsSecurityAlerts" BOOLEAN NOT NULL DEFAULT true,
    
    -- Chat specific settings
    "chatSoundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "chatNotificationPreview" BOOLEAN NOT NULL DEFAULT true,
    "chatGroupMentionsOnly" BOOLEAN NOT NULL DEFAULT false,
    
    -- Quiet hours
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT DEFAULT '22:00',
    "quietHoursEnd" TEXT DEFAULT '08:00',
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreferences_userId_idx" ON "NotificationPreferences"("userId");

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

