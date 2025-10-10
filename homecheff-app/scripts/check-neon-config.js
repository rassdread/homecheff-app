#!/usr/bin/env node

/**
 * Check Neon Database Configuration
 * Verifies if connection strings are properly configured for optimal performance
 */

require('dotenv').config();

console.log('🔍 Checking Neon Database Configuration...\n');

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

let score = 0;
let maxScore = 0;
const recommendations = [];

// Check 1: DATABASE_URL exists
maxScore++;
if (databaseUrl) {
  console.log('✅ DATABASE_URL is configured');
  score++;
} else {
  console.log('❌ DATABASE_URL is NOT configured');
  recommendations.push('Add DATABASE_URL to your .env file');
}

// Check 2: DIRECT_URL exists
maxScore++;
if (directUrl) {
  console.log('✅ DIRECT_URL is configured');
  score++;
} else {
  console.log('❌ DIRECT_URL is NOT configured');
  recommendations.push('Add DIRECT_URL to your .env file');
}

// Check 3: DATABASE_URL uses connection pooling
maxScore++;
if (databaseUrl) {
  if (databaseUrl.includes('pgbouncer=true') || databaseUrl.includes('pooler=true')) {
    console.log('✅ DATABASE_URL uses connection pooling (pgbouncer/pooler)');
    score++;
  } else {
    console.log('⚠️  DATABASE_URL does NOT use connection pooling');
    recommendations.push(
      'Add ?pgbouncer=true to your DATABASE_URL for better performance',
      'Get pooled URL from: https://console.neon.tech → Connection Details → Pooled Connection'
    );
  }
} else {
  console.log('⚠️  Cannot check pooling (DATABASE_URL not set)');
}

// Check 4: DIRECT_URL does NOT use pooling (correct for migrations)
maxScore++;
if (directUrl) {
  if (!directUrl.includes('pgbouncer=true') && !directUrl.includes('pooler=true')) {
    console.log('✅ DIRECT_URL uses direct connection (correct for migrations)');
    score++;
  } else {
    console.log('⚠️  DIRECT_URL should NOT use connection pooling');
    recommendations.push(
      'DIRECT_URL should be a direct connection (without pgbouncer)',
      'Get direct URL from: https://console.neon.tech → Connection Details → Direct Connection'
    );
  }
} else {
  console.log('⚠️  Cannot check DIRECT_URL (not set)');
}

// Check 5: Using Neon host
maxScore++;
if (databaseUrl && databaseUrl.includes('.neon.tech')) {
  console.log('✅ Using Neon database host');
  score++;
} else if (databaseUrl) {
  console.log('ℹ️  Not using Neon.tech host (might be different provider)');
  score++; // Don't penalize non-Neon users
}

// Check 6: SSL mode
maxScore++;
if (databaseUrl && databaseUrl.includes('sslmode=require')) {
  console.log('✅ SSL mode is enabled');
  score++;
} else {
  console.log('⚠️  SSL mode not explicitly set');
  recommendations.push('Add sslmode=require to your connection strings for security');
}

console.log('\n' + '='.repeat(60));
console.log(`📊 Configuration Score: ${score}/${maxScore}`);
console.log('='.repeat(60));

if (score === maxScore) {
  console.log('\n🎉 Perfect! Your Neon configuration is optimized!');
  console.log('\n💡 Additional tips:');
  console.log('   - Consider upgrading to Neon Pro for 10x faster queries');
  console.log('   - Monitor your query performance in Neon Console');
  console.log('   - Enable autoscaling for production workloads');
} else {
  console.log('\n⚠️  Some improvements needed:\n');
  recommendations.forEach((rec, i) => {
    console.log(`   ${i + 1}. ${rec}`);
  });
  
  console.log('\n📚 Resources:');
  console.log('   - Neon Console: https://console.neon.tech');
  console.log('   - Connection Guide: https://neon.tech/docs/connect/connection-pooling');
  console.log('   - Optimization Guide: See NEON_OPTIMIZATION_GUIDE.md');
}

console.log('\n' + '='.repeat(60));

// Exit with appropriate code
process.exit(score === maxScore ? 0 : 1);

