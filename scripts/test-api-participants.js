#!/usr/bin/env node

/**
 * Test API Participants Script
 * 
 * Dit script test of de API endpoints correcte participant data retourneren
 * na de fixes voor participant identificatie.
 */

require('dotenv').config();

async function testApiEndpoints() {
  console.log('🧪 Test API Participants Endpoints\n');
  console.log('=' .repeat(80));

  try {
    // Test de conversations endpoint
    console.log('📡 Testing /api/conversations endpoint...\n');
    
    const response = await fetch('http://localhost:3000/api/conversations', {
      headers: {
        'Cookie': 'next-auth.session-token=your-session-token' // Je moet een geldige sessie hebben
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Conversations endpoint succesvol`);
      console.log(`📊 Gevonden ${data.conversations?.length || 0} gesprekken\n`);
      
      if (data.conversations && data.conversations.length > 0) {
        data.conversations.forEach((conv, index) => {
          console.log(`🔸 Gesprek ${index + 1}: ${conv.id}`);
          console.log(`   Title: ${conv.title || 'Geen titel'}`);
          console.log(`   Other Participant: ${conv.otherParticipant ? 
            `${conv.otherParticipant.name || 'Geen naam'} (${conv.otherParticipant.email || 'Geen email'})` : 
            'Geen andere participant'}`);
          console.log(`   Has Display Data: ${!!conv.otherParticipant?.displayFullName}`);
          console.log(`   Display Option: ${conv.otherParticipant?.displayNameOption || 'default'}`);
          console.log('');
        });
      }
    } else {
      console.log(`❌ Conversations endpoint fout: ${response.status}`);
      const errorText = await response.text();
      console.log(`Error: ${errorText}\n`);
    }

    // Test een specifiek gesprek (als er gesprekken zijn)
    console.log('📡 Testing specifiek gesprek endpoint...\n');
    
    // Gebruik een hardcoded conversation ID voor testing
    const testConversationId = '77a45e14-c082-4b6e-877f-61919bb4e7e1';
    
    const convResponse = await fetch(`http://localhost:3000/api/conversations/${testConversationId}`, {
      headers: {
        'Cookie': 'next-auth.session-token=your-session-token'
      }
    });

    if (convResponse.ok) {
      const convData = await convResponse.json();
      console.log(`✅ Conversation endpoint succesvol voor ${testConversationId}`);
      console.log(`📊 Conversation data:`);
      console.log(`   ID: ${convData.conversation?.id}`);
      console.log(`   Title: ${convData.conversation?.title || 'Geen titel'}`);
      console.log(`   Other Participant: ${convData.conversation?.otherParticipant ? 
        `${convData.conversation.otherParticipant.name || 'Geen naam'} (${convData.conversation.otherParticipant.username || 'Geen username'})` : 
        'Geen andere participant'}`);
      console.log(`   Has Full Display Data: ${!!convData.conversation?.otherParticipant?.displayFullName}`);
      console.log(`   Display Option: ${convData.conversation?.otherParticipant?.displayNameOption || 'default'}`);
      console.log('');
    } else {
      console.log(`❌ Conversation endpoint fout: ${convResponse.status}`);
      const errorText = await convResponse.text();
      console.log(`Error: ${errorText}\n`);
    }

    console.log('💡 Om deze test uit te voeren:');
    console.log('1. Zorg dat de development server draait (npm run dev)');
    console.log('2. Log in via de browser');
    console.log('3. Kopieer de session cookie uit browser dev tools');
    console.log('4. Vervang "your-session-token" met de echte token');
    console.log('5. Run dit script opnieuw\n');

  } catch (error) {
    console.error('❌ Fout bij testen API endpoints:', error.message);
    console.log('\n💡 Mogelijke oorzaken:');
    console.log('- Development server draait niet (run: npm run dev)');
    console.log('- Geen geldige sessie cookie');
    console.log('- Network problemen\n');
  }
}

// Run de test
testApiEndpoints().catch(console.error);
