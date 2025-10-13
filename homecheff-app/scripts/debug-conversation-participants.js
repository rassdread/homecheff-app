#!/usr/bin/env node

/**
 * Debug Conversation Participants Script
 * 
 * Dit script helpt bij het debuggen van participant identificatie problemen.
 * Het toont alle gesprekken en hun participants om te zien waar de verwarring zit.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugConversations() {
  console.log('🔍 Conversation Participants Debug\n');
  console.log('=' .repeat(80));

  try {
    // Haal alle actieve gesprekken op met participants
    const conversations = await prisma.conversation.findMany({
      where: { isActive: true },
      include: {
        ConversationParticipant: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                profileImage: true,
                displayFullName: true,
                displayNameOption: true
              }
            }
          }
        },
        Product: {
          select: {
            id: true,
            title: true
          }
        },
        Message: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 10
    });

    console.log(`📊 Gevonden ${conversations.length} actieve gesprekken:\n`);

    conversations.forEach((conv, index) => {
      console.log(`🔸 Gesprek ${index + 1}: ${conv.id}`);
      console.log(`   Product: ${conv.Product?.title || 'Geen product'}`);
      console.log(`   Laatste bericht: ${conv.lastMessageAt || 'Geen'}`);
      console.log(`   Participants (${conv.ConversationParticipant.length}):`);

      conv.ConversationParticipant.forEach((participant, pIndex) => {
        const user = participant.User;
        console.log(`     ${pIndex + 1}. ${user.name || 'Geen naam'} (${user.username || 'Geen username'})`);
        console.log(`        ID: ${user.id}`);
        console.log(`        Email: ${user.email}`);
        console.log(`        Display: ${user.displayFullName ? 'Full' : 'Limited'}, Option: ${user.displayNameOption || 'default'}`);
        console.log(`        Profile Image: ${user.profileImage ? 'Ja' : 'Nee'}`);
      });

      if (conv.Message[0]) {
        const lastMessage = conv.Message[0];
        console.log(`   Laatste bericht van: ${lastMessage.User.name || lastMessage.User.username || 'Onbekend'} (ID: ${lastMessage.User.id})`);
      }

      console.log('   ' + '-'.repeat(70));
    });

    // Zoek naar problematische gesprekken
    console.log('\n🚨 Probleem Analyse:\n');

    const problemConversations = conversations.filter(conv => {
      // Gesprekken met meer dan 2 participants (ongewoon)
      if (conv.ConversationParticipant.length > 2) {
        return true;
      }
      
      // Gesprekken met participants zonder naam/username
      const hasAnonymousParticipants = conv.ConversationParticipant.some(p => 
        !p.User.name && !p.User.username
      );
      if (hasAnonymousParticipants) {
        return true;
      }

      return false;
    });

    if (problemConversations.length > 0) {
      console.log(`⚠️  ${problemConversations.length} problematische gesprekken gevonden:\n`);
      
      problemConversations.forEach((conv, index) => {
        console.log(`❌ Probleem ${index + 1}: ${conv.id}`);
        if (conv.ConversationParticipant.length > 2) {
          console.log(`   - Te veel participants: ${conv.ConversationParticipant.length}`);
        }
        
        const anonymousParticipants = conv.ConversationParticipant.filter(p => 
          !p.User.name && !p.User.username
        );
        if (anonymousParticipants.length > 0) {
          console.log(`   - Anonymous participants: ${anonymousParticipants.length}`);
          anonymousParticipants.forEach(p => {
            console.log(`     * ID: ${p.User.id}, Email: ${p.User.email}`);
          });
        }
        console.log('');
      });
    } else {
      console.log('✅ Geen voor de hand liggende problemen gevonden in participant structuur.\n');
    }

    // Test participant filtering logica
    console.log('🧪 Test Participant Filtering Logica:\n');
    
    conversations.slice(0, 3).forEach((conv, index) => {
      console.log(`Test ${index + 1} - Gesprek: ${conv.id}`);
      
      // Simuleer de filtering zoals in de API
      const participants = conv.ConversationParticipant;
      
      participants.forEach((participant, pIndex) => {
        const currentUserId = participant.userId;
        const otherParticipants = participants.filter(p => p.userId !== currentUserId);
        const firstOtherParticipant = otherParticipants[0] || null;
        
        console.log(`   Als huidige gebruiker: ${participant.User.name || participant.User.username} (${currentUserId})`);
        console.log(`   Andere participants: ${otherParticipants.length}`);
        if (firstOtherParticipant) {
          console.log(`   Eerste andere: ${firstOtherParticipant.User.name || firstOtherParticipant.User.username} (${firstOtherParticipant.User.id})`);
        }
        console.log('');
      });
    });

  } catch (error) {
    console.error('❌ Fout bij debuggen:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run de debug functie
debugConversations().catch(console.error);
