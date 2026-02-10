#!/usr/bin/env node

/**
 * Check Neon Database Configuration
 * Verifies if connection strings are properly configured for optimal performance
 */

require('dotenv').config();
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

let score = 0;
let maxScore = 0;
const recommendations = [];

// Check 1: DATABASE_URL exists
maxScore++;
if (databaseUrl) {
  score++;
} else {
  recommendations.push('Add DATABASE_URL to your .env file');
}

// Check 2: DIRECT_URL exists
maxScore++;
if (directUrl) {
  score++;
} else {
  recommendations.push('Add DIRECT_URL to your .env file');
}

// Check 3: DATABASE_URL uses connection pooling
maxScore++;
if (databaseUrl) {
  if (databaseUrl.includes('pgbouncer=true') || databaseUrl.includes('pooler=true')) {
    score++;
  } else {
    recommendations.push(
      'Add ?pgbouncer=true to your DATABASE_URL for better performance',
      'Get pooled URL from: https://console.neon.tech → Connection Details → Pooled Connection'
    );
  }
} else {
}

// Check 4: DIRECT_URL does NOT use pooling (correct for migrations)
maxScore++;
if (directUrl) {
  if (!directUrl.includes('pgbouncer=true') && !directUrl.includes('pooler=true')) {
    score++;
  } else {
    recommendations.push(
      'DIRECT_URL should be a direct connection (without pgbouncer)',
      'Get direct URL from: https://console.neon.tech → Connection Details → Direct Connection'
    );
  }
} else {
}

// Check 5: Using Neon host
maxScore++;
if (databaseUrl && databaseUrl.includes('.neon.tech')) {
  score++;
} else if (databaseUrl) {
  score++; // Don't penalize non-Neon users
}

// Check 6: SSL mode
maxScore++;
if (databaseUrl && databaseUrl.includes('sslmode=require')) {
  score++;
} else {
  recommendations.push('Add sslmode=require to your connection strings for security');
}
if (score === maxScore) {
} else {
  recommendations.forEach((rec, i) => {
  });
}
// Exit with appropriate code
process.exit(score === maxScore ? 0 : 1);

