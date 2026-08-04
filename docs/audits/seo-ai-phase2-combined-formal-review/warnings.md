# Remaining Warnings — SEO/AI Phase 2 Combined Formal Review

## Significant

1. **Empty client-side page JSON-LD shells (SeoLandingTemplate)**  
   Pillar / comparison / trust / manifest routes use client `SeoLandingTemplate`, which SSR-emits `FAQPage` / `WebPage` `<script type="application/ld+json">` tags with **empty** `name` / answer text (i18n `t()` empty before hydration). Root Organization/WebSite JSON-LD remains filled. `/faq` layout FAQPage is filled. Rebalance landings (`HomecheffSeoLanding`) are filled.  
   Phase 2’s move from `useEffect` injection to classic `JsonLdScript` made these empty shells crawler-visible (previously absent until hydration).

2. **Missing product / unknown routes soft-200**  
   `notFound()` is called in product layout, metadata sets `noindex,nofollow` + “Product Niet Gevonden”, but HTTP status remains **200** in preview — same as current Production baseline for missing products and unknown paths. Not a new regression vs Production; does not yet meet “true 404” acceptance wording.

3. **Homepage duplicate H1 in raw HTML**  
   Two non-empty `<h1>` nodes observed on `/` in AW-visible orientation path.

## Moderate

4. **twitter-image `runtime` re-export**  
   Build warning: `app/twitter-image.tsx` re-exports `runtime` from `opengraph-image`; Next does not treat it as a string literal. Image still serves 200 `image/png`.

5. **Topical sitemap food:craft ≈ 1.05**  
   Among food-token vs craft-token landings (excluding brand/core/docs), counts are ~22 vs ~21. Not food-only; `/maaltijden/*` removed from sitemap. Slight residual food weight from `eten-verkopen-*` city cluster.

6. **Robots does not disallow `/login` / `/register`**  
   App chrome partially covered; auth entry pages remain crawlable. Non-blocking.

7. **No full Lighthouse / PSI / Playwright rendered crawl**  
   Performance and rendered views are bounded local preview + inference. Chromium not installed in review worktree.

## Minor / pre-existing

8. **Build log import warnings** in sealed controlled-workspace modules (present on baseline family; build still completed).

9. **Phase 2 `validation-metrics.json` entity copy is stale** relative to Phase 2.1/2.2 SSOTs (docs-only historical artifact).

10. **`next start` standalone warning** — routes still served for this review; production uses Vercel.

11. **Hardcoded English orientation compact fallback** in `WorkspaceOrientationStrip` when translation missing.
