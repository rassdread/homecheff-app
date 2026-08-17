# PX.4 — HomeCheff side of Studio contextual creation

See Studio `docs/audits/studio-px4-cross-product-audit.md` for the full cross-product audit.

HomeCheff ships:

- Owner-only listing CTA **Maak content** on `ProductSalePrimaryActions`
- Path-based deep link `/studio/from/homecheff/product/{uuid}`
- Internal HMAC projection `GET /api/internal/studio/source-context`

No listing mutation. No schema migration. Public product pages for non-owners are unchanged except that they still do not show this CTA.
