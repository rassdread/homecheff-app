# Phase 5E-C — Exchange Discovery & Proposal UX Audit

**Datum:** 2026-07-07  
**Scope:** Zichtbaarheid, begrijpelijkheid, voorstel-conversie en discovery → proposal. **Alleen audit** — geen feature-code, geen nieuwe enums, geen redesign.  
**Voorganger:** Phase 5E-B (`MARKETPLACE_EXCHANGE_COMMERCE_ALIGNMENT_AUDIT.md`) — technische commerce-keten is uitgelijnd.  
**Vraag:** Begrijpt een normale gebruiker dat hij kan ruilen, waarom hij een match krijgt, en hoe hij een voorstel doet?

---

## Validatiestatus (2026-07-07)

| Check | Resultaat |
|-------|-----------|
| `npm run lint` | ✅ pass |
| `npm run build` | ✅ pass |
| `npm run smoke-check` | ✅ pass |
| `npx tsx scripts/validate-marketplace-taxonomy-consolidation.ts` | ✅ 845/845 |
| `npx tsx scripts/validate-marketplace-detail-system.ts` | ✅ 182/182 |
| `npx tsx scripts/validate-marketplace-barter-openness-wiring.ts` | ✅ 18/18 |
| `npx tsx scripts/validate-marketplace-exchange-commerce-alignment.ts` | ✅ 17/17 |
| `npx tsx scripts/validate-marketplace-exchange-foundation.ts` | ⚠️ script bestaat niet |
| `npx tsx scripts/validate-marketplace-value-exchange.ts` | ⚠️ script bestaat niet |
| `npx tsx scripts/validate-marketplace-exchange-suggestions.ts` | ⚠️ script bestaat niet |

---

## 1. Executive summary

Phase 5E-B heeft de **technische keten** (listing → detail → chat → proposal → CommunityOrder → checkout) correct uitgelijnd: `barterOpenness` stuurt CTAs, checkout-gates en settlement-validatie. De **gebruikerservaring** blijft echter fragmentarisch.

| Domein | Status | Kernprobleem |
|--------|--------|--------------|
| Discovery (feed/tiles) | 🟡 Gedeeltelijk | Barter zichtbaar via prijsregel; accepted values verborgen op mobiel/compact |
| Detail | 🟡 Gedeeltelijk | Value-exchange sectie + commerce zone aligned; gewenste ruil niet gerenderd |
| Suggesties | 🟡 Dun | Type + korte samenvatting; geen uitleg *waarom* match; score/signalen verborgen |
| Proposal discovery | 🔴 Zwak | Detail → chat verplicht; proposal-sheet pas in chat; geen deep-link |
| Proposal creation | 🟡 Verwarrend | AcceptedValuesPicker gebruikt verkoperscopy voor terugbieden |
| Chat / deal | 🟢 Werkt | ProposalCard + DealCard; status zichtbaar; EN-i18n gaps |
| Matching transparency | 🔴 Laag | 7 scoring-signalen; gebruiker ziet er 0–1 van (alleen km-chip) |

**Conclusie in één zin:** Een **ingelogde, nieuwsgierige** gebruiker kan ruilen ontdekken via prijsregels (“Ruil”, “€X + ruil”) en teal suggestie-modules, maar **niet** intuïtief begrijpen *waarom* een match verschijnt of *hoe* hij in ≤3 klikken een voorstel doet — de grootste conversielek zit tussen **detail/suggestie → chat → proposal-sheet**.

---

## 2. Discovery audit (Onderzoek 1)

### 2.1 Component-overzicht

```
GeoFeed
├── FeedMarketplaceCard → MarketplaceTileRouter
│   ├── MarketplaceTileStandard (desktop)
│   └── MarketplaceTileCompact (mobiel)
├── ExchangeSuggestionsFeedInsert (teal band, auth-only)
└── ImprovedFilterBar / FeedSidebarFilters (geen barter-filter)

ProfilePublicAanbodTileGrid → MarketplaceTileMini
ExchangeSuggestionsProfileModule (eigenaar only)
ExchangeSuggestionsSidebarModule (desktop feed)
```

| Component | Pad |
|-----------|-----|
| Feed | `components/feed/GeoFeed.tsx` |
| Tile router | `components/marketplace/tiles/MarketplaceTileRouter.tsx` |
| Prijsregel | `lib/marketplace/tiles/build-tile-price-line.ts` |
| Badges | `lib/marketplace/tiles/build-tile-badges.ts` |
| Preview (hover) | `components/marketplace/previews/MarketplacePreviewCard.tsx` |
| Feed insert | `components/marketplace/exchange-suggestions/ExchangeSuggestionsFeedInsert.tsx` |

### 2.2 Ziet een gebruiker direct dat iets te ruilen is?

