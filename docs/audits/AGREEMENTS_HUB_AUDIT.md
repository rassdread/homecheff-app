# Agreements Hub Audit (Phase CE-2A)

**Date:** 2026-07-07
**Method:** Static code trace + `scripts/validate-agreements-hub.ts`
**Related:** [COMMUNITY_ECONOMY_PHASE2A_AGREEMENTS_HUB.md](../progress/COMMUNITY_ECONOMY_PHASE2A_AGREEMENTS_HUB.md)

---

## 1. Executive summary

Operationele informatie was **verspreid**: chat (proposals/deals), `/profile/deals` (alleen geaccepteerde CommunityOrders), delivery dashboard (courier), losse review-routes. Gebruikers moesten zelf weten waar te kijken.

**CE-2A conclusie:** `/profile/deals` is de **sterkste bestaande basis** voor "Mijn Afspraken". Daarom is dat scherm uitgebreid tot de centrale operationele hub — **geen** parallelle tweede hub. `/agreements` bestaat alleen nog als **redirect-alias** naar `/profile/deals`.

De hub aggregeert **pending/countered proposals** + **profile deals** met filters, timeline, next action, chat-CTA, cancel en een lichte courier-strip.

---

## 2. Waarom /profile/deals de basis blijft

| Criterium | /profile/deals | Losse `/agreements` route |
|-----------|----------------|---------------------------|
| Bestaande rijke deal-DTO (`ProfileDealDTO`) | ✅ hergebruikt | zou dupliceren |
| Bestaande `ProfileDealCard` (payment/delivery/CTA) | ✅ | dupliceert |
| Al gelinkt vanuit profiel-sidepanel | ✅ | nieuwe route bekend maken |
| Backlinks (`profile.deals.navLabel`, deep links) | ✅ | breekt |
| Minste complexiteit | ✅ | tweede hub onderhouden |

Besluit: **uitbreiden**, niet opnieuw bouwen. `/agreements` → redirect (CE-2A.7, Optie A).

---

## 3. Operationele bronnen (CE-2A.1)

| Bron | Data | Vóór 2A | In hub? |
|------|------|---------|---------|
| **Proposal** | PENDING/COUNTERED onderhandeling | per-conversation only | ✅ `listPendingProposalsForUser` (hub) + `listUserProposals` (API) |
| **Agreement** | Frozen terms | alleen bij accept | impliciet via deal timeline |
| **CommunityOrder** | Deal status | `/api/profile/deals` | ✅ `listProfileDealsForUser` |
| **DeliveryRequest** | Courier, adressen | DealCard | ✅ via `ProfileDealCard` |
| **CourierAssignment** | PENDING/ACCEPTED | delivery service | ✅ serialized in deal |
| **Courier jobs (eigen)** | door mij te bezorgen | delivery dashboard | ✅ lichte strip → dashboard |

User-wide proposals endpoint: `GET /api/profile/proposals?status=` (pending/countered/accepted/rejected/cancelled/expired) — hergebruikt `serializeProposal`, geen dubbele logica.

---

## 4. Databronnen hub (CE-2A.2)

**Endpoint:** `GET /api/agreements?filter=…`
**Service:** `listAgreementsHubForUser` → `listPendingProposalsForUser` + `listProfileDealsForUser`, sort op `updatedAt`, facets per item.
**UI:** `components/profile/ProfileDealsClient.tsx` (de hub) rendert proposal- en deal-cards.

---

## 5. Status timeline (CE-2A.4-agenda)

`buildProposalAgreementTimeline` / `buildDealAgreementTimeline`:

```
Voorstel → Geaccepteerd → Betaling → Bezorging → Afgerond
```

Stappen `skipped` waar niet van toepassing. Bestaande Prisma-statussen — geen nieuwe workflow-engine.

---

## 6. Cancel (CE-2A.4 / 2A.5)

`POST /api/community-orders/[id]/cancel` → `cancelCommunityOrder`:

- alleen betrokken partij (buyer/seller) mag annuleren;
- alleen `OPEN` orders — `COMPLETED` → `trust.errors.cannotCancelCompleted`;
- `CANCELLED` is idempotent;
- zet `status=CANCELLED`, `cancelledAt`;
- annuleert actieve `DeliveryRequest` (OPEN/CLAIMED/ASSIGNED) + `CourierAssignment` (PENDING/ACCEPTED) in één transactie.

`cancelReason` wordt geaccepteerd maar **niet** gepersisteerd (geen DB-kolom → geen migratie in deze fase).

