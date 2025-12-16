// Ignore Build Step Script voor Vercel (Node.js versie)
// Dit script bepaalt of een build moet worden uitgevoerd

// Check commit message voor [DEPLOY] flag
const commitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || '';
const forceDeploy = process.env.FORCE_DEPLOY === 'true';

if (commitMessage.includes('[DEPLOY]') || commitMessage.includes('[deploy]')) {
  console.log('✅ - Build wordt uitgevoerd (DEPLOY flag gevonden)');
  process.exit(1); // Voer build uit
}

if (forceDeploy) {
  console.log('✅ - Build wordt uitgevoerd (FORCE_DEPLOY=true)');
  process.exit(1); // Voer build uit
}

// Standaard: negeer de build
console.log('🛑 - Build genegeerd (gebruik [DEPLOY] in commit message of FORCE_DEPLOY=true om te deployen)');
process.exit(0); // Negeer build