| Context | Signaal | Sterkte |
|---------|---------|---------|
| Desktop feed (standard tile) | Prijsregel “Ruil” / “€X + ruil” | 🟡 Medium |
| Mobiele feed (compact tile) | Alleen prijsregel | 🟡 Medium |
| Hover/long-press preview | Betalingsblok + accepted values (max 6) | 🟢 Sterk (desktop) |
| Feed chips | `all \| sale \| inspiration` — **geen barter-chip** | 🔴 Afwezig |
| Zoekfilter UI | Geen barter-openness control | 🔴 Afwezig |
| Feed insert “Ruilkans” | Teal band, auth-only | 🟢 Sterk (als ingelogd) |
| Profiel mini-tiles | Prijsregel only, geen accepted badges | 🟡 Dun |

### 2.3 Verschil MONEY / MONEY_AND_BARTER / BARTER_ONLY

| `barterOpenness` | Tile prijsregel (NL) | Checkout in feed-pad | Proposal-pad |
|------------------|----------------------|----------------------|--------------|
| `MONEY` | Normale €-prijs | ✅ | ❌ |
| `MONEY_AND_BARTER` | `{{price}} + ruil` | ✅ | ✅ (secundair) |
| `BARTER_ONLY` | `Ruil` | ❌ | ✅ (primair) |

**Gap:** `MONEY` + geconfigureerde accepted values toont **normale prijs** op tile; barter-acceptatie alleen via preview/detail.

### 2.4 Accepted values zichtbaarheid

Bron: `lib/marketplace/value-exchange/tile-display-rules.ts`

| Surface tier | Accepted values | Limiet |
|--------------|-----------------|--------|
| Standard tile (desktop) | 1 badge | max 3 badges totaal |
| Compact / mini / sidebar | **Verborgen** | — |
| Preview | Sectie “Geaccepteerde waarden” | max 6 + overflow |
| Detail | Emerald pills (alle subcategorieën) | volledig |

### 2.5 Barter-signalen

- **Zichtbaar:** prijsregel, preview betalingsblok, 1 accepted-badge (desktop standard), teal suggestie-modules.
- **Gereserveerd maar niet gerenderd:** `barterSlot` in `build-tile-badges.ts` (“Phase 5B+ barter badge row — not rendered”).
- **Feed taxonomy:** `deriveFeedTaxonomy` zet `exchange: MONEY | CONTACT` — **negeert** `barterOpenness`.

### 2.6 Wat matching gebruikt maar gebruiker niet ziet

| Signaal | Gewicht (score) | Zichtbaar voor gebruiker? |
|---------|-----------------|---------------------------|
| Category overlap | 22% | ❌ |
| Subcategory overlap | 28% | ❌ |
| Desired exchange overlap | 25% | ❌ |
| Distance | 10% | 🟡 Alleen km-chip bij LOCAL modifier |
| Availability | 5% | ❌ |
| Trust eligibility | 5% | ❌ |
| Recency | 5% | ❌ |
| `score` (0–100) | ranking | ❌ |
| `signalKinds[]` | classificatie | ❌ (i18n bestaat: `marketplace.exchange.signals.*`) |
| `desiredExchanges` op listing | matching | ❌ (niet op tiles/detail UI) |
| Min-score gates per surface | filtering | ❌ |

---

## 3. Detail audit (Onderzoek 2)

### 3.1 Pagina-architectuur

```
app/product/[id]/page.tsx
├── Commerce zone (sticky rechts / mobiel sticky bar)
│   ├── ProductSaleCommerceZone
│   ├── ProductSalePrimaryActions (#commerce-cta)
│   ├── ProductSaleProposalAction (#commerce-proposal-cta)
│   ├── ProductSaleSecondaryContact (MONEY-only)
│   └── ProductSaleStickyCta (mobiel, lg:hidden)
└── Main column
    ├── ProductOfferedBadgesSection (“Aangeboden”)
    ├── ProductValueExchangeSection (“Betaling & ruil”)
    ├── ExchangeSuggestionsMobileModule (lg:hidden)
    ├── ExchangeSuggestionsDetailBlock (hidden lg:block)
    └── ProductSaleAboutSection
```

### 3.2 ProductValueExchangeSection

**Pad:** `components/product/detail/ProductValueExchangeSection.tsx`  
**Builder:** `lib/marketplace/detail/detail-value-exchange-block.ts`

