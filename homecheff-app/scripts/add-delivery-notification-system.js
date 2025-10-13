const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Adding delivery notification system tables...');

  try {
    // 1. Create DeliveryAvailability table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "DeliveryAvailability" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "deliveryProfileId" TEXT NOT NULL,
        "dayOfWeek" INTEGER NOT NULL,
        "isAvailable" BOOLEAN NOT NULL DEFAULT true,
        "morningSlot" BOOLEAN NOT NULL DEFAULT false,
        "afternoonSlot" BOOLEAN NOT NULL DEFAULT false,
        "eveningSlot" BOOLEAN NOT NULL DEFAULT false,
        "customSlots" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "DeliveryAvailability_deliveryProfileId_fkey" FOREIGN KEY ("deliveryProfileId") REFERENCES "DeliveryProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    console.log('✅ Created DeliveryAvailability table');

    // 2. Create unique index
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryAvailability_deliveryProfileId_dayOfWeek_key" 
      ON "DeliveryAvailability"("deliveryProfileId", "dayOfWeek");
    `;
    console.log('✅ Created unique index on DeliveryAvailability');

    // 3. Create DeliveryNotificationSettings table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "DeliveryNotificationSettings" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "deliveryProfileId" TEXT NOT NULL UNIQUE,
        "enablePushNotifications" BOOLEAN NOT NULL DEFAULT true,
        "enableEmailNotifications" BOOLEAN NOT NULL DEFAULT true,
        "enableSmsNotifications" BOOLEAN NOT NULL DEFAULT false,
        "shiftReminders" TEXT NOT NULL DEFAULT '[60, 30, 5]',
        "autoGoOnline" BOOLEAN NOT NULL DEFAULT false,
        "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
        "quietHoursStart" TEXT,
        "quietHoursEnd" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "DeliveryNotificationSettings_deliveryProfileId_fkey" FOREIGN KEY ("deliveryProfileId") REFERENCES "DeliveryProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    console.log('✅ Created DeliveryNotificationSettings table');

    // 4. Create ShiftNotification table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ShiftNotification" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "deliveryProfileId" TEXT NOT NULL,
        "scheduledFor" TIMESTAMP(3) NOT NULL,
        "notifyAt" TIMESTAMP(3) NOT NULL,
        "minutesBefore" INTEGER NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "channel" TEXT NOT NULL DEFAULT 'PUSH',
        "sentAt" TIMESTAMP(3),
        "readAt" TIMESTAMP(3),
        "clickedAt" TIMESTAMP(3),
        "error" TEXT,
        "dayOfWeek" INTEGER NOT NULL,
        "timeSlot" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "ShiftNotification_deliveryProfileId_fkey" FOREIGN KEY ("deliveryProfileId") REFERENCES "DeliveryProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    console.log('✅ Created ShiftNotification table');

    // 5. Create indexes for ShiftNotification
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ShiftNotification_deliveryProfileId_notifyAt_status_idx" 
      ON "ShiftNotification"("deliveryProfileId", "notifyAt", "status");
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ShiftNotification_notifyAt_status_idx" 
      ON "ShiftNotification"("notifyAt", "status");
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ShiftNotification_status_idx" 
      ON "ShiftNotification"("status");
    `;
    console.log('✅ Created indexes for ShiftNotification');

    // 6. Create PushToken table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "PushToken" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "platform" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    console.log('✅ Created PushToken table');

    // 7. Create indexes for PushToken
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "PushToken_userId_idx" 
      ON "PushToken"("userId");
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "PushToken_token_idx" 
      ON "PushToken"("token");
    `;
    console.log('✅ Created indexes for PushToken');

    // 8. Create default notification settings for existing delivery profiles
    const existingProfiles = await prisma.deliveryProfile.findMany({
      where: {
        notificationSettings: null
      },
      select: { id: true }
    });

    for (const profile of existingProfiles) {
      await prisma.deliveryNotificationSettings.create({
        data: {
          deliveryProfileId: profile.id,
          enablePushNotifications: true,
          enableEmailNotifications: true,
          enableSmsNotifications: false,
          shiftReminders: [60, 30, 5],
          autoGoOnline: false,
          quietHoursEnabled: false
        }
      }).catch(e => {
        console.log(`Note: Settings already exist for profile ${profile.id}`);
      });
    }
    console.log(`✅ Created default notification settings for ${existingProfiles.length} profiles`);

    console.log('🎉 Delivery notification system migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

