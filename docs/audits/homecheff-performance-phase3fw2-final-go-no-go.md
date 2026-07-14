# Phase 3F Wave 2 — Final GO / NO-GO

**Date:** 2026-07-14  
**Branch:** `performance/phase3f-first-paint`  
**Release:** interaction fix + responsive auth navigation (zie commit na push)

---

## Besluit

| Besluit | Status | Toelichting |
|---------|--------|-------------|
| **Interaction + responsive fix** | ✅ **GROEN** | HcpRewardProvider static; auth CTAs vast rechts |
| **Validators + probes lokaal** | ✅ **GROEN** | 16/16 Wave2 validator; 18/18 responsive; interaction A/B |
| **Preview build** | ⏳ **Wacht op nieuwe deploy** | Na push featurebranch |
| **Merge naar main** | 🟠 **HOLD** | Handmatige SSO Preview-checks verplicht |
| **Productie deploy** | 🔴 **HOLD** | Geen merge, geen `vercel --prod` |

---

## Fixes in deze release

1. **Interaction (P0):** `HcpRewardProvider` terug static — layout-children mount direct (SSR 7 buttons, login @ ~98ms).
2. **Responsive nav (P0):** Auth CTAs `ml-auto shrink-0`; desktop nav `lg+`; hamburger `<lg`; NavBarShell `pointer-events-none`.

---

## Criteria

| Criterion | Result |
|-----------|--------|
| UI direct interactief (lokaal) | ✅ login @ domcontentloaded |
| SSR login/register | ✅ 4 login links, 7 buttons |
| Responsive 320–2560 | ✅ 18/18 pass |
| feedFetches = 1 | ✅ |
| geoFeedMounts = 1 | ✅ |
| Hydration/console errors | ✅ 0 |
| lint / build / smoke-check | ✅ |
| Phase 13K–3F validators | ✅ |
| Preview anonymous click (handmatig) | ⏳ |
| Authenticated / logout (handmatig) | ⏳ |

---

## GO/HOLD merge naar main

**HOLD** tot handmatige Preview GO op:
- anonymous cold: login/register eerste klik
- responsive 1280/900/768/320
- authenticated + logout (indien mogelijk)

**GROEN voor mergevoorbereiding** wanneer bovenstaande Preview-checks slagen.

---

## Niet gedaan

- ❌ Merge naar `main`
- ❌ `npx vercel --prod`
- ❌ `npx prisma migrate deploy`
- ❌ Database / Neon / Render wijzigingen