| Vraag | Antwoord |
|-------|----------|
| Begrijpt gebruiker wat aanbieder zoekt? | 🟡 Gedeeltelijk — “Aangeboden” sectie erboven; **gewenste ruil niet gerenderd** |
| Begrijpt gebruiker wat aanbieder accepteert? | 🟢 Ja — “Accepteert” + emerald taxonomy chips |
| Ruil mogelijk? | 🟢 Ja — payment row (💶 / 🔄 / 💶🔄) |
| Alleen verkoop? | 🟢 Ja — MONEY toont alleen geld; geen proposal CTA |
| Geld + ruil? | 🟢 Ja — “Geld + ruil” label + checkout + proposal |

**Zichtbaarheidsregel:** sectie getoond als `acceptedSpecializations.length > 0` **of** `barterOpenness !== 'MONEY'`.

**Gap:** Builder ondersteunt `desired` en `accepted_category` lines; component rendert alleen `accepted_subcategory` chips.

### 3.3 Commerce zone & CTA's

Central resolver: `lib/marketplace/commerce/barter-commerce-alignment.ts` → `resolveProductCommerceActions()`

| `barterOpenness` | Primair | Secundair |
|------------------|---------|-----------|
| `MONEY` | Add to cart | Chat (“stuur een voorstel of offerte”) |
| `MONEY_AND_BARTER` | Add to cart | Proposal (uitklapbaar) |
| `BARTER_ONLY` | Proposal (primair) | — |

### 3.4 Dubbele / conflicterende signalen

| Issue | Ernst | Beschrijving |
|-------|-------|--------------|
| Drie waarde-blokken naast elkaar | P2 | Offered badges + value exchange + commerce price — overlappend |
| MONEY + chat copy belooft voorstel | **P0** | `commercePathChat`: “stuur een voorstel of offerte” maar geen proposal CTA; server weigert value settlement |
| Gewenste ruil in data, niet in UI | P1 | REQUEST listings missen desired-exchange story |
| `ProductAcceptedBadgesSection` orphaned | P3 | Component bestaat; detail gebruikt unified section — risico op herintroductie |

---

## 4. Suggestion audit (Onderzoek 3)

### 4.1 Surfaces

| Surface | Component | Max cards | CTAs |
|---------|-----------|-----------|------|
| Detail desktop | `ExchangeSuggestionsDetailBlock` | 3 | Bekijk aanbod, Bekijk profiel, **Start gesprek** |
| Detail mobiel | `ExchangeSuggestionsMobileModule` | 2 | **Alleen** “Bekijk ruilmogelijkheid” → listing |
| Profiel eigenaar | `ExchangeSuggestionsProfileModule` | 5/tab | Volledige card + dismiss |
| Sidebar | `ExchangeSuggestionsSidebarModule` | capped | Volledige card |
| Feed insert | `ExchangeSuggestionsFeedInsert` | 2/sessie | Listing link |

### 4.2 Copy (NL)

| Type | Label | Samenvatting |
|------|-------|--------------|
| `direct` | Directe ruil | Jij biedt iets wat iemand zoekt |
| `reverse` | Omgekeerde ruil | Iemand biedt iets wat jij zoekt |
| `mutual` | Wederzijdse ruil | Jullie kunnen waarde met elkaar ruilen |
| `local` | Lokale ruil | Een kans in je buurt (+ km) |
| `community` | Community-ruil | Een interessante kans in de community |

Hint (detail): *“Optionele ruilkansen — ze beïnvloeden de discovery-ranking niet.”* — **developer-term** in gebruikerscopy.

### 4.3 Beantwoording onderzoeksvragen

| Vraag | Antwoord |
|-------|----------|
| Begrijpt gebruiker waarom suggestie verschijnt? | 🟡 Gedeeltelijk — type + korte samenvatting; geen concrete overlap (“jouw taart ↔ hun groente”) |
| Wordt uitgelegd wat matcht? | 🔴 Nee — geen taxonomy overlap, geen accepted-value match |
| Wordt uitgelegd waarom het matcht? | 🔴 Nee — score/signalen niet zichtbaar |
| Wordt uitgelegd wat gebruiker nu moet doen? | 🟡 Gedeeltelijk — CTA’s leiden naar listing/profiel/chat; geen “stuur voorstel” |

### 4.4 Visuele taal (consistent)

- Teal palette (`border-teal-100`, `bg-teal-50/40`, `text-teal-800`)
- Main-category emoji (niet offer subcategory icon)
- Expliciet **niet** gelabeld “Aanbevolen”

---

## 5. Proposal audit (Onderzoek 4)

### 5.1 Entrypoints

| Entrypoint | Locatie | Actie | Klikken tot proposal-sheet |
|------------|---------|-------|---------------------------|
| Detail proposal CTA | `ProductSaleProposalAction` | Start chat | **4+** (detail → chat modal → messages → clipboard icon) |
| Mobiel sticky CTA | `ProductSaleStickyCta` | Scroll naar proposal CTA → chat | **4+** |
| Exchange suggestion desktop | `ExchangeSuggestionCardView` | Start gesprek | **3+** (suggestie → messages → clipboard) |
| Exchange suggestion mobiel | `ExchangeSuggestionsMobileModule` | Listing link only | **5+** (suggestie → listing → chat → messages → clipboard) |
| Chat composer | `ChatBox` ClipboardList | Open sheet | **1** (als al in chat) |
| Profiel owner module | `ExchangeSuggestionsProfileModule` | Start gesprek | **3+** |

