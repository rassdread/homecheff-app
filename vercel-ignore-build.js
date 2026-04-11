// Vercel "Ignored Build Step" (vercel.json → ignoreCommand)
// Exit 0 = skip build, exit 1 (non-zero) = run build
//
// Bron van waarheid voor production: Vercel native Git integration (push naar main).
// Gebruik [SKIP_DEPLOY] in de commit message alleen als je deze push bewust géén build/deploy wilt.

const commitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || '';
const forceDeploy = process.env.FORCE_DEPLOY === 'true';

if (/\[SKIP_DEPLOY\]/i.test(commitMessage)) {
  console.log('🛑 Build overgeslagen ([SKIP_DEPLOY] in commit message)');
  process.exit(0);
}

if (forceDeploy) {
  console.log('✅ Build wordt uitgevoerd (FORCE_DEPLOY=true)');
  process.exit(1);
}

// Legacy: expliciet forceren (niet meer nodig voor normale main-deploys, blijft ondersteund)
if (/\[DEPLOY\]/i.test(commitMessage)) {
  console.log('✅ Build wordt uitgevoerd ([DEPLOY] in commit message)');
  process.exit(1);
}

// Standaard: altijd builden zodat push naar main (en previews) betrouwbaar deployen
console.log('✅ Build wordt uitgevoerd (standaard: geen [SKIP_DEPLOY])');
process.exit(1);
