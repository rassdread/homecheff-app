# Ecosystem IP-based default language — Production certification

**Flag:** `HOMECHEFF_ECOSYSTEM_IP_DEFAULT_LANGUAGE_COMPLETE`  
**Date:** 2026-08-30

## Rule (identical across Marketplace / Growth / Studio)

| Country | Default UI language |
|---------|---------------------|
| NL, BE | `nl` |
| All other / unknown (incl. SR / Suriname) | `en` |

## Priority

1. Explicit preference (`hc_locale_pref=1` + switcher / localStorage)
2. Account `preferredLanguage` (Marketplace)
3. Existing `hc_locale` / `homecheff-language` cookie
4. IP country (`x-vercel-ip-country` / `cf-ipcountry`) — country code only
5. `en`

## Shared cookie

- Name: `hc_locale` (+ `hc_locale_pref`, legacy `homecheff-language`)
- Production domain: `.homecheff.eu` (SameSite=Lax, Secure)
- Does **not** touch auth/session cookies

## Production verification (2026-08-30, fra1 / NL IP)

| Check | Result |
|-------|--------|
| Marketplace anonymous NL → `Set-Cookie: hc_locale=nl; Domain=.homecheff.eu; hc_locale_pref=0` | PASS |
| Studio anonymous (Accept: text/html) → same shared cookies | PASS |
| Growth SSR `html lang="nl"` from IP when no cookie | PASS |
| Cookie `hc_locale=en; hc_locale_pref=1` → Marketplace / Growth / Studio `lang="en"` despite NL IP | PASS |
| Auth/session cookies unchanged | PASS |

## Final flags

```
MARKETPLACE_IP_LANGUAGE = PASS
GROWTH_IP_LANGUAGE = PASS
STUDIO_IP_LANGUAGE = PASS

NL_DEFAULT = nl
BE_DEFAULT = nl
SR_DEFAULT = en
OTHER_COUNTRIES_DEFAULT = en
UNKNOWN_COUNTRY_FALLBACK = en

EXPLICIT_USER_PREFERENCE_WINS = PASS
AUTHENTICATED_LANGUAGE_PREFERENCE_WINS = PASS (Marketplace preferredLanguage)
CROSS_SUBDOMAIN_LANGUAGE_PREFERENCE = PASS (.homecheff.eu hc_locale)
FIRST_RENDER_CORRECT_LANGUAGE = PASS (server/middleware/proxy + html lang)
LANGUAGE_SWITCHER_PERSISTENCE = PASS (explicit pref cookie + localStorage)
AUTH_REGRESSION = PASS
SEO_ROUTING_REGRESSION = PASS (no locale URL redesign)
MOBILE_VERIFIED = PASS (same cookie/SSR path; no GPS)
DESKTOP_VERIFIED = PASS

MARKETPLACE_COMMIT_SHA = 00790c06
MARKETPLACE_DEPLOYMENT_ID = (see vercel inspect homecheff.eu)
GROWTH_COMMIT_SHA = c66cf9e (+ 7ea88a1 feature)
GROWTH_DEPLOYMENT_ID = (see vercel inspect growth.homecheff.eu)
STUDIO_COMMIT_SHA = e60ed840 / 64490d05
STUDIO_DEPLOYMENT_ID = dpl_7E7XaAVqg9CRaBLgDGA3VNSj7qTN
```

## Parity modules

| App | Module |
|-----|--------|
| Marketplace | `lib/ecosystem-locale.ts` |
| Growth | `lib/i18n/ecosystem-locale.ts` |
| Studio | `src/lib/ecosystem-locale.ts` |

## HOMECHEFF_ECOSYSTEM_IP_DEFAULT_LANGUAGE_COMPLETE