**Kritiek:** Er is **geen** directe route van detail/suggestie naar `CreateProposalSheet`. Chat is verplichte tussenstap.

### 5.2 User journey (barter-only, optimistisch)

```
Feed tile “Ruil”
  → Klik (1)
Detail pagina
  → “Voorstel sturen” / sticky CTA (2)
StartChatButton modal
  → Bericht + start gesprek (3)
/messages?conversation=…
  → ClipboardList in composer (4)
CreateProposalSheet
  → Invullen + versturen (5)
ProposalCard in thread
```

**Pessimistisch (mobiel via suggestie):** 6–7 klikken, zonder duidelijke “doe nu een voorstel”-begeleiding.

### 5.3 Dode eindpunten

| Pad | Probleem |
|-----|----------|
| MONEY listing → chat | Copy belooft voorstel; geen proposal CTA op detail; value settlement server-rejected |
| Mobiel suggestie → listing | Geen “Start gesprek”; gebruiker moet zelf contact zoeken op counterparty listing |
| Suggestie → chat (zonder product context) | `?user=username` — geen product-bound prefilled proposal |
| Niet-ingelogd | Geen suggesties, geen feed inserts — ruil alleen via tile prijsregel |

### 5.4 Is voorstel doen zichtbaar genoeg?

- **BARTER_ONLY:** 🟢 Primair CTA + sticky mobiel
- **MONEY_AND_BARTER:** 🟡 Secundair, uitklapbaar — kan onder checkout verdwijnen
- **MONEY:** 🔴 Copy impliceert voorstel via chat; geen proposal CTA
- **Via suggesties:** 🟡 Teal modules zichtbaar; geen proposal-CTA anywhere

---

## 6. Proposal creation audit (Onderzoek 5)

### 6.1 CreateProposalSheet

**Pad:** `components/chat/proposals/CreateProposalSheet.tsx`

| Vraag | Antwoord |
|-------|----------|
| Begrijpt gebruiker wat hij aanbiedt? | 🟢 Product summary + title prefilled |
| Begrijpt gebruiker wat hij terugkrijgt? | 🔴 `AcceptedValuesPicker` voor `requestedValueTaxonomyIds` gebruikt verkoperscopy: “Wat accepteer je eventueel ook als waarde?” |
| Terminologie duidelijk? | 🟡 NL redelijk; EN mixed barter/exchange/trade |
| Onduidelijke velden? | Settlement hint vs payment path UI; “Fulfillment” label |
| Developer-termen? | “taxonomy” in zoekplaceholder; settlement modes als code-achtige chips |

### 6.2 Settlement keuze (gefilterd per `barterOpenness`)

| Openness | Modes |
|----------|-------|
| `MONEY` | MONEY, FREE, VOLUNTARY |
| `BARTER_ONLY` | VALUE_ONLY, FREE, VOLUNTARY |
| `MONEY_AND_BARTER` | Alle vijf |

### 6.3 Validatie

- **Client:** title required, stock checks
- **Server:** `validateSettlementAgainstBarterOpenness`, `validateProposalSettlement`, payment path
- **Submit label:** “Voorstel sturen” / “Offerte sturen” (services)

### 6.4 Copy-inconsistenties (create flow)

| Context | Label |
|---------|-------|
| Detail CTA | Voorstel **sturen** |
| Sheet title | Voorstel **maken** |
| Services | Offerte sturen |
| Settlement hint | “geen betaling via dit scherm” — conflicteert met HOMECHEFF payment path |

---

## 7. Chat audit (Onderzoek 6)

### 7.1 Proposal lifecycle UI

| Status | Zichtbaar? | UI-element |
|--------|------------|------------|
| Verzonden (PENDING) | 🟢 | ProposalCard + amber badge |
| Bekeken | 🔴 | Geen read-receipt op proposal |
| Geaccepteerd | 🟢 | Emerald badge + DealCard embed |
| Afgewezen | 🟢 | Red badge + system message |
| Tegenvoorstel (COUNTERED) | 🟢 | Sky badge + counter UI |
| Geannuleerd | 🟢 | Gray badge |
| Deal / order | 🟢 | DealCard met state-machine CTAs |
| Afgerond | 🟢 | Mark complete + review |

### 7.2 System messages

