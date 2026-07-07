# Marketplace Deal Commitment & Payment Trust Audit (Phase 5G-B)

**Date:** 2026-07-07  
**Scope:** Commitment checkbox, payment trust copy, server guard — no new models.  
**Related:** [MARKETPLACE_CHAT_DEAL_DELIVERY_COMMITMENT_AUDIT.md](./MARKETPLACE_CHAT_DEAL_DELIVERY_COMMITMENT_AUDIT.md)

---

## 1. Waar commitment wordt getoond

| Surface | Element | Key |
|---------|---------|-----|
| `ProposalCard` | Verplichte checkbox vóór “Accepteren” | `deal.commitment.acceptLabel` |
| `ProposalCard` | Accept-knop disabled zonder checkbox | client guard |
| `ProposalCard` | Foutmelding bij ontbrekende bevestiging | `deal.commitment.requiredError` |

Alleen zichtbaar wanneer `status === PENDING` en gebruiker niet de maker is (`canAct`).

---

## 2. Waar HomeCheff betaling wordt aanbevolen

| Surface | Element | Key |
|---------|---------|-----|
| `CreateProposalSheet` | Hint boven betaalkeuze | `deal.commitment.homecheffHint` |
| `CreateProposalSheet` | Badge “Aanbevolen” op HomeCheff-optie | `proposal.payment.homecheffRecommended` |
| `CreateProposalSheet` | HomeCheff-optie eerst in lijst | sort in `availablePaymentPaths` |
| `DealCard` | Hint wanneer `HOMECHEFF_CHECKOUT` + onbetaald | `deal.commitment.homecheffHint` |

Direct contact blijft zichtbaar en selecteerbaar wanneer `product.acceptDirectContact`.

---

## 3. Waar direct-contact risico-copy staat

| Surface | Wanneer | Key |
|---------|---------|-----|
| `ProposalCard` | `paymentPath === DIRECT_CONTACT` vóór accept | `deal.commitment.directRisk` |
| `DealCard` | `paymentPath === DIRECT_CONTACT` na accept | `deal.commitment.directRisk` |

---

## 4. Of commitment wordt opgeslagen

| Veld | Locatie | Type |
|------|---------|------|
| `commitmentAcceptedAt` | `Agreement.agreementSummary` (JSON) | ISO timestamp |
| `commitmentAcceptedById` | `Agreement.agreementSummary` (JSON) | User id |

Geen Prisma-schema-migratie. Type uitgebreid in `AgreementSummarySnapshot` (`lib/proposals/proposal-settlement.ts`).

Server vereist `commitmentAccepted: true` in `POST /api/proposals/[id]/accept` body; anders `proposal.errors.commitmentRequired` (400).

---

## 5. Hergebruikte systemen

| Systeem | Rol |
|---------|-----|
| `ProposalCard` | Commitment UI + direct-risk vóór accept |
| `DealCard` | Direct-risk + HomeCheff hint na accept |
| `CreateProposalSheet` | Payment recommendation UX |
| `ProposalService.acceptProposal` | Server guard + snapshot fields |
| `Agreement.agreementSummary` | Persist commitment metadata |
| `paymentPath` / `paymentPathFromSummary` | Bepaalt welke copy zichtbaar is |
| `deal-ux-state` | `showPaymentRequired` voor DealCard HomeCheff hint |
| `proposal-i18n-keys.ts` | `DEAL_COMMITMENT_I18N` registry |
| `public/i18n/nl.json` + `en.json` | Alle user-facing strings |

Geen nieuwe modellen. Geen redesign.

---

## 6. Resterende risico's

| Risico | Severity | Notes |
|--------|----------|-------|
| Commitment is sociaal contract, geen juridische handtekening | Low | Bewust minimaal gehouden |
| API-clients zonder body kunnen niet meer accepteren | Expected | Server guard by design |
| Geen commitment op tegenvoorstel-flow | Low | Counter → nieuw voorstel → accept opnieuw met checkbox |
| Barter-only zonder geldleg toont geen payment-risk copy | OK | `paymentPath === NONE` — commitment checkbox geldt nog steeds |
| Geen audit trail buiten agreement JSON | Low | Voldoende voor MVP; geen aparte `Commitment` tabel |

---

## Validatie

| Check | Result |
|-------|--------|
| `npm run lint` | Run at commit time |
| `npm run build` | Run at commit time |
| `npm run smoke-check` | Run at commit time |
| `validate-marketplace-deal-commitment.ts` | 22 checks |
| `validate-marketplace-exchange-proposal-conversion.ts` | Existing — unchanged |

---

*Implementation complete for Phase 5G-B.*
