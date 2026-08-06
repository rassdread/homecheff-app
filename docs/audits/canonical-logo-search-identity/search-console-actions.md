# Google Search Console Actions

**Do not perform until production deploy completes.**

## 1. Validate live homepage

- URL Inspection → `https://homecheff.eu/`
- Confirm rendered HTML contains:
  - `"@type":"Organization"` with `"logo":{"@type":"ImageObject","url":"https://homecheff.eu/logo.png?v=hc8"...}`
  - `<link rel="icon" href="/favicon.ico?v=hc8">`
  - `og:image` → `https://homecheff.eu/og-brand.png?v=hc8`

## 2. Validate logo asset

- URL Inspection → `https://homecheff.eu/logo.png`
- Confirm **Page fetch: Successful**, indexable, not blocked

## 3. Request indexing

- Request indexing for homepage `https://homecheff.eu/`
- Optional: request indexing for `https://homecheff.nl/` if it serves same JSON-LD

## 4. Sitemap

- Retain existing sitemap submission — no new logo URLs required in sitemap (assets discovered via HTML/JSON-LD)

## 5. Rich Results Test

- Test homepage URL in [Rich Results Test](https://search.google.com/test/rich-results)
- Verify Organization logo field parses without error

## Timeline expectation

Google may take **days or longer** to refresh favicon beside results and Organization logo in Knowledge Panel. Do not claim update until observed.
