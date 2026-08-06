# Selected Release Sources

| Order | Source | How integrated |
|------|--------|----------------|
| 1 | `origin/main` @ `23043a7d` | Baseline |
| 2 | SEO/founder/privacy tip content from `seo/phase3-3-1-founder-refinement` | **Remount** onto current main (tip-only pages/libs + additive FAQ/sitemap/identity wiring). Full tip merge blocked by divergent Phase-2 history already remounted on main. |
| 3 | `feature/canonical-logo-identity` @ `f7077d46` | `git merge --no-ff` |
| 4 | `test/final-automated-product-acceptance` @ `611a4b83` | `git merge --no-ff` (harness + evidence only) |
| 5 | Remount fix | `6e30ddbf` restore `platformEntityId` + `LLMS_FULL_TXT` |
| 6 | Final promote | `7a3b24c5` merge `--no-ff` into main |

## Explicitly not merged independently

All intermediate `seo/phase2-*` / `seo/phase3-*` branches except the remounted tip content — already contained in tip ancestry, and Phase-2 runtime already present on main.
