# HomeCheff — Canonical Brand Language

**Version:** Phase 9B (pilot launch)  
**Status:** Single source of truth for all copy, SEO, metadata and marketing  
**Languages:** NL (primary) + EN (parity required)

---

## Mission

Mensen in de buurt verbinden zodat ze lokaal kunnen aanbieden, ontdekken, afspreken en waarde uitwisselen — met vertrouwen, transparantie en gemeenschap.

**EN:** Connect neighbours so they can offer, discover, arrange and exchange value locally — with trust, transparency and community.

---

## Vision

Een digitaal dorpsplein waar vakmanschap, hulp, creativiteit en lokale economie samenkomen — niet alleen via geld, maar ook via ruil, tegenwaarden en persoonlijke afspraken.

**EN:** A digital village square where craft, help, creativity and the local economy meet — not only through money, but also barter, alternative values and personal agreements.

---

## Elevator pitch (one sentence)

**NL:** HomeCheff is een lokaal platform waar mensen producten, diensten, vakmanschap, creativiteit en hulp aanbieden, verkopen, ruilen en met elkaar verbinden.

**EN:** HomeCheff is a local craft, exchange and community platform.

---

## Short description (~120 chars)

**NL:** Lokaal dorpsplein voor eten, tuin, creaties, diensten, gezocht en ruil — veilig en in je buurt.

**EN:** Local village square for food, garden, creations, services, requests and barter — safely, nearby.

---

## Long description (~280 chars)

**NL:** HomeCheff is het digitale dorpsplein van je buurt. Ontdek wat makers en buren aanbieden: eten, oogst, handgemaakte creaties, praktische diensten en buurthulp. Plaats een oproep in Gezocht, deel inspiratie, maak een voorstel of reken veilig af via HomeCheff Checkout. Lokaal, transparant en community-gedreven.

**EN:** HomeCheff is your neighbourhood's digital village square. Discover what local makers and neighbours offer: food, harvest, handmade creations, practical services and neighbour help. Post a request, share inspiration, make a proposal or pay securely via HomeCheff Checkout. Local, transparent and community-driven.

---

## Website / SEO meta description

Use the **long description** above for root layout, Organization schema and OpenGraph defaults.

Food-related long-tail pages may use food-specific descriptions **only when the page topic is genuinely about food** — never as the primary HomeCheff identity.

---

## App Store / Google Play description

**NL:** HomeCheff verbindt je buurt: ontdek en bied lokaal eten, tuinoogst, creaties, diensten en hulp aan. Koop, verkoop, ruil of spreek direct af. Veilig betalen via HomeCheff Checkout waar beschikbaar. Jouw buurt wordt jouw dorpsplein.

**EN:** HomeCheff connects your neighbourhood: discover and offer local food, garden harvest, creations, services and help. Buy, sell, barter or arrange directly. Pay securely via HomeCheff Checkout where available. Your neighbourhood becomes your village square.

---

## Social media description

**NL:** Lokaal maken, ontdekken en afspreken — eten, tuin, creaties, diensten, gezocht & ruil op één dorpsplein. 🏘️

**EN:** Make, discover and arrange locally — food, garden, creations, services, wanted & barter on one village square. 🏘️

---

## Investor description

HomeCheff is a local marketplace and community platform for the value economy: products, services, craftsmanship, requests (wanted), inspiration and flexible settlement (secure checkout, direct contact, barter, alternative values). Food is one vertical among several — not the platform definition.

---

## Press boilerplate

**NL:** HomeCheff (homecheff.eu) is een lokaal platform voor producten, diensten, vakmanschap, waarde-uitwisseling en community. Het digitale dorpsplein verbindt buurtgenoten voor aanbod, gezocht, inspiratie en veilige of flexibele afspraken.

**EN:** HomeCheff (homecheff.eu) is a local platform for products, services, craftsmanship, value exchange and community. The digital village square connects neighbours for offerings, requests, inspiration and secure or flexible agreements.

---

## What HomeCheff IS

- A **local** craft, exchange and community platform
- A **digital village square** (Dorpsplein) + inspiration space
- A marketplace for **Offered**, **Wanted** and **Inspiration**
- Categories: **Food**, **Garden**, **Creations**, **Services**
- Settlement: **HomeCheff Checkout**, **direct contact**, **barter**, **alternative values**
- A place for **reputation**, **trust** and **neighbourhood support**
- A **value economy** — not money-only commerce

---

## What HomeCheff IS NOT

- ❌ A meal platform or maaltijdsite
- ❌ A recipe website or receptenplatform
- ❌ A cooking platform or kookplatform
- ❌ A food delivery app or thuisbezorgd-alternative as **brand identity**
- ❌ Only a homemade food marketplace

**Food is one category.** Mention it alongside garden, creations, services, help, workshops, coaching, requests and exchange.

---

## Canonical terminology (Phase 7D)

### View / intent (discovery filter)

| Canonical | NL | EN | Do not use as view |
|-----------|----|----|-------------------|
| ALL | Alles | All | — |
| OFFERED | Aangeboden | Offered | `marketplace.canonical.view.offered` |
| WANTED | Gezocht | Wanted | — |
| INSPIRATION | Inspiratie | Inspiration | — |

**Services is a category, never an intent.**

### Category

| Canonical | NL | EN |
|-----------|----|----|
| FOOD | Eten | Food |
| GARDEN | Tuin | Garden |
| CREATIONS | Creaties | Creations |
| SERVICES | Diensten | Services |

### Settlement (follow-up flow only — not a filter)

| Method | NL | EN |
|--------|----|----|
| HomeCheff Checkout | Veilig afrekenen via HomeCheff | Pay securely via HomeCheff |
| Direct contact | Regel direct met aanbieder | Arrange directly with provider |
| Barter | Bespreek ruil | Discuss barter |
| Alternative values | Alternatieve tegenwaarden | Alternative values |

---

## How to describe Food (one category)

✅ “Eten is één van de categorieën op het dorpsplein — naast tuin, creaties en diensten.”  
✅ “Ontdek lokaal eten, oogst, creaties en hulp in je buurt.”  
❌ “HomeCheff is dé plek voor thuisgemaakte maaltijden.”  
❌ Leading with meals in platform-level copy.

Food long-tail SEO (maaltijden, thuisgekookt, koken) is allowed **on food-specific landing pages** as entry points into the ecosystem.

---

## Tone of voice

- **Warm, local, clear** — neighbour-to-neighbour, not corporate delivery
- **Inclusive** — hobbyists and small sellers welcome
- **Honest** — transparent about fees, settlement options and limits
- **Community-first** — reputation, HCP, trust; not only transactions
- **Practical** — short sentences, no jargon unless explained

---

## Discovery philosophy (differentiator)

People do not only shop with money. They discover what they can buy, exchange, offer, what others accept, and what skills and help have value. Reflect this naturally in product and SEO copy.

---

## Trust positioning

Emphasize: local · safe · transparent · community · reputation · verified users · HomeCheff Checkout · flexible agreements · value exchange.

---

## NL/EN parity

Every new or updated user-facing string must exist in `public/i18n/nl.json` and `public/i18n/en.json`. EN must not leak Dutch terms (e.g. use “Wanted”, not “Gezocht”).

---

## Change control

Copy changes follow this document. Marketplace architecture (Phases 7A–8E) is out of scope for brand edits unless explicitly approved.
