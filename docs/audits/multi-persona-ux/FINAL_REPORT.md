# HomeCheff Multi-Persona First-Impression & UX Audit

**Target:** https://homecheff.eu (productie)  
**Datum:** 2026-08-17  
**Scope:** Read-only. Geen codewijzigingen, geen deploy, geen DB-mutaties.  
**Evidence:** `probe-1786920757594/`, `probe-deep-1786920877124/`  
**Methode:** Playwright fold/journey captures over 8 viewports + deep clean (cookies dismissed) + listing/create journeys.

---

## 1. Executive summary

HomeCheff communiceert **wel** het kernconcept (“digital neighbourhood marketplace” + Food/Garden/Creations/Services + Nearby + radius), maar een koude bezoeker zonder voorkennis wordt in de eerste seconden gehinderd door:

1. **Cookie-modal** die op mobile het eerste scherm domineert.
2. **Default Engelse UI** op een `.eu`/NL-markt (locale-probe bleef EN).
3. **Incomplete hero-headline** (“nearby cook, grow, make and help”) zonder onderwerp.
4. **Aanbod te laat zichtbaar** — eerste listing pas ~680–750px, slechts ~21–26% van de card in de fold.
5. **Te veel chrome vóór content** — 3 filterrijen + locatiekaart + locatieprompt.

**Conclusie:** minimale uitleg is nog nodig (merk onbekend), maar de huidige hero/fold is **niet** de optimale minimale set. Model **B (gecomprimeerd)** past nu beter dan A (huidig) of C (extreem minimaal à la bekend merk).

**Verdict code:** `HOMECHEFF_MULTI_PERSONA_UX_CHANGES_RECOMMENDED`

**Overall first-impression score: 5.6 / 10**

---

## 2. Overall first-impression score

| Dimensie | Score 0–10 |
|---|---|
| Conceptbegrip | 6.5 |
| Visuele hiërarchie | 5.0 |
| Primaire CTA | 5.5 |
| Lokale positionering | 7.5 |
| Koop/ontdek-intentie | 5.0 |
| Verkoop/aanbied-intentie | 7.0 |
| Vertrouwen | 5.5 |
| Hoeveelheid tekst | 4.5 |
| Cognitieve belasting | 4.0 |
| **Overall (gewogen)** | **5.6** |

---

## 3. A. First-impression test (zonder scroll)

### Wat staat above-the-fold (productie, anonymous)

**Mobile (~390×844):** header (Login / Sign Up / menu) → groene hero → zoekbalk → 3 chip-rijen (intent / category / scope) → Feed/Grid/Filters → result count → locatiekaart (Vlaardingen, 25 km) → locatieprompt → top van eerste listing → bottom nav (Discover / + / Messages / Profile). Cookie-modal bij first visit.

**Desktop (~1440×900):** header met Sell or share + Ontdek HomeCheff → bredere hero (2 body-regels) → linker sidebar (Sell or share + categorieën) → feed-chrome + locatie → top listing → rechter trust/moments sidebar.

### 3 seconden

| Vraag | Observatie |
|---|---|
| Wat is HomeCheff? | “Iets met buurt / marketplace” — eyebrow helpt; headline alleen onduidelijk |
| Wat kun je doen? | Zoeken / inloggen / + ; aanbod nog nauwelijks zichtbaar |
| Primair doel pagina? | Ontdekken lokaal óf uitleg geven — conflict |
| Aandacht eerst? | Groene hero + cookie (mobile) / Sell or share (desktop) |
| Primaire actie? | Ambigu: Sign Up vs Sell or share vs scroll/zoek |
| Secundaire? | Login, filters, language |
| Aanbod zichtbaar? | Nee / nauwelijks |
| Zelf aanbieden? | Desktop ja (+ Sell or share); mobile via + |
| Lokaal? | Ja (neighbourhood / Nearby) als tekst gelezen wordt |
| Soorten aanbod? | Deels via categoriechips; hero noemt meals/harvest/help |
| Tekst nodig? | Eyebrow + 1 bodyzin + categorieën |
| Niet gelezen? | Keyword-strip; tweede USP-regel desktop |
| Elders beter? | Lange definitie, trust copy, “with or without money” |