UI: rode "Afspraak annuleren"-CTA op `ProfileDealCard`, alleen bij `status === 'OPEN'`, met `window.confirm`.

---

## 7. Filters (CE-2A.9)

| Filter | Logica |
|--------|--------|
| Actie vereist | proposal wacht op user; deal CTA vereist actie |
| Open | proposal pending of deal OPEN |
| Lopend | wacht op tegenpartij / geen directe CTA |
| Wacht op betaling | `paymentStatus=WAITING_HOMECHEFF` of `showPaymentRequired` |
| Wacht op bezorging | deliveryRequired + delivery actief (requested…in_progress) |
| Afgerond | COMPLETED |
| Geannuleerd | CANCELLED |

Counts per facet in API-respons.

---

## 8. Nav & courier (CE-2A.6 / 2A.8)

- **Profielsidepanel:** `PROFILE_DEALS_NAV` → `/profile/deals`.
- **Main authenticated nav:** `roleQuickLinks.agreements` (alle ingelogde gebruikers, home + profile surfaces).
- **Courier:** lichte `CourierAgreementsStrip` in de hub (eigen jobs + link naar `/delivery/dashboard`), hergebruikt `/api/delivery/community-requests`. Geen dashboard-rewrite.

---

## 9. i18n (CE-2A.10)

`community.agreements.*`, `marketplace.agreements.*` (filters incl. waitingPayment/waitingDelivery, courier), `marketplace.deals.actions.cancel` + `cancelConfirm`, `trust.errors.cannotCancelCompleted`, `roleQuickLinks.agreements`. Volledige en/nl parity via validator.

---

## 10. Schermen na 2A

| Blijft | Reden |
|--------|-------|
| Chat proposals/deals | primaire actie-UI (accept, counter, pay, complete) |
| `/delivery/dashboard` | courier claim/complete |
| `/deal-review`, `/delivery-review` | post-completion flows |
| `/api/profile/deals` | backward compat + card refresh |

| Geconsolideerd | |
|----------------|-|
| `/profile/deals` | **centrale hub** |
| `/agreements` | redirect-alias |

---

## 10b. Agenda / planning-view (add-on)

Interne agenda bovenop dezelfde data — geen externe kalender/ICS/booking.

| Aspect | Implementatie |
|--------|---------------|
| Bucketing | `lib/agreements/agreement-agenda.ts` → Vandaag / Deze week / Later / Nog te plannen / Afgerond |
| Scheduling-bron | `DeliveryRequest.deliveryDate/pickupDate` + windows → `requestedWindowLabel` → `Proposal.requestedDate/timeWindow` |
| Rol-symmetrie | koper/verkoper zien dezelfde afspraak; agenda rol-onafhankelijk, `userRoleInDeal` blijft leidend voor next-action |
| Per item | type, tegenpartij, datum + tijdslot, locatie, status, volgende actie (`AgreementAgendaMeta`) |
| Sidebar-ready | `summary` in `/api/agreements`: nextAgreement, plannedToday, openAction, activeDelivery, waitingPayment, proposalsToRespond — data only, geen sidebar-redesign |

---

## 10c. Calendar-sync readiness (add-on)

Voorbereid via `lib/agreements/agreement-calendar-event.ts` — **niets gesynct/gebouwd** (geen OAuth, ICS-writer, feed, background sync of token-storage).

`buildAgreementCalendarEvent(item)` → genormaliseerd event: stabiele `id`, `title`, `description`, `start`, `end` (of window), `locationLabel`, `role`, `status`, `sourceType`, `sourceId` (+ i18n-keys/params via `translate`-optie). `buildAgreementCalendarEvents(items)` mapt lijsten en skipt geannuleerde deals.

**Export-opties (advies):** 1) ICS-download per afspraak, 2) read-only calendar-feed subscription, 3) OAuth two-way sync. MVP later: start met **ICS of feed**, niet direct OAuth. Detail in de progress-doc.

---

## 11. Open gaten (CE-2B)

1. Cancel-notificatie naar tegenpartij (bewust buiten scope: geen notifications in 2A).
2. `cancelReason` persistentie (vereist migratie).
3. Gedeelde React Query cache (`USER_DEALS_QUERY_KEY`) i.p.v. refetch.
4. Proposal accept/counter direct vanuit hub (nu: chat blijft actiebron).
5. Courier ziet volledige job-details alleen in dashboard (correct gescheiden).

---

## 12. Validatie

```bash
npx tsx scripts/validate-agreements-hub.ts
```

136 checks — alle groen (incl. agenda-bucketing, rol-symmetrie, delivery-timing, sidebar-summary en calendar-event readiness).
