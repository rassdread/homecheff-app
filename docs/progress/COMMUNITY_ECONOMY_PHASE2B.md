# Community Economy Phase 2B — Operations Hub Completion

**Date:** 2026-07-07
**Status:** Complete
**Scope:** "Mijn Afspraken" (`/profile/deals`) afmaken tot dagelijkse operationele cockpit. Geen nieuwe economie, backend-architectuur, notifications, betaalmethodes, exchange chains, externe kalender-sync of sidebar-redesign.

Bouwt voort op CE-2A (unified hub + agenda + calendar-readiness). Deze fase levert de laatste ontbrekende schakels en polish.

---

## Afgerond

| Fase | Resultaat |
|------|-----------|
| **CE-2B.1** Proposals buiten chat | Hub toont PENDING + COUNTERED (open) én recente EXPIRED/REJECTED/CANCELLED (historie) via `listPendingProposalsForUser` (hergebruikt `serializeProposal`) |
| **CE-2B.2** Cancel flow | `POST /api/community-orders/[id]/cancel` → `cancelCommunityOrder`; rechten (partij-only), statusguards (geen COMPLETED), cascade naar DeliveryRequest + CourierAssignment; CTA met confirm |
| **CE-2B.3** Actie vereist | Aparte "Actie vereist"-sectie boven de lijst + cockpit "eerstvolgende actie"; afgeleid uit bestaande `dealUx` (geen herberekening) |
| **CE-2B.4** Timeline polish | Agenda-buckets Vandaag / Morgen / Deze week / Volgende week / Later / Nog te plannen / Historie; cockpit toont altijd volgende afspraak + eerstvolgende actie |
| **CE-2B.5** Courier | `CourierAgreementsStrip` toont vandaag gepland / wacht op acceptatie / onderweg via bestaande `DeliveryRequestService`-feed; link naar dashboard (geen 2e dashboard) |
| **CE-2B.6** Unified history | Afgeronde deals + geannuleerde deals + terminale proposals in één "Historie"-groep; reviews staan op de afgeronde deal-cards |
| **CE-2B.7** Cache | Eén refresh-pad (`loadHub`) laadt items + counts + agenda + summary samen; geen divergente refresh |
| **CE-2B.8** UX | Mobiel: horizontaal scrollende filters, cockpit 1-koloms→2-koloms, wrappende agenda-meta; zo min mogelijk klikken |
| **CE-2B.9** i18n | nl/en parity voor cockpit, secties, agenda-buckets, courier-states |

---

## Rapportage

### 1. Welke operationele schermen bestaan nog

| Scherm | Rol |
|--------|-----|
| `/profile/deals` — **Mijn Afspraken** | centrale cockpit (proposals, deals, betalingen, bezorging, acties, afronding, historie) |
| `/messages/[conversationId]` | chat blijft de plek om proposals te accepteren/counteren (actiebron; hub linkt ernaartoe) |
| `/delivery/dashboard` | volledig courier-werkscherm (job-details, claim/accept/complete); hub toont alleen een samenvattingsstrip |
| `/deal-review`, `/delivery-review` | post-completion review-flows (bereikbaar vanaf de cards) |
| `/agreements` | redirect-alias → `/profile/deals` |

### 2. Welke dubbele schermen zijn verdwenen

- Geen parallelle agreements-hub: `components/agreements/AgreementsHubClient.tsx` is in CE-2A opgegaan in `ProfileDealsClient`.
- Geen tweede courier-dashboard: courier-info leeft als lichte strip in de hub, details blijven in `/delivery/dashboard`.
- Open voorstellen hoeven niet meer per gesprek gezocht te worden — ze staan gebundeld in de hub.

### 3. Hoe de cache synchroon blijft

- De hub heeft **één** ophaalpad: `loadHub(filter)` roept `GET /api/agreements` aan en zet items, counts, agenda én summary uit **dezelfde** response. Geen losse, uiteenlopende refreshes.
- Elke mutatie (cancel, complete, delivery-request via `ProfileDealCard`) roept na succes `loadHub` opnieuw aan → overal dezelfde status.
- `USER_DEALS_QUERY_KEY` staat klaar voor een latere React Query-migratie (CE-3), maar is nu bewust nog niet vereist: het single-fetch-pad voorkomt dubbele refresh-paden.

### 4. Welke acties kunnen nu vanuit één hub

Voorstellen bekijken/openen · afspraken volgen · betalen (HomeCheff) · afspraak afronden · bezorging aanvragen/volgen · reageren op voorstellen (via chat-CTA) · annuleren (met confirm) · reviews plaatsen · courier-jobs zien · historie bekijken — allemaal vanaf `/profile/deals`.

### 5. Welke CE-3 onderdelen blijven over

1. Notifications (push/e-mail) bij statuswijziging of nieuw voorstel.
2. React Query two-way cache tussen chat ↔ hub ↔ delivery (nu: refetch per scherm).
3. Sidebar-herontwerp dat de al beschikbare `summary` rendert.
4. Externe kalenderintegratie (ICS/feed/OAuth) — helper `agreement-calendar-event.ts` staat klaar.
5. Proposal accept/counter direct vanuit de hub (nu: chat blijft actiebron).
6. `cancelReason`-persistentie (vereist migratie).

---

## Nieuwe / gewijzigde bestanden

| Bestand | Wijziging |
|---------|-----------|
| `lib/agreements/agreement-agenda.ts` | buckets today/tomorrow/thisWeek/nextWeek/later; terminale proposals + cancelled deals → historie; `nextAction` in summary |
| `lib/agreements/agreements-hub-types.ts` | agenda-bucket + summary types uitgebreid |
| `lib/agreements/list-pending-proposals-for-user.ts` | PENDING + COUNTERED + recente terminale statussen |
| `lib/agreements/agreements-hub-filters.ts` | terminale proposals → CANCELLED-facet |
| `components/profile/ProfileDealsClient.tsx` | cockpit-strip, actie-vereist-sectie, nieuwe agenda-groepen |
| `components/agreements/CourierAgreementsStrip.tsx` | courier-states (vandaag/acceptatie/onderweg) |
| `public/i18n/{nl,en}.json` | cockpit, secties, agenda-buckets, courier-states |
| `scripts/validate-community-operations-hub.ts` | nieuwe CE-2B validator |

---

## Validatie

```bash
npx tsx scripts/validate-agreements-hub.ts          # CE-2A regressie
npx tsx scripts/validate-community-operations-hub.ts # CE-2B
```
