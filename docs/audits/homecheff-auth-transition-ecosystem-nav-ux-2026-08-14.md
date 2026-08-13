# Certification — Auth transition + Ecosystem navigation UX (2026-08-14)

**Status:** Code ready for Production deploy — **Human HC-AUTH-1–3 + NAV-1–7 PENDING**  
**Unified Branding / SP.2C:** **NO-GO**

## Fixes shipped (this pass)

### Issue A — Google post-auth glitch
| Fix | Detail |
|---|---|
| Root cause | NavBar treated `status === 'loading'` as guest (Inloggen/Aanmelden); hard `location.replace` remount without SSR session seed |
| NavBar | Guest CTAs only when `unauthenticated`; loading → neutral pulse |
| NavBarShell | Neutral skeleton (not CTA-shaped) |
| SessionProvider | Seeded from RSC `auth()` in root layout |
| Social success | Soft `router.replace` on desktop; hard replace retained on iOS/Safari |
| Redirect | Preserve sanitized `?next=` on `/auth/social-success` |

### Issue B — Placement
| Product | After |
|---|---|
| HomeCheff | Desktop top header (language cluster); removed profile duplicate |
| Studio | Header only; removed account-menu duplicate |
| Growth | Sidebar **top** above nav links; marketing visible on all breakpoints |

### Issue C — Clipping
All three menus: `createPortal` → `document.body` + viewport-aware fixed positioning + Escape/outside-click.

## Human matrix

| Test | Status |
|---|---|
| HC-AUTH-1–3 | PENDING |
| NAV-1–7 | PENDING |

Silent SSO / shared product cookies: **unchanged / NO**.