### 5 seconden

Concept wordt **haalbaar** als bezoeker hero-body leest: lokale marktplaats voor homemade / harvest / handmade / help. Zonder lezen: vooral “app met filters”.

### 10 seconden

Zoek + Nearby + Food/Garden + Vlaardingen/25 km maken lokaal discovery concreet. Listing top wordt zichtbaar. Intent-chips (Offered / Ask / Inspiration / Trade) verhogen complexiteit.

### 30 seconden

Listing openen werkt; seller/product zichtbaar; Terug werkt. Create-entry (“Sell or share”) opent guest-panel met Join/Login — duidelijk dat aanbieden mogelijk is, maar gast moet account.

### Wat conceptbegrip veroorzaakt (sectie D)

| Element | Bijdrage |
|---|---|
| Eyebrow “DIGITAL NEIGHBOURHOOD MARKETPLACE” | Hoog — category label |
| Body “homemade meals… harvests… handmade… help” | Hoog — scope |
| Categoriechips Food / Garden / Creations / Services | Hoog — sneller dan lange tekst |
| Nearby + Vlaardingen + 25 km | Hoog — lokaal bewijs |
| “Search your neighbourhood…” | Mid — intent zoeken |
| “+ Sell or share” | Mid-hoog — dual-sided |
| Keyword-strip Search·Offer·Ask… | Laag — noise |
| Incomplete headline “nearby cook…” | Negatief — mist subject |
| Cookie modal | Negatief — blokkeert |

**5–10s conceptbegrip-verdict:** Gedeeltelijk geslaagd. Een oplettende lezer komt dicht bij de doelzin; een scanner/ouder persoon met EN-frictie niet betrouwbaar.

---

## 4. Persona scorecards

Schaal 0–10. Kolommen: begrip 5s | 30s | leesbaarheid | navigatie | CTA | vertrouwen | cognitieve belasting↓ | kans doorgaan

| Persona | 5s | 30s | Lees | Nav | CTA | Trust | Load* | Doorgaan | Kern |
|---|---|---|---|---|---|---|---|---|---|
| 1 Kind 10–12 | 3 | 5 | 4 | 5 | 4 | 4 | 3 | 4 | EN + abstracte woorden; + knop herkenbaar |
| 2 Tiener 15–18 | 5 | 7 | 6 | 7 | 6 | 5 | 5 | 6 | Visueel ok; te veel lezen; thin supply |
| 3 Jongvolw. 20–29 | 6 | 8 | 7 | 8 | 7 | 6 | 5 | 7 | Relevantie snel; filter-overload |
| 4 Volw. 30–44 | 6 | 8 | 7 | 8 | 7 | 6 | 5 | 7 | Koop + sell paden bestaan |
| 5 Middelbaar 45–59 | 5 | 7 | 6 | 6 | 6 | 6 | 4 | 6 | Locatie/radius ok; jargon |
| 6 Senior 60–69 | 4 | 6 | 5 | 5 | 5 | 5 | 3 | 4 | EN + dichtheid |
| 7 Oudere senior 70–79 | 3 | 5 | 4 | 4 | 4 | 4 | 2 | 3 | Iconen/chips zonder NL; kleine targets |
| 8 80+ | 2 | 4 | 3 | 3 | 3 | 3 | 2 | 2 | Niet zelfstandig cold-start ready |

\*Load = cognitieve belasting (hoger = beter = minder belasting).

---

## 5. Device scorecards

