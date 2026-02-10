#!/usr/bin/env node

/**
 * Test Participant Display Names Script
 * 
 * Dit script test of de display name logica correct werkt
 * en of de juiste namen worden getoond voor elke gebruiker.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simuleer de getDisplayName functie zoals in lib/displayName.ts
function getDisplayName(user) {
  if (!user) return 'Onbekend';
  
  // If displayFullName is false, don't show name at all
  if (user.displayFullName === false) {
    return 'Anoniem';
  }
  
  // Check displayNameOption preference
  if (user.displayNameOption === 'username' && user.username) {
    return user.username;
  }
  
  if (user.displayNameOption === 'first' && user.name) {
    return user.name.split(' ')[0];
  }
  
  if (user.displayNameOption === 'last' && user.name) {
    const nameParts = user.name.split(' ');
    return nameParts[nameParts.length - 1];
  }
  
  if (user.displayNameOption === 'none') {
    return 'Anoniem';
  }
  
  // Default to full name or username
  return user.name || user.username || 'Onbekend';
}

async function testParticipantDisplay() {
  console.log('🧪 Test Participant Display Names\n');
  console.log('=' .repeat(80));

  try {
    // Haal alle gebruikers op met hun display preferences
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        displayFullName: true,
        displayNameOption: true
      }
    });

    console.log(`👥 Gevonden ${users.length} gebruikers:\n`);

    users.forEach((user, index) => {
      const displayName = getDisplayName(user);
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Naam: "${user.name || 'Geen naam'}"`);
      console.log(`   Username: "${user.username || 'Geen username'}"`);
      console.log(`   Display Full Name: ${user.displayFullName}`);
      console.log(`   Display Option: "${user.displayNameOption || 'default'}"`);
      console.log(`   → Getoond als: "${displayName}"`);
      console.log('');
    });

    // Test specifieke gesprekken
    console.log('💬 Test Gesprekken:\n');

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
      },
      take: 3
    });

    conversations.forEach((conv, index) => {
      console.log(`🔸 Gesprek ${index + 1}: ${conv.id}`);
      
      conv.ConversationParticipant.forEach((participant, pIndex) => {
        const user = participant.User;
        const displayName = getDisplayName(user);
        console.log(`   Participant ${pIndex + 1}:`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Naam: "${user.name || 'Geen naam'}"`);
        console.log(`     Username: "${user.username || 'Geen username'}"`);
        console.log(`     Display Option: "${user.displayNameOption || 'default'}"`);
        console.log(`     → Getoond als: "${displayName}"`);
      });

      // Test de "other participant" logica
      console.log(`   📋 Other Participant Test:`);
      conv.ConversationParticipant.forEach((participant, pIndex) => {
        const currentUserId = participant.userId;
        const otherParticipants = conv.ConversationParticipant.filter(p => p.userId !== currentUserId);
        
        console.log(`     Als huidige gebruiker: ${participant.User.email}`);
        otherParticipants.forEach((other, oIndex) => {
          const otherDisplayName = getDisplayName(other.User);
          console.log(`       Ziet andere participant ${oIndex + 1}: "${otherDisplayName}" (${other.User.email})`);
        });
      });
      
      console.log('');
    });

    // Test edge cases
    console.log('🚨 Edge Cases Test:\n');
    
    // Test gebruiker zonder naam
    const userWithoutName = {
      id: 'test-id',
      name: null,
      username: 'testuser',
      displayFullName: true,
      displayNameOption: null
    };
    console.log(`Gebruiker zonder naam: "${getDisplayName(userWithoutName)}"`);
    
    // Test gebruiker zonder username
    const userWithoutUsername = {
      id: 'test-id-2',
      name: 'Test User',
      username: null,
      displayFullName: true,
      displayNameOption: null
    };
    console.log(`Gebruiker zonder username: "${getDisplayName(userWithoutUsername)}"`);
    
    // Test anonieme gebruiker
    const anonymousUser = {
      id: 'test-id-3',
      name: 'Secret User',
      username: 'secret',
      displayFullName: false,
      displayNameOption: null
    };
    console.log(`Anonieme gebruiker: "${getDisplayName(anonymousUser)}"`);
    
    // Test gebruiker met 'first' optie
    const firstUser = {
      id: 'test-id-4',
      name: 'John Doe',
      username: 'johndoe',
      displayFullName: true,
      displayNameOption: 'first'
    };
    console.log(`Gebruiker met 'first' optie: "${getDisplayName(firstUser)}"`);
    
    // Test gebruiker met 'last' optie
    const lastUser = {
      id: 'test-id-5',
      name: 'Jane Smith',
      username: 'janesmith',
      displayFullName: true,
      displayNameOption: 'last'
    };
    console.log(`Gebruiker met 'last' optie: "${getDisplayName(lastUser)}"`);

  } catch (error) {
    console.error('❌ Fout bij testen:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run de test
testParticipantDisplay().catch(console.error);
