// Vercel "Ignored Build Step" (vercel.json → ignoreCommand)
// Exit code 0 = skip build, exit code 1 (non-zero) = run build
//
// Production deploys: Vercel native Git integration (push to main → build).
// Skip when the commit message contains [SKIP_DEPLOY] (case-insensitive).
//
// Skip duplicate project "homecheff-app1" (same Git repo → double builds).
// Proper fix: Vercel → homecheff-app1 → Settings → Git → Disconnect.
// This script is a safety net so pushes only produce one real build (homecheff-app).

const commitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || '';

if (/\[SKIP_DEPLOY\]/i.test(commitMessage)) {
  console.log(
    '[vercel-ignore-build] SKIP: commit message contains [SKIP_DEPLOY] — build will not run.'
  );
  process.exit(0);
}

const projectName = (process.env.VERCEL_PROJECT_NAME || '').toLowerCase();
const prodUrl = (process.env.VERCEL_PROJECT_PRODUCTION_URL || '').toLowerCase();
const deployUrl = (process.env.VERCEL_URL || '').toLowerCase();

const isDuplicateHomecheffApp1Project =
  projectName === 'homecheff-app1' ||
  prodUrl.includes('homecheff-app1.vercel.app') ||
  deployUrl.includes('homecheff-app1.vercel.app');

if (isDuplicateHomecheffApp1Project) {
  console.log(
    '[vercel-ignore-build] SKIP: project homecheff-app1 — only homecheff-app should build from Git. Disconnect Git on app1 in Vercel (Settings → Git).'
  );
  process.exit(0);
}

console.log(
  '[vercel-ignore-build] RUN: no [SKIP_DEPLOY] in commit message — build will run.'
);
process.exit(1);
