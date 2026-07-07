# Community Economy Phase 2A — Unified Agreements Hub

**Date:** 2026-07-07
**Status:** Complete
**Scope:** `/profile/deals` uitbreiden tot centrale operationele hub "Mijn Afspraken" — geen nieuwe economie, betaalrails, ranking of parallelle hub.

---

## Doel

Eén cockpit op **`/profile/deals`** voor:

- openstaande **voorstellen** (pending/countered)
- lopende **deals** (CommunityOrder)
- **betalingen**, **ruilen**, **bezorging**, **volgende stap**, **afronding**, **annulering**, **historie**
- terug naar **chat**

Gebruiker hoeft niet meer te zoeken tussen chat, profiel en delivery.

---

## Kernbeslissing

`/profile/deals` **is** de hub (sterkste bestaande basis). `/agreements` is alleen een **redirect-alias** (CE-2A.7, Optie A). Geen tweede parallelle hub.

---

## Afgerond

| Fase | Resultaat |
|------|-----------|
| **CE-2A.1** User-wide proposals | `GET /api/profile/proposals` + `listUserProposals` (hergebruikt `serializeProposal`) |
| **CE-2A.2** Integratie in /profile/deals | `ProfileDealsClient` = hub; laadt `/api/agreements` (proposals + deals) |
| **CE-2A.3** Proposal cards | `AgreementHubProposalCard` naast `AgreementHubDealCard` (via `ProfileDealCard`) |
| **CE-2A.4** Cancel API | `POST /api/community-orders/[id]/cancel` → `cancelCommunityOrder` |
| **CE-2A.5** Cancel CTA | rode CTA op `ProfileDealCard`, alleen OPEN, met confirm |
| **CE-2A.6** Hoofdnav | `roleQuickLinks.agreements` + profielsidepanel `PROFILE_DEALS_NAV` |
| **CE-2A.7** /agreements alias | redirect naar `/profile/deals` |
| **CE-2A.8** Courier | `CourierAgreementsStrip` (eigen jobs + dashboard-link) |
| **CE-2A.9** Filters | Actie vereist / Open / Lopend / Wacht op betaling / Wacht op bezorging / Afgerond / Geannuleerd |
| **CE-2A.10** i18n | en/nl parity (filters, courier, cancel, nav, agenda, view) |
| **Agenda add-on** | Interne agenda/planning-view + sidebar-ready summary |

---

## Architectuur

```
/profile/deals  →  ProfileDealsClient (hub)
                     ├─ CourierAgreementsStrip → /api/delivery/community-requests → /delivery/dashboard
                     └─ GET /api/agreements?filter=
                          → listAgreementsHubForUser
                               → listPendingProposalsForUser (PENDING, geen Agreement)
                               → listProfileDealsForUser (CommunityOrder)
                          → facets per item (ACTION_REQUIRED, OPEN, IN_PROGRESS,
                            WAITING_PAYMENT, WAITING_DELIVERY, COMPLETED, CANCELLED)

/agreements     →  redirect → /profile/deals
GET /api/profile/proposals?status=  →  listUserProposals (user-wide, alle statussen)
POST /api/community-orders/[id]/cancel  →  cancelCommunityOrder
```

---

## Agenda / Planning (add-on)

Interne agenda/tijdlijn in de hub — **geen** externe calendar-sync/ICS/booking/availability.

- **View-toggle** Lijst ↔ Agenda in de hub-header.
- **Buckets:** Vandaag / Deze week / Later / Nog te plannen / Afgerond (`groupAgenda`).
- **Per item:** type, tegenpartij, datum + tijdslot, locatie-indicatie, status, volgende actie (`AgreementAgendaMeta` op elke card).
- **Rol-symmetrie:** koper én verkoper zien dezelfde afspraak (zelfde datum/tijd/locatie) elk vanuit eigen `userRoleInDeal`; scheduling is rol-onafhankelijk afgeleid.
- **Databronnen:** `DeliveryRequest.deliveryDate/pickupDate` + windows → `requestedWindowLabel` → `Proposal.requestedDate/requestedTimeWindow`; locatie uit dropoff/pickup labels.
- **Rollen:** werkt voor koper/verkoper/aanvrager/helper (partij-deals) en bezorger (courier-strip + eigen jobs).

### Sidebar-ready summary (data only — geen sidebar-redesign)

`GET /api/agreements` levert `summary`:

- `nextAgreement`, `plannedTodayCount`, `openActionCount`, `activeDeliveryCount`, `waitingPaymentCount`, `proposalsToRespondCount`.

Klaar voor toekomstige linker-/rechterzijbalken; nu nog niet gerenderd.

---

## Calendar-sync readiness (add-on)

Voorbereid, **niet gebouwd**: geen Google/Outlook/Apple OAuth, geen ICS-writer, geen background sync, geen token-storage.

