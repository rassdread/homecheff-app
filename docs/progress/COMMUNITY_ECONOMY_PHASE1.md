# Community Economy Phase 1 — Closed Loop

**Date:** 2026-07-07  
**Status:** Audit complete · targeted wiring fixes shipped in CE-1  
**Scope:** Buurthulp → REQUEST → Proposal → Deal → Uitvoering → Afronden (no new payment rails, notifications, or ranking)

---

## Doel

Eén gesloten buurt-economie binnen bestaande systemen:

```
Buurthulp / Dienst / Verzoek
  → Proposal
  → Deal (CommunityOrder)
  → Uitvoering (+ Delivery indien nodig)
  → Afronden
  → Vertrouwen (DiscoveryTrustContract)
```

---

## Afgerond in CE-1 (audit + fixes)

| Fase | Resultaat |
|------|-----------|
| **CE-1.1** REQUEST → Proposal | Detail, tiles, preview, gezocht discovery — proposal CTA aanwezig |
| **CE-1.2** SERVICE → Proposal | Detail matrix voor SERVICE/TASK/COACHING; **preview** uitgebreid met proposal CTA |
| **CE-1.3** Buurthulp → REQUEST | Variant- en registry-CTA's wijzen naar `/?chip=gezocht#homecheff-feed`; economy surfaces gebruiken variant `actionHref` |
| **CE-1.4** Deal types | Geïnventariseerd in audit (Prisma enums + settlement matrix) |
| **CE-1.5** Completion | `completeCommunityOrder` + delivery complete API; cancel API ontbreekt (gap) |
| **CE-1.6** Trust | `DiscoveryTrustContract.completedDeals` in tiles, detail, ranking |
| **CE-1.7** Dashboard | `/profile/deals` + delivery dashboard; **profile sidepanel** link naar deals |
| **CE-1.8** Mobile | Sticky proposal CTA; trust/value desktop-only kolommen (gap) |
| **CE-1.9** i18n | Community economy keys in `en.json` / `nl.json` |

---

## Code changes (CE-1)

| Bestand | Wijziging |
|---------|-----------|
| `lib/discovery/surfaces/resolve-opportunity-economy-surfaces.ts` | Buurthulp `actionHref` van variant-contract |
| `lib/discovery/opportunities/opportunity-registry.ts` | Default COMMUNITY_HELPER → gezocht feed |
| `components/marketplace/previews/MarketplacePreviewActions.tsx` | Proposal CTA voor SERVICE/TASK/COACHING/REQUEST |
| `components/profile/v2/ProfileV2OwnerSidepanel.tsx` | Link naar `/profile/deals` |
| `public/i18n/en.json`, `nl.json` | `profileV2.sidepanel.community.dealsDesc` |

---

## Validatie

```bash
npx tsx scripts/validate-community-economy-loop.ts
```

Controleert: REQUEST/SERVICE proposal paden, Buurthulp→gezocht, completion APIs, dashboard routes, trust compatibility, mobile sticky, i18n parity.

---

## Bekende gaten (CE-2 kandidaten)

1. **Community-order cancel** — geen `POST /api/community-orders/[id]/cancel`; status `CANCELLED` bestaat wel in schema
2. **Proposal prefill** — `proposal-prefill.ts` vult alleen `PRODUCT`-context; REQUEST/SERVICE starten met leeg formulier
3. **Mobile trust/value** — `ProductSaleCommerceZone` trust- en value-exchange-blokken `hidden lg:block`
4. **MONEY_AND_BARTER sticky** — asymmetrie tussen order en proposal op smalle viewports
5. **Sticky proposal chat-gate** — `ProductSaleStickyCta` vereist chat in `publicContactChannels`
6. **DIRECT_CONTACT bevestiging** — geen expliciete “eigen risico”-copy in deal-accept flow (zie 5G-A audit)

---

## Volgende fase (aanbevolen CE-2)

1. Proposal prefill voor REQUEST + SERVICE (bestaande taxonomy + settlement helpers)
2. Community-order cancel API + DealCard CTA
3. Mobile parity: trust/value exchange in commerce zone zonder desktop-only hide
4. Unified “Mijn afspraken” entry in hoofdnav (naast profile sidepanel)
5. Delivery status op `/profile/deals` (parity met DealCard in chat)

---

## Gerelateerde documenten

- [COMMUNITY_ECONOMY_CLOSED_LOOP_AUDIT.md](../audits/COMMUNITY_ECONOMY_CLOSED_LOOP_AUDIT.md)
- [MARKETPLACE_CHAT_DEAL_DELIVERY_COMMITMENT_AUDIT.md](../audits/MARKETPLACE_CHAT_DEAL_DELIVERY_COMMITMENT_AUDIT.md)
- ADR Phase 2 REQUEST discovery (`scripts/validate-marketplace-request-discovery.ts`)
