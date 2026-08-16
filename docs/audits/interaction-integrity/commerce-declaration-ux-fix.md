# Commerce declaration UX fix (empty buttons)

**Main before:** `c027f99b4ee536dcb486067bd78b7ead4c423dd0`  
**Production before:** `dpl_3i8P86yrNXbT5CpyypxobAU3S8c1`

## Root cause

Not CSS color. Labels disappeared because:

1. `t()` returns `''` for missing keys (by design — hide raw keys).
2. New `legal3.inlineDeclaration.*` keys were shipped without bumping `CACHE_VERSION` (`2.36`).
3. Client localStorage + `/api/i18n` (`max-age=86400`, `force-cache`) kept pre-key translations for up to 24h.
4. Existing LEGAL-3 keys still resolved → “Status niet opgegeven” worked; buttons rendered empty.

## Fix

- Hard NL/EN fallbacks via `tOr` so empty button labels are impossible.
- Inline confirm (Bevestigen / Annuleren), not `window.confirm`.
- Neutral stacked labelled choices + icons.
- Bump i18n `CACHE_VERSION` → `2.37`.
