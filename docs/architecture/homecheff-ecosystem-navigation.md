# HomeCheff Ecosystem Navigation

**Status:** Implemented (discovery + navigation layer)  
**Identity:** HomeCheff remains canonical IdP. This component does **not** mint sessions.

## Canonical terminology

| UI | Copy |
|---|---|
| Trigger label | **Ontdek HomeCheff** |
| Panel heading | **Meer van HomeCheff** |
| Support | Ontdek wat je nog meer kunt doen met HomeCheff. |

## Products

| Id | Name | Benefit | URL |
|---|---|---|---|
| homecheff | HomeCheff | Ontdek, deel en verdien lokaal. | https://homecheff.eu |
| studio | HomeCheff Studio | Maak content met creatieve AI. | https://studio.homecheff.eu |
| growth | HomeCheff Growth | Vind klanten en laat je bedrijf groeien. | https://growth.homecheff.eu |

Current product shows **Je bent hier** and is not treated as an outbound switch.

## Brand asset

Canonical square mark (SSOT in HomeCheff `lib/brand/canonical-logo.ts`):

`https://homecheff.eu/icon-192.png?v=hc8`

Studio/Growth reference this URL — they do not invent alternate HomeCheff marks.

## Placement

| Product | Desktop | Mobile | Public |
|---|---|---|---|
| HomeCheff | **Top header** (next to language), guest + auth | Hamburger menu | Guest header + mobile |
| Studio | Header control (sole primary) | Header control | Same AppShell (public pages keep public) |
| Growth | **Sidebar top** (above primary nav links) | Top bar compact control | Marketing header (all breakpoints) |

Profile/account menus do **not** bury the primary discovery entry.

## Panel positioning

Ecosystem panels render via `createPortal` → `document.body` with viewport-aware `fixed` coordinates (flip up/down, clamp edges). Escape + outside click close. No parent `overflow` clipping.

## SSO behavior

Links are plain navigations to product origins.

- If a central HomeCheff session exists and the target private surface has no product session → existing **silent SSO** runs.
- Navigation never creates `studio_session` / `growth_session` / shared `.homecheff.eu` product cookies.
- Account switching remains the separate **Use another account** / `select_account` flow.

## Analytics

Events (no PII):

- `ecosystem_menu_open` — `sourceProduct`, `authenticated`, `surface`, `viewport`
- `ecosystem_product_click` — + `targetProduct`

## Accessibility

Keyboard (Escape), outside click, `aria-expanded` / `aria-controls` / dialog label, text labels mandatory, focus-visible outlines.