`ChatThreadMessageRow` → `PROPOSAL_SYSTEM` banners (accepted/rejected/cancelled/deal created).

**Gap:** `systemLabel()` hardcoded NL (“Voorstel”, “Bestelling”) — geen `t()`.

### 7.3 Post-accept flow (DealCard)

| State | Primaire CTA |
|-------|--------------|
| HomeCheff payment nodig | Betaal via HomeCheff → `/checkout?productId&communityOrderId` |
| Direct contact | Bespreek betaling (chat) |
| Value-only | Rond ruil af |
| Delivery | Vraag bezorging aan |
| Completed | Review |

### 7.4 Ontbrekende statusindicatoren

- Proposal “bekeken” / “geopend”
- Voortgang indicator in suggestie → chat → proposal funnel
- Duidelijke “volgende stap” na match-suggestie

---

## 8. Matching transparency audit (Onderzoek 7)

### 8.1 Pipeline

```
Product row
  → productRowToExchangeProfile()     [exchange-suggestion-profile-mapper.ts]
  → buildExchangeListingProfile()   [exchange-resolver.ts]
  → resolveExchangeMatch()            [exchange-resolver.ts]
  → computeExchangeOverlap()          [exchange-overlap.ts]
  → classifySuggestionType()          [resolve-exchange-suggestions.ts]
  → buildSuggestionCard()             [resolve-exchange-suggestions.ts]
  → applyExchangeSuggestionCaps()       [exchange-suggestion-caps.ts]
```

### 8.2 Signalen: matching vs zichtbaarheid

| Signaal | Gebruikt in matching | Zichtbaar voor gebruiker |
|---------|----------------------|--------------------------|
| Taxonomy (offer subcategories) | ✅ overlap scoring | 🟡 Op tile als offer badge; niet in suggestie-uitleg |
| Accepted values | ✅ acceptance overlap | 🟡 Detail + preview; niet in suggestie |
| Barter openness | ✅ eligibility gate | 🟢 Prijsregel + detail payment row |
| Desired exchanges | ✅ desired overlap | 🔴 Niet op discovery/detail UI |
| Categorie (main) | ✅ category overlap | 🟡 Emoji op suggestie card |
| Locatie / distance | ✅ distance score | 🟡 km-chip bij LOCAL modifier only |
| Profiel (viewer listings) | ✅ profile-based matching | 🔴 Geen “jouw aanbod X matcht” |
| Mutual barter readiness | ✅ type classification | 🟡 Via type label “Wederzijdse ruil” |
| Trust eligibility | ✅ score weight 5% | 🔴 |
| Recency / availability | ✅ score weights | 🔴 |

### 8.3 Bestaande maar ongebruikte i18n

`marketplace.exchange.signals.*` (NL):
- Exacte match voor wat je zoekt
- Sterke categorie-overlap
- Mogelijke ruilkans
- Wederzijdse ruilbereidheid
- Klaar voor ruilsuggesties

**Nergens gerenderd** in discovery/suggestion UI.

---

## 9. UX copy audit (Onderzoek 8)

### 9.1 Terminologie-matrix

| Concept | NL (voorkeur) | NL (huidig) | EN (huidig) | Issue |
|---------|---------------|-------------|-------------|-------|
| Trade | Ruilen | Ruil, ruilkans, ruilhandel | Barter, exchange, trade | EN inconsistent |
| Proposal | Voorstel doen | Voorstel sturen/maken, offerte | Proposal, quote, counter offer | Actie-werkwoord drift |
| Deal | Afspraak | Afspraak (NL), deal (EN) | Deal | NL/EN metafoor verschilt |
| Listing | Aanbod | Aanbod | Listing, offer | OK per locale |
| Payment | Betaling | Betaling | Payment | OK |
| Accepted values | Wat accepteer je | Geaccepteerde waarden, Accepteert | Accepted values | Te formeel |
| Settlement | Geld of ruil | Geld, Geld + waarde, Andere waarde | Money, Money + value, Alternative value | Developer-achtig |
| Barter mode | Alleen ruil | Ruil, Geld + ruil | Barter, Money + barter | OK op tiles |

### 9.2 Developer-termen in gebruikerscopy

| Term | Locatie |
|------|---------|
| “discovery-ranking” | `marketplace.exchangeSuggestions.hint` |
| “taxonomy” | `marketplace.acceptedValues.searchPlaceholder` |
| “Fulfillment” | `proposal.productBinding.fulfillmentOffered` |
| “Checkout” / “CommunityOrder” | NL checkout error strings |
| “geldleg” / “money leg” | Payment path none labels |

### 9.3 Hardcoded NL (EN-gebruikers)

