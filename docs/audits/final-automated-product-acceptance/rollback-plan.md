# Rollback Plan

This branch is **not merged**. No Production deploy from this acceptance branch.

If Production needs rollback of prior feed promotion:
- `vercel rollback dpl_BwJCNzWziyvCapXvfB9kndCAomXp` (pre feed-composition) or previous known-good
- Git: `428f01d2` / `5ea136ce` as documented in feed-composition-production-release
