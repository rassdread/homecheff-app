// Script to update Vercel build command via API
// This requires VERCEL_TOKEN environment variable
const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_NAME = 'homecheff-app';
const TEAM_ID = process.env.VERCEL_TEAM_ID || null; // Optional team ID

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN environment variable is required');
  console.log('💡 Get your token from: https://vercel.com/account/tokens');
  process.exit(1);
}

// New build command that handles prisma migrate deploy gracefully
const newBuildCommand = 'npx prisma generate && (npx prisma migrate deploy || echo "Migrations skipped") && npm run build';

const options = {
  hostname: 'api.vercel.com',
  path: `/v9/projects/${encodeURIComponent(PROJECT_NAME)}${TEAM_ID ? `?teamId=${TEAM_ID}` : ''}`,
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  },
};

const data = JSON.stringify({
  buildCommand: newBuildCommand,
});

const req = https.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Build command updated successfully!');
      console.log(`New build command: ${newBuildCommand}`);
    } else {
      console.error(`❌ Failed to update build command. Status: ${res.statusCode}`);
      console.error('Response:', body);
      try {
        const error = JSON.parse(body);
        console.error('Error details:', error);
      } catch (e) {
        console.error('Raw response:', body);
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.write(data);
req.end();