| Bestand | Strings |
|---------|---------|
| `ChatThreadMessageRow.tsx` | “Voorstel”, “Bestelling”, “Bezorging” |
| `ProposalCard.tsx` | `toLocaleDateString("nl-NL")` altijd |
| `StartChatButton.tsx` | Quick messages alleen NL |
| `app/product/[id]/page.tsx` | “weergaven”, “verkocht” |

### 9.4 Voorkeur vs huidig (gap-analyse)

| Voorkeur | Huidig | Gap |
|----------|--------|-----|
| Voorstel doen | Voorstel sturen / maken | Klein |
| Wat bied je aan? | (ontbreekt in create sheet) | **Groot** |
| Wat wil je ontvangen? | Verkoperscopy op verkeerd veld | **Groot** |
| Geld of ruil | Settlement mode chips | Medium |
| Alleen ruil | “Ruil” op tile | OK |

---

## 10. Mobile audit (Onderzoek 9)

### 10.1 Per surface

| Surface | Bevinding |
|---------|-----------|
| Feed | Compact tiles — barter alleen via prijsregel; geen accepted badges |
| Detail | Sticky CTA (`ProductSaleStickyCta`) — barter-only scrollt naar `#commerce-proposal-cta` |
| Suggesties | `ExchangeSuggestionsMobileModule` — max 2 cards, **geen** Start gesprek, geen dismiss, geen type badge |
| Proposal flow | Full-screen sheet; settlement chips; thumb-reachable |
| Chat | ClipboardList in composer — klein icoon, niet prominent |

### 10.2 Beantwoording

| Vraag | Antwoord |
|-------|----------|
| CTA's zichtbaar genoeg? | 🟡 Sticky CTA goed voor barter-only; proposal-sheet entry zwak |
| Ruilinformatie weggedrukt? | 🟡 Ja — compact tiles verbergen accepted values |
| Horizontale/verticale overload? | 🟢 Geen overload; eerder **te weinig** info |
| Eén-duim bereikbaar? | 🟡 Sticky CTA ja; chat proposal-knop midden-onder |

### 10.3 Desktop vs mobiel parity-gap

| Feature | Desktop | Mobiel |
|---------|---------|--------|
| Suggestie CTAs | 3 (listing, profiel, gesprek) | 1 (listing only) |
| Type badge op suggestie | ✅ | ❌ |
| Dismiss suggestie | ✅ | ❌ |
| Preview accepted values | Hover | Long-press (indien enabled) |

---

## 11. Funnel audit (Onderzoek 10)

```
Discovery          Klik           Detail           Interesse         Voorstel          Chat            Deal              Order           Afronding
─────────          ────           ──────           ─────────         ────────          ────            ────              ─────           ─────────
Feed tile          → product      Commerce zone    Proposal CTA      Chat modal        ClipboardList   Accept            Pay/complete    Review
"Ruil" prijs       page           Value exchange   (uitklapbaar)     StartChat         CreateSheet     DealCard          CommunityOrder  Mark complete
Suggestie insert   → listing      Suggestions      Start gesprek*    Messages          ProposalCard    Checkout URL*
Feed band          → product      Sticky CTA*      Bekijk ruil*      (4+ klikken)      System msgs     Stock decrement

* = frictiepunt
```

### 11.1 Frictiepunten & afhakers

| Fase | Frictie | Ernst |
|------|---------|-------|
| Discovery → Klik | Geen barter-filter; MONEY+accepted values onzichtbaar op tile | P1 |
| Detail → Interesse | Drie waarde-secties; gewenste ruil ontbreekt | P2 |
| Interesse → Voorstel | **Chat verplicht; geen deep-link naar sheet** | **P0** |
| Suggestie → Actie | Mobiel: geen Start gesprek; geen proposal CTA | **P0** |
| Chat → Voorstel | ClipboardList icoon niet opvallend | P1 |
| Create sheet | Verkeerde copy op “terugbieden” veld | P1 |
| MONEY → Chat | Misleidende voorstel-copy | P0 |
| Deal → Checkout | Werkt (5E-B); settlement hint verwarrend | P2 |

### 11.2 Verborgen functionaliteit

- Barter zoekfilter (`?barterOpenness=` API only)
- Exchange signal explanations (`marketplace.exchange.signals.*`)
- Desired exchanges op listings
- `barterSlot` badge row op tiles
- Score/ranking transparency

### 11.3 Dubbele stappen

1. Detail proposal CTA → chat → terug proposal (zelfde intent, extra scherm)
2. Suggestie → listing → chat (ipv direct gesprek op mobiel)
3. Accepted values op preview én detail (bewust, maar redundant na hover)

---

## 12. P0 problemen

