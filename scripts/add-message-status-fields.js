const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Add deliveredAt to Message
    await prisma.$executeRaw`
      ALTER TABLE "Message" 
      ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3)
    `;
    // Add index on deliveredAt
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Message_deliveredAt_idx" ON "Message"("deliveredAt")
    `;
    // Add lastSeen to ConversationParticipant
    await prisma.$executeRaw`
      ALTER TABLE "ConversationParticipant" 
      ADD COLUMN IF NOT EXISTS "lastSeen" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "isTyping" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "lastTypingAt" TIMESTAMP(3)
    `;
    // Add index on lastSeen
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ConversationParticipant_lastSeen_idx" ON "ConversationParticipant"("lastSeen")
    `;
    // Update all existing messages to have deliveredAt = createdAt
    await prisma.$executeRaw`
      UPDATE "Message"
      SET "deliveredAt" = "createdAt"
      WHERE "deliveredAt" IS NULL
    `;
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

