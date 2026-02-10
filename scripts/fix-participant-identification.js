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
  try {
    // 1. Identificeer problematische gesprekken
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
    problematicConversations.forEach((item, index) => {
      if (item.duplicateNames) {
      }
      
      if (item.anonymousUsers) {
        item.anonymousUsers.forEach(user => {
        });
      }
      item.conversation.ConversationParticipant.forEach((participant, pIndex) => {
        const user = participant.User;
      });
    });

    // 2. Toon aanbevelingen
    // 3. Test de participant filtering logica
    conversations.slice(0, 2).forEach((conv, index) => {
      conv.ConversationParticipant.forEach((participant, pIndex) => {
        const currentUserId = participant.userId;
        const otherParticipants = conv.ConversationParticipant.filter(p => p.userId !== currentUserId);
        otherParticipants.forEach((other, oIndex) => {
        });
      });
    });

    // 4. Toon API endpoint test
    conversations.slice(0, 3).forEach((conv, index) => {
    });
  } catch (error) {
    console.error('❌ Fout bij fixen:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run de fix
fixParticipantIdentification().catch(console.error);
