const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixChatMessages() {
  try {
    // Reset all deletedAt timestamps to null
    const result = await prisma.message.updateMany({
      where: {
        deletedAt: { not: null }
      },
      data: {
        deletedAt: null
      }
    });
    // Get statistics
    const totalMessages = await prisma.message.count();
    const totalConversations = await prisma.conversation.count();
    const activeConversations = await prisma.conversation.count({
      where: { isActive: true }
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixChatMessages();

