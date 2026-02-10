#!/usr/bin/env node

/**
 * Chat Configuration Test Script
 * 
 * Dit script test of alle benodigde environment variabelen
 * correct zijn ingesteld voor de chat functionaliteit.
 */

// Load environment variables from .env file
require('dotenv').config();

console.log('🔍 Chat Configuratie Test\n');
console.log('=' .repeat(50));

// Test environment variabelen
const requiredVars = {
  'PUSHER_APP_ID': process.env.PUSHER_APP_ID,
  'PUSHER_SECRET': process.env.PUSHER_SECRET,
  'NEXT_PUBLIC_PUSHER_KEY': process.env.NEXT_PUBLIC_PUSHER_KEY,
  'NEXT_PUBLIC_PUSHER_CLUSTER': process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  'DATABASE_URL': process.env.DATABASE_URL,
  'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
};

const optionalVars = {
  'ENCRYPTION_SYSTEM_KEY': process.env.ENCRYPTION_SYSTEM_KEY,
};

let hasErrors = false;
let hasWarnings = false;

console.log('\n📋 Vereiste Environment Variabelen:\n');

Object.entries(requiredVars).forEach(([key, value]) => {
  if (!value || value === '' || value === 'undefined') {
    console.log(`❌ ${key}: ONTBREEKT`);
    hasErrors = true;
  } else if (key.includes('SECRET') || key.includes('KEY')) {
    // Verberg geheime waardes
    const masked = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    console.log(`✅ ${key}: ${masked}`);
  } else {
    console.log(`✅ ${key}: ${value}`);
  }
});

console.log('\n📋 Optionele Environment Variabelen:\n');

Object.entries(optionalVars).forEach(([key, value]) => {
  if (!value || value === '' || value === 'undefined') {
    console.log(`ℹ️  ${key}: niet ingesteld (optioneel)`);
  } else {
    const masked = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    console.log(`✅ ${key}: ${masked}`);
  }
});

// Test Pusher cluster
console.log('\n🌍 Pusher Cluster Check:\n');
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
const validClusters = ['mt1', 'us2', 'us3', 'eu', 'ap1', 'ap2', 'ap3', 'ap4', 'sa1'];

if (cluster && validClusters.includes(cluster)) {
  console.log(`✅ Cluster "${cluster}" is geldig`);
} else if (cluster) {
  console.log(`⚠️  Cluster "${cluster}" is mogelijk ongeldig. Geldige clusters: ${validClusters.join(', ')}`);
  hasWarnings = true;
} else {
  console.log(`❌ Geen cluster ingesteld`);
  hasErrors = true;
}

// Test database connectie
console.log('\n🗄️  Database Connectie:\n');
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`✅ Database host: ${url.hostname}`);
    console.log(`✅ Database type: ${url.protocol.replace(':', '')}`);
  } catch (e) {
    console.log(`❌ DATABASE_URL is niet geldig: ${e.message}`);
    hasErrors = true;
  }
} else {
  console.log(`❌ DATABASE_URL ontbreekt`);
  hasErrors = true;
}

// Samenvatting
console.log('\n' + '='.repeat(50));
console.log('\n📊 Samenvatting:\n');

if (hasErrors) {
  console.log('❌ Er zijn kritieke configuratieproblemen gevonden!');
  console.log('\n💡 Oplossing:');
  console.log('1. Kopieer .env.example naar .env.local');
  console.log('2. Vul alle vereiste variabelen in');
  console.log('3. Herstart de development server');
  console.log('4. Run dit script opnieuw\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Configuratie is grotendeels correct, maar heeft enkele waarschuwingen');
  console.log('✅ Je kunt de applicatie starten, maar check de waarschuwingen\n');
  process.exit(0);
} else {
  console.log('✅ Alle configuraties zijn correct!');
  console.log('🚀 Je kunt de applicatie starten\n');
  process.exit(0);
}