| # | Probleem | Impact | Hergebruik |
|---|----------|--------|------------|
| P0-1 | **Detail/suggestie → proposal vereist chat-omweg** (4+ klikken); geen deep-link `?openProposal=1` | Hoogste conversielek | `CreateProposalSheet`, `StartChatButton`, `ProductSaleProposalAction` |
| P0-2 | **Mobiel suggesties: geen Start gesprek** — alleen listing link | Mobiele gebruikers missen kortste pad | `ExchangeSuggestionsMobileModule` → parity met `ExchangeSuggestionCardView` |
| P0-3 | **MONEY listing chat copy belooft voorstel** zonder proposal CTA; server weigert value settlement | Misleidende funnel, frustratie | `ProductSaleSecondaryContact` copy + `resolveProductCommerceActions` |
| P0-4 | **Matching transparantie nul** — gebruiker ziet niet waarom match | Wantrouwen, geen actie | Bestaande `marketplace.exchange.signals.*` i18n + `signalKinds` op cards |

---

## 13. P1 verbeteringen

| # | Verbetering | Componenten |
|---|-------------|-------------|
| P1-1 | Deep-link chat met proposal sheet open + product context | `StartChatButton`, `ChatBox`, routing |
| P1-2 | `AcceptedValuesPicker` in proposal context: “Wat bied je terug?” / “What do you offer in return?” | `CreateProposalSheet`, i18n |
| P1-3 | Render `desiredExchanges` op detail voor REQUEST listings | `ProductValueExchangeSection`, `detail-value-exchange-block.ts` |
| P1-4 | Toon 1–2 match-redenen op suggestie cards (signal chips) | `ExchangeSuggestionCardView` + bestaande signal i18n |
| P1-5 | Barter-discovery filter in feed UI (API bestaat) | `GeoFeed`, `ImprovedFilterBar` |
| P1-6 | Prominentere proposal-entry in chat (niet alleen ClipboardList icoon) | `ChatBox` |
| P1-7 | i18n sweep: hardcoded NL in chat + detail stats | `ChatThreadMessageRow`, `ProposalCard`, `page.tsx` |
| P1-8 | Verwijder “discovery-ranking” uit hint; vervang door gebruikerstaal | `marketplace.exchangeSuggestions.hint` |

---

## 14. P2 polish

| # | Polish | Notities |
|---|--------|----------|
| P2-1 | Eén waarde-sectie op detail (merge offered + exchange waar mogelijk) | Layout, geen nieuw model |
| P2-2 | `barterSlot` badge row renderen op standard tiles | `build-tile-badges.ts` al voorbereid |
| P2-3 | Settlement hint afstemmen op payment path UI | `CreateProposalSheet` |
| P2-4 | Consistent “Voorstel doen” vs “Voorstel sturen” vs “Voorstel maken” | i18n keys |
| P2-5 | MONEY + accepted values: prijsregel “Andere waarde” of badge | `build-tile-price-line.ts` |
| P2-6 | Proposal “bekeken” indicator | Chat/proposal API |
| P2-7 | EN date formatting in ProposalCard | `toLocaleDateString` locale-aware |
| P2-8 | Verwijder “taxonomy” uit zoekplaceholder | `marketplace.acceptedValues.*` |

---

## 15. Dubbelbouw-risico's

| Risico | Bestaand systeem (hergebruiken) | Niet opnieuw bouwen |
|--------|--------------------------------|---------------------|
| Nieuwe proposal UI | `CreateProposalSheet`, `ProposalCard`, `proposal-service.ts` | Geen parallel proposal form op detail |
| Nieuwe order/checkout | `CommunityOrder`, `DealCard`, `community-order-checkout.ts` | Geen tweede deal-model |
| Nieuwe matching engine | `resolve-exchange-suggestions.ts`, `exchange-match-score.ts` | Geen nieuwe score-logica |
| Nieuwe accepted-values UI | `AcceptedValuesPicker`, `MarketplaceBadgeList`, `ProductValueExchangeSection` | Geen `ProductAcceptedBadgesSection` herintroduceren |
| Nieuwe CTA matrix | `resolveProductCommerceActions`, `barter-commerce-alignment.ts` | Geen aparte detail-action logica |
| Nieuwe suggestie cards | `ExchangeSuggestionCardView`, copy registry | Geen aparte card component per surface |
| Nieuwe tile pricing | `buildTilePriceLine`, `build-tile-badges.ts` | Geen custom price per surface |
| Nieuwe chat flow | `StartChatButton`, `ChatBox`, conversation header | Geen apart messaging kanaal |

---

## 16. Aanbevolen volgende fase (5E-D)

**Naam:** Exchange Discovery Conversion — **geen redesign, geen nieuwe modellen**.

### Scope (in volgorde)

