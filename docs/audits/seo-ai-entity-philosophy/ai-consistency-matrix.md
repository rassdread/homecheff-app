# AI consistency matrix

Same semantic story for major AI/search systems (via public crawler surfaces).

| Claim | llms.txt | ai.txt | Platform SSOT | Manifest | Homepage | Pillar /wat-is | FAQ schema | OG/meta |
|-------|----------|--------|---------------|----------|----------|----------------|------------|---------|
| Digital neighbourhood marketplace | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Community / creator / craft first | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Everything starts close to home | ✓ | ✓ | ✓ (website) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Distance = priority not possibility | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Not food-only | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Not classifieds / ordinary 2nd-hand | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Not delivery / mass retail | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Transformed 2nd-hand only | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | soft |
| Local-first scalable (not “intl marketplace”) | ✓ | ✓ | ✓ | ✓ | soft | ✓ | ✓ | soft |
| Anti-drift (food / gig / resale) | — | ✓ `avoid_ai_drift` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Per-system intake path

| System | Primary intake |
|--------|----------------|
| Google | SSR HTML, JSON-LD Organization/WebSite/FAQ, meta/OG, sitemap landings |
| Bing | Same + robots.txt |
| ChatGPT / Claude / Gemini / Perplexity | `/llms.txt`, `/ai.txt`, `/wat-is-homecheff`, `/manifest`, `/constitution` |

**Conclusion:** All six receive the same entity story; no surface still positions HomeCheff as food-only marketplace, generic classifieds, or ordinary second-hand resale.
