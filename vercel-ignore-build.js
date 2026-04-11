// Vercel "Ignored Build Step" (vercel.json → ignoreCommand)
// Exit code 0 = skip build, exit code 1 (non-zero) = run build
//
// Production deploys: Vercel native Git integration (push to main → build).
// Skip only when the commit message contains [SKIP_DEPLOY] (case-insensitive).

const commitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || '';

if (/\[SKIP_DEPLOY\]/i.test(commitMessage)) {
  console.log(
    '[vercel-ignore-build] SKIP: commit message contains [SKIP_DEPLOY] — build will not run.'
  );
  process.exit(0);
}

console.log(
  '[vercel-ignore-build] RUN: no [SKIP_DEPLOY] in commit message — build will run.'
);
process.exit(1);
