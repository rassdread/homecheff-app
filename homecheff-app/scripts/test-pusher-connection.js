#!/usr/bin/env node

/**
 * Pusher Connection Test Script
 * 
 * Test of de Pusher verbinding werkt door een test event te versturen.
 * Gebruik dit om te debuggen als berichten niet aankomen.
 */

// Load environment variables from .env file
require('dotenv').config();

const Pusher = require('pusher');

console.log('🔌 Pusher Verbinding Test\n');
console.log('=' .repeat(50));

// Check environment variabelen
const appId = process.env.PUSHER_APP_ID;
const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';

if (!appId || !key || !secret) {
  console.log('❌ Pusher credentials ontbreken in environment');
  console.log('\nVereist:');
  console.log('  - PUSHER_APP_ID');
  console.log('  - NEXT_PUBLIC_PUSHER_KEY');
  console.log('  - PUSHER_SECRET');
  console.log('  - NEXT_PUBLIC_PUSHER_CLUSTER (optioneel, default: eu)');
  console.log('\n💡 Voeg deze toe aan je .env.local bestand\n');
  process.exit(1);
}

// Initialiseer Pusher
console.log('📡 Initialiseren Pusher client...\n');
console.log(`App ID: ${appId}`);
console.log(`Key: ${key.substring(0, 8)}...`);
console.log(`Secret: ${secret.substring(0, 8)}...`);
console.log(`Cluster: ${cluster}\n`);

const pusher = new Pusher({
  appId: appId,
  key: key,
  secret: secret,
  cluster: cluster,
  useTLS: true
});

// Test channel naam
const testChannelName = `test-channel-${Date.now()}`;
const testEventName = 'test-event';

console.log(`📤 Versturen test event naar channel: ${testChannelName}\n`);

// Verstuur test event
pusher.trigger(testChannelName, testEventName, {
  message: 'Dit is een test bericht',
  timestamp: new Date().toISOString(),
  test: true
})
.then(() => {
  console.log('✅ Test event succesvol verstuurd!\n');
  console.log('🎉 Pusher configuratie is correct!');
  console.log('\n💡 Als berichten nog steeds niet aankomen:');
  console.log('1. Check browser console voor Pusher errors');
  console.log('2. Kijk in Pusher Dashboard > Debug Console');
  console.log('3. Verifieer dat de client dezelfde credentials gebruikt');
  console.log('4. Controleer of de firewall Pusher niet blokkeert\n');
  process.exit(0);
})
.catch((error) => {
  console.log('❌ Fout bij versturen test event:\n');
  console.error(error);
  console.log('\n💡 Mogelijke oorzaken:');
  console.log('1. Onjuiste credentials (controleer Pusher dashboard)');
  console.log('2. App ID, Key, of Secret zijn verkeerd');
  console.log('3. Cluster is verkeerd ingesteld');
  console.log('4. Pusher account is niet actief');
  console.log('5. Netwerk blokkade\n');
  process.exit(1);
});

