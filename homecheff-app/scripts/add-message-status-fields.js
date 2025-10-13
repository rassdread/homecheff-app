const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Adding message status fields...');

  try {
    // Add deliveredAt to Message
    await prisma.$executeRaw`
      ALTER TABLE "Message" 
      ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3)
    `;
    console.log('✅ Added deliveredAt to Message');

    // Add index on deliveredAt
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Message_deliveredAt_idx" ON "Message"("deliveredAt")
    `;
    console.log('✅ Created index on deliveredAt');

    // Add lastSeen to ConversationParticipant
    await prisma.$executeRaw`
      ALTER TABLE "ConversationParticipant" 
      ADD COLUMN IF NOT EXISTS "lastSeen" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "isTyping" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "lastTypingAt" TIMESTAMP(3)
    `;
    console.log('✅ Added lastSeen, isTyping, lastTypingAt to ConversationParticipant');

    // Add index on lastSeen
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ConversationParticipant_lastSeen_idx" ON "ConversationParticipant"("lastSeen")
    `;
    console.log('✅ Created index on lastSeen');

    // Update all existing messages to have deliveredAt = createdAt
    await prisma.$executeRaw`
      UPDATE "Message"
      SET "deliveredAt" = "createdAt"
      WHERE "deliveredAt" IS NULL
    `;
    console.log('✅ Updated existing messages with deliveredAt');

    console.log('🎉 Message status migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