| Viewport | Fold kwaliteit | Hero | Zoek | Cats | 1e listing | CTA | Nav | Touch | Landscape nut |
|---|---|---|---|---|---|---|---|---|---|
| Phone sm 360 | 4 | Compact ok | Goed | 3 rijen zwaar | Late | + duidelijk | Bottom ok | Chips &lt;44px h | — |
| Phone lg 430 | 5 | Ok | Goed | Zwaar | ~26% | + | Ok | Matig | — |
| Phone landscape | 2 | Verdwijnt deels | Ja | Sidebar | **0%** | Sell sidebar | Menu | Matig | **Nee** — geen extra feed |
| Tablet portrait | 6 | Langer | Goed | Sidebar+chips | ~42% | Goed | Ok | Ok | — |
| Tablet landscape | 5 | Mid | Goed | Mid | Late | Goed | Desktop-achtig | Ok | Matig |
| Laptop | 5 | Te lang | Goed | Goed | ~21% | Sell sterk | Icon+label | — | — |
| Desktop | 5 | Te lang | Goed | Goed | ~21% | Sell sterk | Ok | — | — |
| Ultrawide | 4 | Breed | Goed | Sidebar | Late | Sell | Ok | — | Ruimte onderbenut |

---

## 6. Buyer journey

`HOME → begrijpen → zoeken/filters → listing openen → seller → terug → ander item`

| Stap | Status | Friction |
|---|---|---|
| Begrijpen | Deels | Tekst/EN/cookies |
| Zoeken | Werkt | Placeholder EN |
| Categorie/radius | Werkt | Te vroeg te veel controls |
| Listing openen | Werkt | Product-URL ok |
| Seller bekijken | Werkt | Sergio / Vlaardingen / fans |
| Terug | Werkt | Label “Terug” (NL) in EN UI |
| Volgende stap kopen | Zwak | “Sold out”, “Price on request”, “Log in to chat”, checkout niet beschikbaar |

**Buyer next-step clarity:** Middelmatig — ontdekken ja; afronden/kopen onduidelijk voor gast.

---

## 7. Seller journey

`HOME → begrijpen aanbieden → create vinden → soort listing`

| Stap | Status | Friction |
|---|---|---|
| Begrijpen dat je kunt aanbieden | Goed | Sell or share / + |
| Create-entry vinden | Goed | Header, sidebar, mobile + |
| Wat je mag plaatsen | Goed in panel | Meal/garden/creation/inspiration + Wanted/barter |
| Start zonder account | Blok | Join / Log in verplicht |

Guest panel copy (gemeten): *“Share what you make or offer… List something for sale or post a request… Join / Log in”* — inhoudelijk sterk voor first-time sellers.

---

## 8. Gebruiksintentie-persona’s

| Intentie | Begrijpt volgende stap? | Primair pad |
|---|---|---|
| Nieuwe koper | Deels | Zoek/scroll → listing → login chat |
| Nieuwe verkoper | Ja | Sell or share → Join |
| Dienstverlener | Deels | Services chip; hero noemt help/repair |
| Alleen rondkijken | Ja | Feed / Nearby |
| Gericht zoeken | Ja | Search bar |
| Via ads/social | Deels | Hero helpt; fold-chrome frustreert |
| Cold direct .eu | Zwak–mid | EN default + cookies + late listings |

---

## 9. Hero / banner verdict

### Wat zichtbaar is (productie)

- Eyebrow: DIGITAL NEIGHBOURHOOD MARKETPLACE  
- H1-achtig: nearby cook, grow, make and help *(grammaticaal incompleet)*  
- Body (mobile ~1 zin; desktop 2 zinnen incl. “Local first… with or without money”)  
- Keyword-strip: Search · Offer · Ask · Buy · Sell · Trade · Help · Discover  

**Woorden die gelezen moeten worden voor begrip:** eyebrow + 1 bodyzin (~25–40 woorden).  
**Woorden die waarschijnlijk worden overgeslagen:** keyword-strip; tweede desktop-zin; lange opsommingen.  
**Dubbel:** “neighbourhood marketplace” in eyebrow én body; keywords herhalen body-acties.  
**Visueel al duidelijk:** categoriechips + Nearby + locatie kunnen body deels vervangen.  
**Feed-push:** ja — hero + chrome duwen listings onder fold.