Elk agenda-item kan intern worden omgezet naar een genormaliseerd calendar-event via `lib/agreements/agreement-calendar-event.ts`:

| Veld | Bron |
|------|------|
| `id` (stabiele UID) | `homecheff:${sourceType}:${sourceId}` |
| `title` / `description` | listing-titel + tegenpartij (fallback) of i18n-keys `marketplace.agreements.calendar.*` via `translate`-optie |
| `start` | agenda `scheduledAt` (of datum + window-starttijd) |
| `end` | afgeleid uit window-eindtijd, anders `null` |
| `timeWindowLabel` | agenda `timeLabel` (verbatim) |
| `locationLabel` | agenda `locationLabel` |
| `role` | `userRoleInDeal` (BUYER/SELLER) |
| `status` | proposal- of order-status |
| `sourceType` / `sourceId` | `proposal` / `community_order` + id |

`buildAgreementCalendarEvents(items)` mapt een lijst (skipt geannuleerde deals). Puur + deterministisch → herbruikbaar in elke toekomstige exporter.

### Export-opties (later te kiezen)

1. **ICS download per afspraak** — laagste drempel; per-item `.ics` uit het bestaande event-object. Geen auth, geen opslag.
2. **Calendar feed subscription** — één read-only `webcal://…/feed.ics` per gebruiker (token in URL); agenda's pollen periodiek. Read-only, geen OAuth.
3. **OAuth two-way sync** — Google/Outlook/Apple; vereist OAuth, token-storage, background sync, conflictafhandeling. Meeste werk.

**Advies (MVP):** start later met **ICS-download** of **calendar feed**, niet direct OAuth. Het event-object hierboven ondersteunt alle drie zonder wijziging.

---

## Gewijzigde / nieuwe bestanden

| Pad | Rol |
|-----|-----|
| `app/profile/deals/page.tsx` | rendert de hub (was redirect) |
| `app/agreements/page.tsx` | redirect-alias → /profile/deals |
| `lib/profile/deals-navigation.ts` | `DEALS_PROFILE_PATH=/profile/deals` |
| `components/profile/ProfileDealsClient.tsx` | de hub-client |
| `components/profile/ProfileDealCard.tsx` | + cancel-CTA |
| `components/agreements/CourierAgreementsStrip.tsx` | courier-strip (nieuw) |
| `lib/proposals/list-user-proposals.ts` | user-wide proposals service (nieuw) |
| `app/api/profile/proposals/route.ts` | proposals API (nieuw) |
| `lib/trust/community-order-service.ts` | + `cancelCommunityOrder` |
| `app/api/community-orders/[id]/cancel/route.ts` | cancel API (nieuw) |
| `lib/agreements/agreements-hub-{types,filters}.ts` | + WAITING_PAYMENT/WAITING_DELIVERY + agenda types |
| `lib/agreements/agreement-agenda.ts` | agenda bucketing + sidebar summary (nieuw) |
| `components/agreements/AgreementAgendaMeta.tsx` | datum/tijd/locatie meta (nieuw) |
| `lib/agreements/agreement-calendar-event.ts` | calendar-event readiness helper (nieuw) |
| `lib/navigation/role-quick-links.ts` | + `agreements` link |
| `public/i18n/{nl,en}.json` | nieuwe keys (en/nl parity) |
| `scripts/validate-agreements-hub.ts` | 83 checks |

**Verwijderd:** `components/agreements/AgreementsHubClient.tsx` (opgegaan in `ProfileDealsClient` — geen parallelle hub).

---

## Rapportage (per opdracht)

1. **Waarom /profile/deals de basis blijft** — sterkste bestaande basis: rijke `ProfileDealDTO`, `ProfileDealCard`, bestaande nav en deep links; minste complexiteit; alternatief zou dupliceren.
2. **Welke proposals nu buiten chat zichtbaar zijn** — pending/countered in de hub; alle statussen via `GET /api/profile/proposals`.
3. **Hoe cancel werkt** — party-only, alleen OPEN, completed geweigerd, idempotent, annuleert ook actieve delivery request + assignment; UI met confirm.
4. **Waar "Mijn Afspraken" zichtbaar is** — `/profile/deals`, profielsidepanel, `roleQuickLinks` (home + profile), `/agreements` alias.
5. **Courier-info** — eigen te-bezorgen + beschikbare jobs (count) met link naar delivery dashboard; geen rewrite.
6. **CE-2B gaps** — cancel-notificatie, `cancelReason` persistentie (migratie), gedeelde query-cache, accept/counter direct vanuit hub.

---

## Validatie

```bash
npx tsx scripts/validate-agreements-hub.ts   # 136 passed, 0 failed
```

---

## Gerelateerd

- [AGREEMENTS_HUB_AUDIT.md](../audits/AGREEMENTS_HUB_AUDIT.md)
- [COMMUNITY_ECONOMY_PHASE1.md](./COMMUNITY_ECONOMY_PHASE1.md)
