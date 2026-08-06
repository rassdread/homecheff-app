# Browser Proof

## Static / build verification

| Check | Method | Result |
|-------|--------|--------|
| ESLint | `npm run lint` | PASS |
| Production build | `npm run build` | PASS |
| TypeScript SSOT imports | compile | PASS |
| Asset generation | `npm run generate-canonical-logo-assets` | PASS |
| Android splash sync | `npm run sync-android-splash` | PASS |

## Manual browser matrix (post-deploy)

| Viewport | Page | Expected logo |
|----------|------|---------------|
| Desktop 1920 | `/` | New Globeman hero + nav icon |
| Phone portrait 390 | `/` | Nav icon-only, hero mascot |
| Phone landscape | `/login` | Nav SSOT icon |
| Tablet 768 | `/over-ons` | Header Logo md |
| Chromium tab | any | favicon.ico?v=hc8 |
| WebKit/Safari tab | any | favicon + apple-touch with hc8 query |

## Automated browser proof

Not executed in this task (no deploy). Operator should spot-check after production release.

## Old logo leakage scan

Code grep for hard-coded legacy paths (`/icon-192x192`, old hc6/hc7 queries in TSX) — **none remaining** in application code (SSOT centralized).
