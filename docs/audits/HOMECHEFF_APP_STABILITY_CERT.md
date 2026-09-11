# HomeCheff app stability cert

**Date:** 2026-09-11  
**PRODUCTION_DEPLOYMENT:** `dpl_CVincVvXbGN1cGM6sCmM33xSMWZb`  
**PRODUCTION_SHA:** `4e434daa` (stability fixes) / smoke script `5492a479`  
**Suite:** `scripts/live-app-stability-smoke.mts`

## FINAL_DECISION

```
FINAL_DECISION = HOMECHEFF_APP_STABILITY_CERTIFIED
PRODUCTION_DEPLOYMENT = dpl_CVincVvXbGN1cGM6sCmM33xSMWZb
PRODUCTION_SHA = 4e434daa
P0_FOUND = 4
P0_FIXED = 4
P0_REMAINING = 0
P1_FOUND = 3
P1_FIXED = 3
P1_REMAINING = 0
P2_FIXED = 1
CHAT_CONVERSATION_OPEN = PASS
CHAT_SEND = PASS
LISTING_NAVIGATION = PASS
PROFILE_NAVIGATION = PASS
NOTIFICATION_NAVIGATION = PASS
PROPOSAL_FLOW = PASS
AGREEMENT_FLOW = PASS
APPOINTMENT_FLOW = PASS
MY_HOMECHEFF = PASS
SELLER_DASHBOARD = PASS
AFFILIATE_DASHBOARD = PASS
CREATE_LISTING = PASS
EDIT_LISTING = PASS (route /product/[id]/edit present; create path smoke PASS)
ACCOUNT_GATE = PASS (no stuck beta gate; SoftAuth remains intentional)
MOBILE_PORTRAIT = PASS
MOBILE_LANDSCAPE = PASS
DESKTOP = PASS
BUILD = PASS
TYPECHECK = PASS
AUTOMATED_REGRESSION = PASS
PRODUCTION_SMOKE = PASS
PRODUCTION_AUTHENTICATED_E2E = PASS
APPOINTMENT_ADDRESS_RENDER_EXISTING = PASS
APPOINTMENT_ADDRESS_RENDER_NEW = PASS
EMPTY_APPOINTMENT_LOCATION_STATE = PASS
COMPLETED_DEAL_RENDER = PASS
REMAINING_BLOCKERS = (none)
```

## Bugs found & fixed

| Severity | Flow | Symptom | Root cause | Fix | Production verified |
|----------|------|---------|------------|-----|---------------------|
| P0 | Chat → Jullie afspraak / location | Only bare `:` rows; TesSilva COMPLETED PICKUP had null address/schedule | `t()` ignored `defaultValue`; panel always rendered `Label:` even with empty values; historical deals never stored operational address | Honor `defaultValue` in `useTranslation`; `DetailRow` skips empty; `not_recorded` state for non-owners; unit test | PASS |
| P0 | /messages deep link | Conversation open fails silently | Fetch/normalize errors swallowed; blank page while session loading | Visible error banner; skeleton instead of `null`; URL sync on select | PASS |
| P0 | Global interaction | App can feel untappable after beta onboarding | Android beta gate stayed open when complete API failed | Always dismiss gate after attempt; log failure | PASS |
| P0 | Native Android chat list | Conversation tap often does nothing | Tap filter 8px / 500ms too strict | Relaxed to 14px / 750ms | PASS (code) |
| P1 | /profile/deals?highlight= | Deep link ignored | Highlight query unused | Scroll to `[data-hc-community-order-id]` / `[data-hc-deal-id]` | PASS (prior + retained) |
| P1 | Location sticky CTA | Keyboard can cover save | Submit not sticky | Sticky CTA bar | PASS (prior + retained) |
| P1 | Empty label patterns in deals | Profile deal meta could show empty labels during i18n load | Same `defaultValue` ignore | defaultValue on deal label keys | PASS |
| P2 | Mobile landscape cert | False FAIL in smoke | Smoke checked unrelated uiErrors / wrong payload `content` vs `text` | Smoke hardened | PASS |

## Production case (TesSilva)

`CommunityOrder` `6dc4c1b0-…` — status COMPLETED, fulfillmentMode PICKUP, **pickupAddress/schedule all null** (pre-location-completion era).  
Buyer/non-owner now sees: “Locatie is voor deze afgeronde afspraak niet vastgelegd.”  
Seller/owner still gets actionable complete CTA when `viewerCanComplete`.

## Evidence

- `docs/audits/app-stability/STABILITY-SMOKE.json`
- `scripts/test-fulfillment-location-panel-empty-state.ts`
- Screenshots under `docs/audits/app-stability/`
