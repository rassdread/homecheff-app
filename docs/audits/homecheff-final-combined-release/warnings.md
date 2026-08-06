# Warnings

1. **Android not built** — Java missing; google-services.json not in worktree.
2. **Full Playwright acceptance not re-run** on the exact combined SHA after deploy (prior harness evidence merged; live HTTP crawl performed).
3. **Pre-existing adaptive-workspace sealed import warnings** still appear during Next build; build still succeeds (same class of warnings observed before this release).
4. **Google/Bing logo/favicon refresh latency** — do not claim SERP update.
5. **SEO tip not merged as git history** — remounted content; intermediate SEO branch commits remain on feature branches for archaeology.
6. **Wrong-project Vercel attempt** briefly created `hc-promote-main` error deploy — corrected; Production is on `homecheff-app`.
7. **Portrait Android splash** (`homecheff-native-splash.png`) not redesigned — launcher/A12 icon updated only.
