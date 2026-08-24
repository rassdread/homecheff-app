# SEO 1 — Entity graph + ecosystem landings (implementation note)

**Status:** Code complete across Marketplace / Growth / Studio (SEO-only; no billing/HC/payout economics changed).

## Parent-domain routes (homecheff.eu)

| Path | Intent | Canonical |
|------|--------|-----------|
| `/ecosystem` | Participation story + entity relationships | `https://homecheff.eu/ecosystem` |
| `/studio` | Parent-brand Studio explanation (not the app) | `https://homecheff.eu/studio` |
| `/growth` | Parent-brand Growth explanation (no SSO redirect) | `https://homecheff.eu/growth` |
| `/affiliate` | Ecosystem-wide affiliate/partner explanation | `https://homecheff.eu/affiliate` |

Apex `/growth` **no longer** permanently redirects to `growth.homecheff.eu`.

## Entity graph @ids

- `https://homecheff.eu/#organization` — HomeCheff brand
- `https://homecheff.eu/#legal-operator` — Arrias Beheer B.V.
- `https://homecheff.eu/#website` / `#platform` / `#marketplace`
- `https://studio.homecheff.eu/#app`
- `https://growth.homecheff.eu/#app`
- `https://homecheff.eu/#affiliate`

## sameAs

See `homecheff-ecosystem-seo-1-sameas-inventory.md`.

## Cross-domain

- Growth/Studio SoftwareApplication nodes reference parent `#organization`.
- Marketing/footer nav uses public product roots; authenticated Ontdek menu may still use silent SSO.
- Growth ecosystem context + SEO footer link to parent `/ecosystem`, `/studio`, `/affiliate`.

## External remainders

- Search Console submission = Product Owner
- Sitelinks cannot be guaranteed
