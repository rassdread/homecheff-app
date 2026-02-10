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
    conversations.forEach((conv, index) => {
      conv.ConversationParticipant.forEach((participant, pIndex) => {
        const user = participant.User;
      });

      if (conv.Message[0]) {
        const lastMessage = conv.Message[0];
      }
    });

    // Zoek naar problematische gesprekken
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
      problemConversations.forEach((conv, index) => {
        if (conv.ConversationParticipant.length > 2) {
        }
        
        const anonymousParticipants = conv.ConversationParticipant.filter(p => 
          !p.User.name && !p.User.username
        );
        if (anonymousParticipants.length > 0) {
          anonymousParticipants.forEach(p => {
          });
        }
      });
    } else {
    }

    // Test participant filtering logica
    conversations.slice(0, 3).forEach((conv, index) => {
      // Simuleer de filtering zoals in de API
      const participants = conv.ConversationParticipant;
      
      participants.forEach((participant, pIndex) => {
        const currentUserId = participant.userId;
        const otherParticipants = participants.filter(p => p.userId !== currentUserId);
        const firstOtherParticipant = otherParticipants[0] || null;
        if (firstOtherParticipant) {
        }
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
