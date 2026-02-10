#!/usr/bin/env node

/**
 * Test User Identification Script
 * 
 * Dit script test of de gebruiker identificatie correct werkt op basis van:
 * 1. Email adres (voor authenticatie)
 * 2. Username (voor publieke identificatie)
 * 3. Display naam (voor weergave met privacy instellingen)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUserIdentification() {
  console.log('🔍 Test User Identification System\n');
  console.log('=' .repeat(80));

  try {
    // 1. Test email uniekheid
    console.log('📧 Test Email Uniekheid:\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        displayFullName: true,
        displayNameOption: true
      },
      orderBy: { email: 'asc' }
    });

    const emails = users.map(u => u.email);
    const uniqueEmails = [...new Set(emails)];
    
    console.log(`📊 Totaal gebruikers: ${users.length}`);
    console.log(`📊 Unieke emails: ${uniqueEmails.length}`);
    
    if (emails.length === uniqueEmails.length) {
      console.log('✅ Alle email adressen zijn uniek\n');
    } else {
      console.log('❌ Er zijn dubbele email adressen gevonden!\n');
      
      // Zoek dubbele emails
      const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
      console.log('Dubbele emails:', [...new Set(duplicateEmails)]);
    }

    // 2. Test username uniekheid
    console.log('👤 Test Username Uniekheid:\n');
    
    const usernames = users.map(u => u.username).filter(Boolean);
    const uniqueUsernames = [...new Set(usernames)];
    
    console.log(`📊 Gebruikers met username: ${usernames.length}`);
    console.log(`📊 Unieke usernames: ${uniqueUsernames.length}`);
    
    if (usernames.length === uniqueUsernames.length) {
      console.log('✅ Alle usernames zijn uniek\n');
    } else {
      console.log('❌ Er zijn dubbele usernames gevonden!\n');
      
      // Zoek dubbele usernames
      const duplicateUsernames = usernames.filter((username, index) => usernames.indexOf(username) !== index);
      console.log('Dubbele usernames:', [...new Set(duplicateUsernames)]);
    }

    // 3. Test display naam variaties
    console.log('🏷️  Test Display Naam Variaties:\n');
    
    users.forEach((user, index) => {
      const displayName = getDisplayName(user);
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Username: ${user.username || 'Geen username'}`);
      console.log(`   Naam: ${user.name || 'Geen naam'}`);
      console.log(`   Display Full Name: ${user.displayFullName}`);
      console.log(`   Display Option: ${user.displayNameOption || 'default'}`);
      console.log(`   → Getoond als: "${displayName}"`);
      console.log('');
    });

    // 4. Test gesprekken met verschillende identificatie methoden
    console.log('💬 Test Gesprekken Identificatie:\n');
    
    const conversations = await prisma.conversation.findMany({
      where: { isActive: true },
      include: {
        ConversationParticipant: {
          include: {
            User: {
              select: {
                id: true,
                email: true,
                username: true,
                name: true,
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
        console.log(`     🔐 Email (Auth): ${user.email}`);
        console.log(`     👤 Username (Public): ${user.username || 'Geen username'}`);
        console.log(`     🏷️  Display Name (UI): "${displayName}"`);
        console.log(`     📧 Email Uniek: ${uniqueEmails.includes(user.email) ? 'Ja' : 'Nee'}`);
        console.log(`     👤 Username Uniek: ${user.username ? (uniqueUsernames.includes(user.username) ? 'Ja' : 'Nee') : 'N/A'}`);
      });

      // Test participant filtering
      console.log(`   📋 Participant Filtering Test:`);
      conv.ConversationParticipant.forEach((participant, pIndex) => {
        const currentUserId = participant.userId;
        const currentUserEmail = participant.User.email;
        const otherParticipants = conv.ConversationParticipant.filter(p => p.userId !== currentUserId);
        
        console.log(`     Als huidige gebruiker: ${currentUserEmail}`);
        otherParticipants.forEach((other, oIndex) => {
          const otherDisplayName = getDisplayName(other.User);
          console.log(`       Ziet andere participant: "${otherDisplayName}" (${other.User.email})`);
        });
      });
      
      console.log('');
    });

    // 5. Test edge cases
    console.log('🚨 Edge Cases Test:\n');
    
    // Test gebruiker zonder username
    const usersWithoutUsername = users.filter(u => !u.username);
    console.log(`Gebruikers zonder username: ${usersWithoutUsername.length}`);
    usersWithoutUsername.forEach(user => {
      console.log(`   - ${user.email} (${user.name || 'Geen naam'})`);
    });
    
    // Test anonieme gebruikers
    const anonymousUsers = users.filter(u => u.displayFullName === false);
    console.log(`\nAnonieme gebruikers: ${anonymousUsers.length}`);
    anonymousUsers.forEach(user => {
      console.log(`   - ${user.email} → "${getDisplayName(user)}"`);
    });
    
    // Test gebruikers met verschillende display opties
    console.log(`\nDisplay Option Variaties:`);
    const displayOptions = [...new Set(users.map(u => u.displayNameOption).filter(Boolean))];
    displayOptions.forEach(option => {
      const usersWithOption = users.filter(u => u.displayNameOption === option);
      console.log(`   ${option}: ${usersWithOption.length} gebruikers`);
    });

  } catch (error) {
    console.error('❌ Fout bij testen:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functie voor display name (zoals in lib/displayName.ts)
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

// Run de test
testUserIdentification().catch(console.error);
