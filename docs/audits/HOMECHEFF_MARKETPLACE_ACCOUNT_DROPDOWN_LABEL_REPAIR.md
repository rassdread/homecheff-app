# HOMECHEFF MARKETPLACE — ACCOUNT DROPDOWN LABEL REPAIR

**Date:** 2026-08-31  
**Surface:** https://homecheff.eu — authenticated profile dropdown (`NavBar`)  
**Repo:** `homecheff-app`  
**Local SHA (pre-deploy):** uncommitted on `main` after `00790c06`

---

## Verdict

```
HOMECHEFF_MARKETPLACE_ACCOUNT_DROPDOWN_LABELS_READY = NO
```

Fix implemented locally; **Production certification pending deploy** (screenshot showing icon + text on every upper row).

---

## Root cause

```
ROOT_CAUSE = MyHomeCheffNavLinks rendered icon + t(labelKey) spans, but useTranslation t() returns an empty string when keys are missing from stale browser i18n cache (CACHE_VERSION not invalidated after myHomeCheffHub.nav.* keys shipped) or before translations finish loading. Icons remained visible; text nodes were empty — producing icon-only rows. Lower account items (Mijn Profiel, Berichten, …) use older navbar.* keys still present in cache, so labels appeared normal.
```

### Forensic map

| Field | Value |
|---|---|
| `ACCOUNT_MENU_COMPONENT` | `components/NavBar.tsx` (profile dropdown portal) |
| `TOP_NAV_SECTION_COMPONENT` | `EcosystemAccountNavLinks` + `MyHomeCheffNavLinks` |
| `MENU_ITEM_COMPONENT` | `Link` / `<a>` rows with Lucide icon + `<span>` label |
| `I18N_NAMESPACE` | `myHomeCheffHub.nav.*`, `myHomeCheffHub.modules.*` |
| `RESPONSIVE_CLASSES` | `min-w-0 flex-1 truncate` on label spans; dropdown width 280px |

---

## Fix summary

1. **`components/ecosystem/EcosystemAccountNavLinks.tsx`** (new) — ecosystem block with **icon + visible label** for Mijn HomeCheff, Marketplace, Studio, Growth, Affiliate; current module shows “Huidig / Current”.
2. **`components/my-homecheff/MyHomeCheffNavLinks.tsx`** — `NAV_LABEL_FALLBACKS` + `resolveNavLabel()` so labels never render empty; `excludeIds` to avoid duplicating hub/affiliate.
3. **`components/NavBar.tsx`** — desktop dropdown: ecosystem block first, then operational links (orders/seller/…), then account section; dropdown width 224 → **280px**.
4. **`hooks/useTranslation.ts`** — `CACHE_VERSION` **2.38 → 2.39** to flush stale caches missing nav keys.

---

## Upper section inventory (after repair)

| Icon | Label (NL) | Destination |
|---|---|---|
| LayoutGrid | Mijn HomeCheff | https://homecheff.eu/mijn-homecheff |
| Store | HomeCheff Marketplace | https://homecheff.eu/ |
| Palette | HomeCheff Studio | Studio SSO ecosystem entry |
| Rocket | HomeCheff Growth | Growth SSO ecosystem entry |
| Users | HomeCheff Affiliate | https://homecheff.eu/affiliate |
| *(operational rows below divider)* | | |
| Package | Mijn bestellingen | /orders |
| Store | Verkopen | seller ops (role-gated) |
| Truck | Bezorging | delivery (role-gated) |
| TrendingUp | Verdiensten | finance (role-gated) |
| Settings | Instellingen | /settings |

Permission gating unchanged — items only render when `listMyHomeCheffNavItems` includes them.

---

## Required flags

| Flag | Status |
|---|---|
| `ACCOUNT_DROPDOWN_TOP_LABELS_VISIBLE` | PASS (code) |
| `NO_ICON_ONLY_ACCOUNT_MENU_ROWS` | PASS (code) |
| `MENU_LABEL_MATCHES_DESTINATION` | PASS |
| `CURRENT_MODULE_CLEAR` | PASS (“Huidig”) |
| `DESKTOP_DROPDOWN_LABELS` | PASS (code) |
| `MOBILE_DROPDOWN_LABELS` | PASS (fallbacks on MyHomeCheffNavLinks) |
| `NL_MENU_I18N` | PASS |
| `EN_MENU_I18N` | PASS |
| `ALL_MENU_ITEMS_ACCESSIBLE_NAME` | PASS (visible text) |
| `ADMIN_PERMISSION_PRESERVED` | PASS |
| `ECOSYSTEM_AUTH_PRESERVED` | PASS |
| `NO_DROPDOWN_HORIZONTAL_OVERFLOW` | PASS (truncate + 280px) |

---

## Deploy

```
FEATURE_COMMIT = (pending commit)
PRODUCTION_SHA = 00790c06 (bug present)
DEPLOYMENT_ID = (pending)
```

After deploy: open account menu on homecheff.eu, confirm every upper row shows icon + text; capture screenshot for `NO_ICON_ONLY_NAV_ROWS = PASS`.