### Model A / B / C

| Model | New user | Ads traffic | Returning | Oudere | Seller | Score nu |
|---|---|---|---|---|---|---|
| A Huidig | + begrip / − load | Mid | Te veel | Slecht | Mid | 5/10 |
| **B Gecomprimeerd** | **Best balance** | Goed | Acceptabel | Beter | Goed | **8/10** |
| C Extreem minimaal | Te vroeg | Ok als ad uitlegt | Best | Slecht | Zwak | 4/10 |

**Aanbevolen nu: Model B.**

### Voorgestelde hero-copy (Model B)

**NL**

- Eyebrow: Digitale buurtmarkt  
- Titel: Ontdek wat mensen dichtbij koken, groeien, maken en helpen  
- Sub: Koop, verkoop of ruil huisgemaakt eten, oogst, creaties en diensten in jouw buurt.  
- CTA primair: Ontdek in je buurt  
- CTA secundair: Verkoop of deel  

**EN**

- Eyebrow: Digital neighbourhood marketplace  
- Title: Discover what people nearby cook, grow, make and help with  
- Sub: Buy, sell or trade homemade food, harvest, creations and services around you.  
- CTA primary: Discover nearby  
- CTA secondary: Sell or share  

Verwijderen uit hero: keyword-strip; tweede USP over “with or without money” (verplaats lager / About); herhaalde merklijst.

---

## 10–13. Tekst: noodzakelijk / verkorten / verwijderen / verplaatsen / visueel

| Noodzakelijk (first-time) | Verkorten | Verwijderen/uit hero | Lager op pagina | Visueel uitleggen |
|---|---|---|---|---|
| “Local neighbourhood marketplace” | Body naar 1 zin | Keyword-strip | Barter/zonder geld | Categorie-iconen + echte listingfoto’s |
| Scope: food/garden/creations/services/help | Headline compleet maken | Dubbele definitie | Trust essays | Afstand/radius chips |
| Lokaal bewijs (Nearby/km) | — | Lange actie-opsommingen | “Ontdek HomeCheff” deep dive | Productkaarten i.p.v. logo-hero |
| Duidelijke Discover + Sell CTA | — | — | HCP/Reputation uitleg | — |

---

## 14. Accessibility / 60–80+ issues

- Default **Engels** op NL-markt.  
- EN/NL mengeling (Terug, Eerste verkoop, Ontdek HomeCheff, HCP).  
- Filterchips hoogte ~28–36px (&lt; 44px touch).  
- Icon-only view toggles (Feed/Grid) zonder sterke labels op small screens.  
- Jargon: Reputation, HCP, Inspiration vs Offered, Wanted.  
- Cookie + location banners stapelen.  
- Kleine font in hero body (~11–14px mobile).  
- Hover-afhankelijkheid beperkt (touch ok), maar dense chips moeilijk voor tremor/motoriek.  
- “Sold out” / checkout unavailable ondermijnt vertrouwen bij eerste listing.

---

## 15–16. Navigatie- & CTA-problemen

**Navigatie**

- Mobile: Discover / + / Messages / Profile is helder.  
- Desktop: Reputation onduidelijk voor new users.  
- Landscape: sidebar eet fold; feed verdwijnt.  
- Terug op listing bestaat (goed).

**CTA**

- Primair ontdekken is niet één duidelijke knop op mobile hero (scroll/zoek impliciet).  
- Sell or share is sterker dan Discover.  
- Sign Up concurreert visueel met marketplace-intent.  
- Guest create → Join is logisch maar voelt als muur.

---

## 17. P0 issues

1. Cookie-modal blokkeert first impression (mobile).  
2. Default UI-taal Engels op homecheff.eu.  
3. Incomplete hero-headline (“nearby cook…”).  
4. Listings te ver onder fold (~21–26% zichtbaar).  
5. Phone landscape: geen listing in fold.