1. **Proposal deep-link** — `ProductSaleProposalAction` + suggestie CTAs → chat met `CreateProposalSheet` open en product context (`resolveConversationHeader` bestaat).
2. **Mobiel suggestie parity** — `ExchangeSuggestionsMobileModule` krijgt `start_conversation` CTA (zelfde als desktop card).
3. **Match transparency lite** — render max 2 `signalKinds` als chips op `ExchangeSuggestionCardView` (i18n bestaat).
4. **Copy fixes** — MONEY chat path, proposal picker labels, hint zonder “discovery-ranking”.
5. **Desired exchange op detail** — render bestaande builder output in `ProductValueExchangeSection`.

### Expliciet buiten scope

- Nieuwe enums, matching, checkout, proposal/order modellen
- Feed ranking wijzigingen
- Volledige UX redesign
- Nieuwe validatiescripts (3 ontbrekende scripts optioneel toevoegen in aparte tech-debt taak)

---

## 17. Conclusie — kernvragen

| Vraag | Antwoord |
|-------|----------|
| **Begrijpt een nieuwe gebruiker dat ruilen bestaat?** | **Gedeeltelijk.** Prijsregels (“Ruil”, “€X + ruil”) en teal modules signaleren het voor wie scrollt. Er is geen onboarding, geen feed-filter, en op mobiel weinig accepted-value context. Niet-ingelogde gebruikers zien geen suggesties. |
| **Begrijpt een nieuwe gebruiker hoe hij een voorstel doet?** | **Nee, niet zonder trial-and-error.** Detail zegt “Voorstel sturen” maar opent chat. De proposal-sheet zit achter een klein ClipboardList-icoon. 4+ klikken zonder begeleiding. |
| **Begrijpt een nieuwe gebruiker waarom een match verschijnt?** | **Nee.** Type-label (“Directe ruil”) + generieke samenvatting; geen concrete overlap, geen signal chips, geen score-uitleg. Hint over “discovery-ranking” is developer-taal. |
| **Begrijpt een nieuwe gebruiker wat hij moet doen na een match?** | **Gedeeltelijk op desktop** (Start gesprek). **Nee op mobiel** (alleen “Bekijk ruilmogelijkheid”). Geen “stuur nu een voorstel”-pad. |
| **Waar zit de grootste conversielek?** | **Detail/suggestie → chat → proposal-sheet.** Technisch werkt de keten; UX verliest gebruikers in de verplichte chat-omweg en onzichtbare proposal-entry. Secundair: mobiele suggestie parity-gap. |
| **Welke systemen absoluut hergebruiken?** | `CreateProposalSheet`, `ProposalCard`/`DealCard`, `proposal-service.ts`, `resolveProductCommerceActions`, `resolve-exchange-suggestions.ts`, `ExchangeSuggestionCardView`, `ProductValueExchangeSection`, `StartChatButton`/`ChatBox`, `marketplace.exchange.signals.*` i18n. |
| **Wat mag absoluut niet opnieuw gebouwd worden?** | Proposal model, CommunityOrder/checkout stack, matching engine, barter openness enum/matrix, exchange suggestion resolver, tile price/badge builders, accepted values picker/data model. |

---

## Bijlage A — Component screenshot-referenties (code-locaties)

| Visueel element | Component | Visuele kenmerken |
|-----------------|-----------|-------------------|
| Feed tile prijsregel | `TilePriceLine` | “Ruil” / “€12 + ruil” / normale prijs |
| Feed insert band | `ExchangeSuggestionsFeedInsert` | Teal gradient, emoji, “Ruilkans” |
| Detail value exchange | `ProductValueExchangeSection` | 💶🔄 payment row + emerald chips |
| Detail commerce CTA | `ProductSalePrimaryActions` | Groen checkout + uitklapbaar proposal |
| Mobiel sticky | `ProductSaleStickyCta` | Fixed bottom, safe-area |
| Desktop suggestie card | `ExchangeSuggestionCardView` | Type badge + 3 CTAs + dismiss |
| Mobiel suggestie | `ExchangeSuggestionsMobileModule` | Compact list, listing link only |
| Proposal sheet | `CreateProposalSheet` | Settlement chips + AcceptedValuesPicker |
| Chat proposal | `ProposalCard` | Status badge + accept/counter/reject |
| Deal card | `DealCard` | “Jullie afspraak” + payment/complete CTAs |

## Bijlage B — Gerelateerde audits

- `MARKETPLACE_EXCHANGE_COMMERCE_ALIGNMENT_AUDIT.md` (5E-B)
- `MARKETPLACE_END_TO_END_EXCHANGE_TRANSACTION_AUDIT.md` (5E-A)
- `EXCHANGE_SURFACE_MATRIX.md`
- `EXCHANGE_SUGGESTIONS_FEED_AUDIT.md`
- `MARKETPLACE_BARTER_OPENNESS_WIRING_AUDIT.md`
