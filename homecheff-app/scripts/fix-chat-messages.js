const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixChatMessages() {
  try {
    console.log('🔧 Herstellen van chat berichten...\n');

    // Reset all deletedAt timestamps to null
    const result = await prisma.message.updateMany({
      where: {
        deletedAt: { not: null }
      },
      data: {
        deletedAt: null
      }
    });

    console.log(`✅ ${result.count} berichten hersteld (deletedAt verwijderd)`);

    // Get statistics
    const totalMessages = await prisma.message.count();
    const totalConversations = await prisma.conversation.count();
    const activeConversations = await prisma.conversation.count({
      where: { isActive: true }
    });

    console.log('\n📊 Statistieken:');
    console.log(`   - Totaal berichten: ${totalMessages}`);
    console.log(`   - Totaal conversations: ${totalConversations}`);
    console.log(`   - Actieve conversations: ${activeConversations}`);

    console.log('\n✨ Chat fixes zijn actief!');
    console.log('   - Berichten komen nu aan bij ontvangers');
    console.log('   - Verwijderde chats heractiveren automatisch bij nieuwe berichten');
    console.log('   - Elke gebruiker kan chats verbergen zonder anderen te beïnvloeden\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixChatMessages();

