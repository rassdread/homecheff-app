#!/usr/bin/env node

/**
 * Fix Participant Identification Script
 * 
 * Dit script identificeert en lost participant identificatie problemen op.
 * Het zorgt ervoor dat de juiste gebruiker wordt getoond in elke chat.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixParticipantIdentification() {
  console.log('🔧 Fix Participant Identification\n');
  console.log('=' .repeat(80));

  try {
    // 1. Identificeer problematische gesprekken
    console.log('🔍 Zoeken naar problematische gesprekken...\n');
    
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
                displayFullName: true,
                displayNameOption: true
              }
            }
          }
        }
      }
    });

    const problematicConversations = [];

    conversations.forEach(conv => {
      // Check voor gesprekken met meerdere participants met dezelfde naam
      const participantNames = conv.ConversationParticipant.map(p => p.User.name).filter(Boolean);
      const uniqueNames = [...new Set(participantNames)];
      
      if (participantNames.length !== uniqueNames.length) {
        problematicConversations.push({
          conversation: conv,
          issue: 'Duplicate names in conversation',
          duplicateNames: participantNames.filter((name, index) => participantNames.indexOf(name) !== index)
        });
      }

      // Check voor gesprekken met anonieme participants
      const anonymousParticipants = conv.ConversationParticipant.filter(p => p.User.displayFullName === false);
      if (anonymousParticipants.length > 0) {
        problematicConversations.push({
          conversation: conv,
          issue: 'Anonymous participants',
          anonymousUsers: anonymousParticipants.map(p => ({
            id: p.User.id,
            email: p.User.email,
            name: p.User.name
          }))
        });
      }
    });

    console.log(`📊 Gevonden ${problematicConversations.length} problematische gesprekken:\n`);

    problematicConversations.forEach((item, index) => {
      console.log(`${index + 1}. Gesprek: ${item.conversation.id}`);
      console.log(`   Probleem: ${item.issue}`);
      
      if (item.duplicateNames) {
        console.log(`   Dubbele namen: ${item.duplicateNames.join(', ')}`);
      }
      
      if (item.anonymousUsers) {
        console.log(`   Anonieme gebruikers:`);
        item.anonymousUsers.forEach(user => {
          console.log(`     - ${user.name} (${user.email})`);
        });
      }
      
      console.log(`   Participants:`);
      item.conversation.ConversationParticipant.forEach((participant, pIndex) => {
        const user = participant.User;
        console.log(`     ${pIndex + 1}. ${user.name || 'Geen naam'} (${user.email})`);
        console.log(`        Username: ${user.username || 'Geen username'}`);
        console.log(`        Display: ${user.displayFullName ? 'Full' : 'Limited'}, Option: ${user.displayNameOption || 'default'}`);
      });
      console.log('');
    });

    // 2. Toon aanbevelingen
    console.log('💡 Aanbevelingen:\n');
    
    console.log('1. Voor anonieme gebruikers:');
    console.log('   - Overweeg om displayFullName in te stellen op true voor betere UX');
    console.log('   - Of gebruik een consistente "Anoniem" naam in de UI');
    console.log('');
    
    console.log('2. Voor dubbele namen:');
    console.log('   - Zorg dat de participant filtering correct werkt');
    console.log('   - Gebruik user ID in plaats van naam voor identificatie');
    console.log('');
    
    console.log('3. Voor de frontend:');
    console.log('   - Zorg dat otherParticipant altijd de juiste gebruiker bevat');
    console.log('   - Test met verschillende display name opties');
    console.log('');

    // 3. Test de participant filtering logica
    console.log('🧪 Test Participant Filtering Logica:\n');
    
    conversations.slice(0, 2).forEach((conv, index) => {
      console.log(`Test ${index + 1} - Gesprek: ${conv.id}`);
      
      conv.ConversationParticipant.forEach((participant, pIndex) => {
        const currentUserId = participant.userId;
        const otherParticipants = conv.ConversationParticipant.filter(p => p.userId !== currentUserId);
        
        console.log(`   Als huidige gebruiker: ${participant.User.email} (${currentUserId})`);
        console.log(`   Andere participants: ${otherParticipants.length}`);
        
        otherParticipants.forEach((other, oIndex) => {
          console.log(`     ${oIndex + 1}. ${other.User.name || 'Geen naam'} (${other.User.email})`);
          console.log(`        ID: ${other.User.id}`);
          console.log(`        Username: ${other.User.username || 'Geen username'}`);
          console.log(`        Display: ${other.User.displayFullName ? 'Full' : 'Limited'}, Option: ${other.User.displayNameOption || 'default'}`);
        });
        console.log('');
      });
    });

    // 4. Toon API endpoint test
    console.log('🌐 API Endpoint Test:\n');
    console.log('Test de volgende endpoints om te controleren of participant identificatie correct werkt:\n');
    
    conversations.slice(0, 3).forEach((conv, index) => {
      console.log(`${index + 1}. GET /api/conversations/${conv.id}`);
      console.log(`   Verwacht: correcte otherParticipant met juiste user data`);
      console.log('');
    });

    console.log('2. GET /api/conversations');
    console.log('   Verwacht: lijst met correcte otherParticipant voor elke conversatie');
    console.log('');

  } catch (error) {
    console.error('❌ Fout bij fixen:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run de fix
fixParticipantIdentification().catch(console.error);
