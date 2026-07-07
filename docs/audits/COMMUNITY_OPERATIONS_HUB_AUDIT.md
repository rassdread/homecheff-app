# Community Operations Hub Audit (Phase CE-2B)

**Date:** 2026-07-07
**Method:** Static code trace + `scripts/validate-community-operations-hub.ts`
**Related:** [COMMUNITY_ECONOMY_PHASE2B.md](../progress/COMMUNITY_ECONOMY_PHASE2B.md) · [AGREEMENTS_HUB_AUDIT.md](./AGREEMENTS_HUB_AUDIT.md)

---

## 1. Executive summary

Na CE-2A was `/profile/deals` al de centrale hub. CE-2B maakt die hub **compleet** als dagelijkse cockpit: alle open voorstellen buiten chat, een volledige cancel-flow, een expliciete "actie vereist"-sectie, een gepolijste tijdlijn (Vandaag → Historie), courier-states, unified history en één consistent cache-pad. Geen nieuwe economie of parallelle schermen.

De gebruiker kan vanuit één scherm voorstellen beheren, afspraken volgen, betalen, bezorgen, reageren, afronden en historie bekijken.

---

## 2. Bevindingen per onderdeel

| # | Onderdeel | Status | Bewijs |
|---|-----------|--------|--------|
| 2B.1 | Proposals buiten chat | ✅ | `listPendingProposalsForUser`: PENDING+COUNTERED+recente terminale statussen, `Agreement: null`, hergebruik `serializeProposal` |
| 2B.2 | Cancel flow | ✅ | `cancelCommunityOrder`: partij-only, geen COMPLETED, → CANCELLED, cascade DeliveryRequest + CourierAssignment; CTA met `window.confirm`, alleen OPEN |
| 2B.3 | Actie vereist | ✅ | Hub-sectie `sections.actionRequired` + cockpit "eerstvolgende actie"; facets uit `dealUx.primaryCta` (geen recompute) |
| 2B.4 | Timeline polish | ✅ | buckets Vandaag/Morgen/Deze week/Volgende week/Later/Nog te plannen/Historie; cockpit toont altijd volgende afspraak + actie |
| 2B.5 | Courier | ✅ | `CourierAgreementsStrip`: vandaag/acceptatie/onderweg uit `DeliveryRequestService.listForCourier`, dashboard-link |
| 2B.6 | Unified history | ✅ | `groupAgenda`: completed + cancelled deals + terminale proposals in "Historie"; reviews op deal-cards |
| 2B.7 | Cache | ✅ | Eén `loadHub`-pad; response levert items+counts+agenda+summary samen; mutaties her-fetchen hetzelfde pad |
| 2B.8 | UX / mobile | ✅ | overflow-x filters, cockpit `sm:grid-cols-2`, wrappende agenda-meta |
| 2B.9 | i18n | ✅ | nl/en parity voor cockpit, secties, buckets, courier-states |

---

## 3. Rechten & statusovergangen (cancel)

- **Wie:** alleen koper of verkoper van de order (`loadOrderForParty`).
- **Wanneer:** alleen zolang `status === 'OPEN'`; `COMPLETED` wordt geweigerd; `CANCELLED` is idempotent.
- **Gevolgen (transactie):** order → `CANCELLED`; actieve `DeliveryRequest` (OPEN/CLAIMED/ASSIGNED) → `CANCELLED`; actieve `CourierAssignment` (PENDING/ACCEPTED) → `CANCELLED`.
- **Trust:** geen review mogelijk op een geannuleerde order (deal is niet COMPLETED).

---

## 4. Cache-consistentie

`/profile/deals` gebruikt één ophaalpad. `GET /api/agreements` → `listAgreementsHubForUser` bouwt in één keer:

```
items (gefilterd) + counts (alle facetten) + agenda (gegroepeerd) + summary (sidebar-ready)
```

`ProfileDealCard`-mutaties roepen na succes `loadHub` opnieuw aan; er is geen tweede refresh-mechanisme dat kan afwijken. React Query (`USER_DEALS_QUERY_KEY`) is voorbereid voor CE-3 maar niet vereist.

---

## 5. Open gaten (CE-3)

1. Notifications bij statuswijziging / nieuw voorstel.
2. Gedeelde React Query cache chat ↔ hub ↔ delivery.
3. Sidebar-render van de bestaande `summary`.
4. Externe kalender (ICS/feed/OAuth) op basis van `agreement-calendar-event.ts`.
5. Proposal accept/counter direct in de hub.
6. `cancelReason`-persistentie (migratie).

---

## 6. Validatie

```bash
npx tsx scripts/validate-community-operations-hub.ts
```

Alle checks groen (proposals, cancel, actie-vereist, courier-states, timeline-groepen, unified history, cache, mobile parity, i18n parity).
