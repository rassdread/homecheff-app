// Vercel "Ignored Build Step" (vercel.json → ignoreCommand)
// Exit code 0 = skip build, exit code 1 (non-zero) = run build.
//
// homecheff-app is the production app for homecheff.eu.
// homecheff-app1 is a duplicate Git connection and always skips.
// The three Verdiencheck projects are extra connections to this same
// repository root. They build only when their own area, or a shared
// build input, changes. An unreadable diff still builds.

const { execSync } = require('node:child_process');
const { decideVercelProjectIgnore } = require('./lib/deploy/vercel-project-ignore');

function changedPaths() {
  const current = process.env.VERCEL_GIT_COMMIT_SHA || 'HEAD';
  const previous = process.env.VERCEL_GIT_PREVIOUS_SHA || '';
  const range = previous && previous !== current ? `${previous} ${current}` : 'HEAD^ HEAD';
  try {
    const output = execSync(`git diff --name-only ${range}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output.split('\n').map((line) => line.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

const decision = decideVercelProjectIgnore({
  projectName: process.env.VERCEL_PROJECT_NAME || '',
  commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || '',
  changedPaths: changedPaths(),
});

if (decision.action === 'skip') {
  console.log(`[vercel-ignore-build] SKIP: ${decision.reason}`);
  process.exit(0);
}

console.log(`[vercel-ignore-build] RUN: ${decision.reason}`);
process.exit(1);