---

## 18. P1 issues

1. Drie filterrijen + locatiekaart + locatieprompt vóór content.  
2. EN/NL string-mengeling.  
3. Jargon (HCP, Reputation, Inspiration).  
4. Thin/sold-out first impression op eerste card.  
5. Keyword-strip en dubbele hero-uitleg.  
6. Guest create vereist Join zonder preview van listing-types als echte flow-start.  
7. Kleine touch targets op chips.

---

## 19. P2 improvements

1. Ultrawide: meer feed density / minder lege side chrome.  
2. “Ontdek HomeCheff” vs homepage-discovery verwarring.  
3. Right-rail “Neighborhood moments” copy polish.  
4. Consistent prijs/status presentatie.  
5. Progressive disclosure filters (All + zoek first; rest in Filters).

---

## 20. Quick wins (na goedkeuring; presentatie-only)

1. NL als default of betrouwbare Accept-Language/geo switch.  
2. Hero Model B + grammaticale titel.  
3. Cookie compact / non-blocking.  
4. Locatieprompt collapse na dismiss; filters progressive.  
5. Mobile: hero korter → listing eerder.  
6. Landscape: feed-first, sidebar collapse.

---

## 21. Bewust NIET wijzigen

- Payment / settlement / Stripe Connect  
- Agreement semantics / refunds / disputes  
- Database migrations / schema  
- Feed architecture rewrites / listing architecture rewrites / auth rewrites  

Alleen copy, fold-prioriteit, chrome density, language defaults, accessibility labels — binnen bestaande architectuur.

---

## 22. Aanbevolen hero-model

**Model B — gecomprimeerd.**

---

## 23. Impact-schatting & 25. implementatievolgorde

| # | Aanbeveling | Impact first-impression | Impact 60+ | Effort | Arch-risico |
|---|---|---|---|---|---|
| 1 | NL default | Hoog | Zeer hoog | Laag | Laag |
| 2 | Hero Model B | Hoog | Hoog | Laag | Laag |
| 3 | Cookie non-blocking | Hoog (3s) | Hoog | Laag | Laag |
| 4 | Feed eerder / filters collapse | Hoog ontdekken | Mid | Mid | Laag–mid |
| 5 | Landscape feed-first | Hoog mobile | Mid | Mid | Mid |
| 6 | Jargon/labels | Mid | Hoog | Laag | Laag |
| 7 | Touch targets chips | Mid | Hoog | Laag | Laag |

---

## Friction log (samenvatting)

| Friction | P |
|---|---|
| “Ik weet niet of dit eten of diensten is” tot chips gelezen | P1 |
| “Ik zie het aanbod niet meteen” | P0 |
| “Ik moet te veel lezen” | P0/P1 |
| “Ik weet niet wat deze Engelse knop zegt” (NL user) | P0 |
| “Ik weet niet wat Reputation/HCP is” | P1 |
| “Ik weet niet of dit koop/verkoop of social is” | P1 |
| “Cookie blokkeert alles” | P0 |
| “Hoe plaats ik iets?” → + / Sell or share (relatief helder) | — / P2 |
| “Headline mist ‘mensen’” | P0 |

---

## Bekend merk vs nieuw merk

| | Marktplaats e.d. | HomeCheff nu |
|---|---|---|
| Brand knowledge | Hoog — uitleg mag weg | Laag — uitleg nog nodig |
| Interface comprehension | Zoek + listings volstaan | Zoek + listings **nog niet** genoeg zichtbaar |
| Mag later weg | Lange definitie, keyword-strip, tweede USP | Zelfde — **na** merkbekendheid |
| Mag nu niet weg | — | 1 zin scope + lokale cues + dual CTA |

---

## Eindstatus

**HOMECHEFF_MULTI_PERSONA_UX_CHANGES_RECOMMENDED**

Geen implementatie in deze fase. Wacht op review van dit rapport voordat copy/chrome-wijzigingen worden uitgevoerd.
