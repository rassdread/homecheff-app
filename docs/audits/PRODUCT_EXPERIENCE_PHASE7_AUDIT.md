# Phase 7 — End-to-End Product Experience Audit (Real User Perspective)

**Date:** 2026-07-08
**Lens:** A brand-new person who has never heard of HomeCheff, opening it today.
**Rule of this audit:** experience only. No redesign, no new features, no technical
fixes proposed. Findings target copy, order, visibility, clarity, trust, education,
consistency, microcopy, empty screens, missing explanation, friction, unclear CTAs
and expectations. All quoted text is what a user actually reads on screen.

---

## 1. Executive summary

HomeCheff is a genuinely impressive, feature-complete local marketplace + community:
neighbours sell homemade food, garden produce and creations, offer services and
help, post requests, negotiate, barter, pay securely, arrange delivery, and build
reputation. Under the hood it feels finished. **As a first-time user, though, the
product is under-explained.** It drops you straight into a live feed with a poetic
headline but never plainly says *what it is, why it exists, or why it's different*.
It leans heavily on internal vocabulary the newcomer is never taught — **"Dorpsplein",
"props", "HCP", "Gezocht", "accepted values / tegenwaarden", "Afspraak", "Ambassadeur"** —
and it names the same things in several different ways.

The strongest orientation copy the product owns is either **not shown** on the
homepage, **hidden one click deep** in guest panels, or **buried in the FAQ**.

None of this requires a redesign. The single highest-leverage theme is **education
and naming**: say what HomeCheff is in one sentence, define each concept once at
first contact, and use one consistent word per concept. That alone would lift the
experience from "impressive but puzzling" to "immediately graspable."

**Overall experience score: 7.0 / 10** — excellent capability, held back by
orientation, naming consistency, and first-run education. (Details in §18.)

---

## 2. General impression of HomeCheff

- **Ambitious and coherent in scope.** Everything a local circular marketplace needs
  is present: multi-category selling, services, requests, barter, secure payment,
  proposals/negotiation, agreements, delivery (incl. community couriers), reviews,
  reputation, and a community layer. Very little is actually *missing*.
- **Visually warm and alive.** The homepage feels lively — a "live" pulse label
  ("Er gebeurt iets in je buurt"), an animated brand orbit, category chips, a real
  feed of nearby items. It gives energy.
- **But it assumes you already belong.** The tone is "here's what's happening in your
  neighbourhood" rather than "here's what this is and how to start." A returning user
  will love it; a first-timer has to reverse-engineer the concept.
- **Lots of parallel systems for the user to hold at once**: reviews *and* props/
  waardering *and* HCP *and* badges *and* fans *and* follows; two "my stuff" hubs
  ("Mijn Aankopen" and "Mijn Afspraken"); two creation entry points. Each is fine
  alone; together they raise the cognitive load on day one.

---

## 3. First impression (the first 5 seconds)

What a logged-out visitor sees at the top of the homepage:

- Live label: **"Er gebeurt iets in je buurt"**
- Headline: **"Ontdek wat mensen dichtbij maken, koken en creëren"**
- Subtext: **"Ontdek, koop, verkoop of ruil huisgemaakte maaltijden, tuinoogst en
  creaties. Plaats een oproep, deel inspiratie of vind hulp in je buurt."**
- Chips: 🍲 Eten · 🌱 Tuin · 🎨 Creaties · ✨ Inspiratie · 🔧 Klusjes · ⇄ Ruilen · 🙋 Gezocht · 📍 Dichtbij
- Buttons: **"Ontdek in je buurt"** and **"Verkoop of deel"**

**Do the five questions get answered in 5 seconds?**

| Question | Answered on first screen? |
|---|---|
| What is HomeCheff? | ⚠️ Only implied. No plain "HomeCheff is a local marketplace & community where neighbours sell and share homemade food, produce and crafts." |
| Why does it exist? | ❌ Not stated (the "local, transparent, together" story exists in copy but isn't shown here). |
| What can I do here? | 🟡 Partly — the subtext lists verbs (ontdek/koop/verkoop/ruil/oproep/inspiratie/hulp), which is a lot at once. |
| Why would I use it? | ❌ No benefit/why-me framing on the first screen. |
| Why is it different? | ❌ Not stated on the first screen. |

**Verdict:** The headline is evocative but the *definition* and the *why* are missing
from the first view. The best explainer sentences the product already owns are one
click away (guest info panels) or unrendered. The core metaphor — the **"Dorpsplein"
(village square)** — drives the whole product but is never spoken or defined here.

---

## 4. Complete customer journey audit

### Arrival → Homepage
- Energetic and feed-first. Good. But no one-line "what this is," no "how it works in
  3 steps," and the value proposition the product wrote for itself isn't surfaced.

### Discovery / pillars
- The pillars are shown **three different ways with three different vocabularies**:
  brand names in the hero (**HomeCheff / HomeGarden / HomeDesigner**), Dutch category
  words on mobile (**Eten / Tuin / Creaties**), and English-flavoured labels in the
  advanced filter (**🍳 Chef / 🌱 Garden / 🎨 Designer**). A newcomer can't tell these
  are the same three things.
- Pillar chips are **bare words with emojis and no subtitle**. What "HomeDesigner"
  or "Diensten" contains is only explained if you open a card/panel or hit an empty state.

### Search / filters / chips
- Two stacked axes — a **"Weergave"** row (Alles / Te koop / Gezocht / Diensten /
  Inspiratie) *and* a **"Categorie"** row (Alles / Eten / Tuin / Creaties) — plus
  three location concepts (**"Bereik"**, **"Straal (km)"**, radius mode). Powerful,
  but dense on first contact and the type-vs-pillar distinction isn't explained.
- Empty states are actually a strength: they explain and offer a next step
  ("Geen aanbod binnen {radius} km. Vergroot je straal…").

### Selling
- **The word "Verkopen"/`/sell` lands on paid business subscription plans** (Basic €39
  / Pro €99 / Premium €199, with "KVK", "platform fee") — not on a "list an item"
  button. A casual individual who "just wants to sell cookies" hits a pricing table
  with no obvious free-listing path. The real free listing lives elsewhere and isn't
  linked from here. **This is the single most damaging first-run misdirection.**
- The actual create flow (role tile → media → form → **"🚀 Publiceren"**) is fine and
  has helpful placeholders, but there's no "why sell / what you'll earn" moment, and
  it forward-references "Stripe Connect" and "rollen" (roles) without teaching them.

### Buying
- Product pages are trustworthy (price, "Inclusief BTW", stock, delivery, ratings,
  "Veilig betalen via HomeCheff en Stripe"). Checkout is clear (address → delivery →
  **"Afrekenen - €…"** → Stripe → "Betaling succesvol!" with a helpful "Wat gebeurt er nu?").
- CTA wording drifts: **"In winkelwagen"** on the product page vs "Bestellen" vs
  "Afrekenen" elsewhere. Payment methods (iDEAL/card) only appear on Stripe's page,
  so the app never reassures which methods are accepted.

### Negotiation / barter / agreements
- The **Voorstel → Afspraak → (betalen of bezorgen)** pipeline is well-labelled once
  you're in it, and the composer helpfully says "geen betaling via dit scherm." But
  the model is *implied, not taught*: nowhere up front does it say "you can make an
  offer, agree, then pay or arrange delivery."
- **Two parallel "my stuff" hubs**: purchases live in **"Mijn Aankopen"**, negotiated
  deals live in **"Mijn Afspraken"**. Overlapping but different — a discoverability trap.

### Services / Buurthulp / Gezocht / Community / Profiles / Chat / Delivery / Notifications / Settings
- Covered in detail in §6, §9, §10, §11, §7.

---

## 5. Audit per role

| Role | First-run journey verdict |
|---|---|
| **New visitor (guest)** | Lands in a lively feed but without a definition of HomeCheff or a "why." Best explainers are a click away. **P0 orientation gap.** |
| **New buyer** | Once browsing, buying is safe and clear. Friction: CTA naming drift, and no in-app statement of payment methods before Stripe. Solid overall. |
| **New seller** | **Blocked/misled** by `/sell` showing business subscriptions instead of a free-listing path. Once in the real flow it works, but lacks "what you earn" and explains Stripe/roles late. **P0.** |
| **New service provider** | Services are a real pillar and equal in the feed, but "Diensten" is a bare chip; the artistic-vs-practical split and price models ("Vrijwillige bijdrage") aren't explained at the point of choice. **P1.** |
| **Buurthulp offerer / seeker** | The concept exists but has **no name in the interface** — it's scattered across "Gezocht", "Hulp & Klusjes", "Diensten & Klussen". A user looking to "help a neighbour" can't find that phrase. **P1.** |
| **Community courier** | Understandable but named three ways — **bezorger / buurtbezorger / Ambassadeur** — with mixed "earnings come later" vs "zelfstandig ondernemer" messaging. **P1.** |
| **Seller (established)** | Strong: dashboard, revenue, orders, Stripe payouts, agreements. Reputation surfaces well once populated. |
| **Delivery** | Deal-level delivery is well narrated (statuses, assignment). Buyer isn't always told *who* delivers (maker vs community courier) until assignment. **P2.** |
| **Affiliate** | Referral/affiliate exists and is coherent; a normal user only meets it indirectly (share links). No first-run friction, but "affiliate" concepts are advanced. **P2.** |
| **HCP user** | Reputation ("Reputatie") is visible and motivating, but **"HCP" is shown everywhere and defined only in the FAQ**. The points system is never introduced at first touch. **P1.** |
| **Power user** | Rewarded well — dense filters, agreements cockpit, multi-role creation. This audience is served best. |
| **Administrator** | Admin tooling is separate and out of the consumer experience; not a concern for this audit. |

---

## 6. Audit per main area

- **Homepage:** lively, but missing a one-line definition, a "how it works," and the
  (already-written) value proposition. **P0/P1.**
- **Discovery/pillars:** inconsistent naming across surfaces; bare chips without
  subtitles. **P1.**
- **Search/filters:** powerful, dense; type-vs-category not explained; English leakage
  in one filter. **P1/P2.**
- **Selling:** `/sell` misdirection to subscriptions is the biggest issue. **P0.**
- **Buying/checkout:** strong; minor CTA-wording drift and no in-app payment-method
  reassurance. **P2.**
- **Diensten:** structurally equal, conceptually thin. **P1.**
- **Buurthulp:** unnamed in UI. **P1.**
- **Gezocht:** doesn't signal you can *post*; requester label "Gezochte" is ambiguous. **P1.**
- **Community/trust:** rich but overwhelming; "props" vs "Waardering" split; "HCP"
  undefined. **P1.**
- **Profiles:** excellent when populated ("Vertrouwen"/"like an Airbnb host"), but a
  trust *cliff* for new makers (everything reads "nog geen…"). **P1.**
- **Chat:** clear framing; empty inbox is a dead-end instruction with no button; a
  shipped typo **"Geen geldleg"** appears in the payment path. **P1 (typo), P2.**
- **Delivery:** clear per-deal; role naming inconsistent. **P1.**
- **Notifications:** genuinely good — one place, tappable, deep-links; preferences
  well grouped with hints. (This page's copy isn't translated for EN users.) **P2.**
- **Settings:** logically grouped with per-item descriptions. Good. **P2.**

---

## 7. Trust & community

**Strengths:** The "Vertrouwen" profile tab is a standout — workspace photos
("Achter de schermen": Keuken/Tuin/Atelier), verification badges, delivery info,
member-since, ratings, completed deals (🤝) and deliveries (🚚). The explicit
"net als bij een Airbnb-host profiel" framing is reassuring and smart.

**Frictions:**
1. **Too many parallel scoring systems** introduced at once — reviews, props/
   waardering, HCP, badges, fans, follows, streaks, "Buurtmomenten" — none defined in
   a single sentence. It reads as impressive but overwhelming.
2. **"props" vs "Waardering"** — the button now says "Waardering" but stat labels
   still say "props" ("Meeste props", "props voor dit item"), and "props" is never
   defined except on one login gate ("Waardering is een klein bedankje van de community").
3. **"HCP" is bare everywhere, defined only in the FAQ.** A first-timer sees "{count}
   HCP" on profiles and rankings with no expansion of "HomeCheff Points."
4. **Trust cliff for new makers:** a fresh seller's profile is a stack of "nog geen…"
   empties with no "new maker — give them a chance" reassurance.
5. **"Fans" and "volgers"** are used for the same relationship, hinting at two tiers
   that don't exist.

---

## 8. Marketplace experience

- **Buying is the most polished journey** — trustworthy detail pages, clear checkout,
  reassuring success screen with next steps.
- **Barter/exchange is powerful but under-taught.** "Ruil", "Geld + ruil", "accepted
  values / tegenwaarden / geaccepteerde waarden", "Ruilkansen / Directe ruil /
  Omgekeerde ruil / Wederzijdse ruil" — a rich invented vocabulary with almost no
  plain-language onboarding. A newcomer won't intuit that "waarde" means "what you'll
  accept in trade."
- **Two creation systems** (the classic Dorpsplein/Inspiratie hub vs the offer/
  request/service/barter marketplace form) can produce different mental models for
  "how do I post something."
- **CTA drift** ("In winkelwagen" / "Bestellen" / "Afrekenen") and **"CommunityOrder"**
  leaking into user copy are small but real polish gaps.

---

## 9. Diensten (services)

- **Visibility: good.** A first-class pillar and feed chip, equal to products.
- **Comprehension: thin.** The chip "Diensten" has no subtitle; the only explanation
  ("diensten, klussen, workshops of coaching") appears in the *empty* state, so users
  who see results never read it. The artistic-vs-practical category split and price
  models ("Uurtarief", "Dagtarief", "Prijs op aanvraag", "Vrijwillige bijdrage") are
  presented without a first-run explainer. "Vrijwillige bijdrage" is ambiguous
  (free? pay-what-you-want?).

---

## 10. Buurthulp (neighbour help)

- **The concept has no name in the Dutch interface.** A user will never read the word
  "buurthulp." Helping neighbours is absorbed into **"Gezocht"** (the "Help elkaar"
  spotlight routes to Gezocht), **"Hulp & Klusjes"**, and **"Diensten & Klussen"**.
- **Upside:** it doesn't feel like a separate silo — same feed, same chat, same trust.
- **Downside:** someone whose intent is literally "I want to help / get help in my
  neighbourhood" has no obvious label to grab onto; they must decode "Gezocht" +
  "Klusjes." The intent is implied, never named.

---

## 11. Gezocht (requests / wanted)

- **Powerful idea, weak signalling.** "Gezocht" reads as a *state* ("Wanted"), not an
  *action*; the chip doesn't tell you that you can **post** a request. The subtitle
  "Open verzoeken bij jou in de buurt" describes browsing, not posting. The posting
  verbs ("Verzoek plaatsen", "plaats een oproep") live elsewhere.
- **Terminology sprawl:** one concept is called "Gezocht", "oproep", "verzoek", "Hulp
  gevraagd", "Hulpvraag". And the requester label **"Gezochte" / "Gezocht door"** is
  ambiguous about who is seeking whom (it reads like "the sought person").

---

## 12. Mobile experience

- **Feels close to a native app.** Compact hero, bottom navigation with a central "+"
  to add items, a reachable ecosystem strip, quick-add sheet ("Wat wil je toevoegen?").
- **Frictions:**
  - **"Mijn HC"** in the bottom nav is a cryptic abbreviation; a newcomer won't parse "HC."
  - The "Verdienen / Dashboard" slot changes meaning based on who you are.
  - The "Reputatie" tab leads to a points system ("HCP") that's never introduced.
  - Everything is reachable; the gaps are naming/education, not layout.

---

## 13. Desktop experience

- **Professional and spacious.** Full hero with brand orbit, a personalized sidebar
  when logged in ("Welkom, {name}!"), rich filter panel, multi-column feed.
- **Frictions:**
  - The dense two-axis filter panel is more intimidating on desktop where it's all
    visible at once.
  - "Werken bij" (jobs) sits in primary navigation next to Home — unusual prominence
    for a shopper's first visit.
  - Same naming inconsistencies as elsewhere (pillar names, "Dorpsplein", "props", "HCP").

---

## 14. Biggest frictions (ranked)

1. **No plain "what is HomeCheff / why" on first view** — the definition and value
   prop are missing, hidden, or unrendered.
2. **`/sell` shows business subscriptions, not a free "list an item" path** — actively
   misleads individual sellers.
3. **Untaught core vocabulary** — "Dorpsplein", "props", "HCP", "Gezocht",
   "accepted values / tegenwaarden", "Afspraak", "Ambassadeur".
4. **Same things named differently** — pillars (3 vocabularies), fans/volgers,
   bezorger/buurtbezorger/Ambassadeur, props/Waardering, purchases vs afspraken.
5. **Trust cliff for new makers** — empty profiles give a newcomer nothing to trust.
6. **Barter/exchange richly built but not explained** to newcomers.
7. **Two parallel hubs and two creation systems** raise "where do I go" friction.
8. **Small shipped polish gaps** — a visible typo ("Geen geldleg"), CTA-wording drift,
   the notifications page not translated, "CommunityOrder" leaking into copy.

---

## 15. Biggest opportunities

1. **One-sentence definition + "how it works in 3 steps"** on the homepage (copy the
   product already owns exists — surface it). Highest impact, lowest effort.
2. **Point "Verkopen" at the free listing path first**, and frame subscriptions as an
   upgrade for KVK businesses — not the entry screen.
3. **Define each concept once, at first contact** — a tiny inline "?" / one-liner for
   Dorpsplein, HCP, props/Waardering, Gezocht, accepted values, Afspraak.
4. **Pick one word per concept** and use it everywhere (pillars, fans, courier role,
   props/waardering, purchases/afspraken).
5. **Add subtitles to pillar and type chips** so "Diensten"/"Gezocht"/"HomeDesigner"
   explain themselves without a click.
6. **Give new makers a "just joined — give them a chance" reassurance** instead of a
   wall of "nog geen…".
7. **Name "Buurthulp"** somewhere the intent-driven user can find it.

---

## 16. Quick wins (copy/microcopy only, no redesign)

- Add a single definition line under/near the hero headline (reuse the existing
  value-proposition sentence the product already wrote).
- Fix the shipped typo **"Geen geldleg"** in the deal/payment path.
- Standardize the primary buy CTA wording (one of "In winkelwagen" / "Bestellen").
- Replace the leaked term **"CommunityOrder"** in user copy with a plain word.
- Expand **"HCP"** to "HomeCheff Points (HCP)" on first appearance per surface, or add
  a one-line tooltip.
- Remove the remaining **"props"** strings in favour of the chosen "Waardering."
- Give the empty chat inbox a real button ("Ontdek aanbod") instead of a
  go-elsewhere instruction.
- Add one-line subtitles to the pillar/type chips.
- Reconcile the **"in een paar stappen"** signup promise with the actual single-step form.
- Pick one courier role name (bezorger / buurtbezorger / Ambassadeur) and use it consistently.

---

## 17. P0 / P1 / P2 priorities

### P0 — blocks adoption
- **P0-1** No plain statement of what HomeCheff is / why, on the first view.
- **P0-2** "Verkopen"/`/sell` lands individual sellers on paid business subscriptions
  with no visible free-listing path.

### P1 — strong improvement for users
- **P1-1** Define core vocabulary at first contact (Dorpsplein, HCP, props/Waardering,
  Gezocht, accepted values, Afspraak).
- **P1-2** One consistent name per concept (pillars, fans/volgers, courier role,
  props/waardering, aankopen/afspraken).
- **P1-3** Subtitles on pillar/type chips (Diensten, Gezocht, HomeDesigner, etc.).
- **P1-4** "Gezocht" should signal you can *post* a request; fix the ambiguous
  "Gezochte" requester label.
- **P1-5** New-maker trust reassurance instead of stacked empties.
- **P1-6** Introduce the barter/exchange model in one plain sentence at the point of use.
- **P1-7** Fix the visible **"Geen geldleg"** typo.
- **P1-8** Surface the (already-written) value proposition and a "how it works" on the homepage.

### P2 — nice to have
- **P2-1** Standardize buy-CTA wording; add in-app payment-method reassurance.
- **P2-2** Remove "CommunityOrder" from user-facing copy.
- **P2-3** Translate the notifications page for EN users.
- **P2-4** Reduce visual density / add labels to the two-axis filter panel.
- **P2-5** Tell buyers *who* delivers (maker vs community courier) earlier.
- **P2-6** Reconsider "Werken bij" prominence in primary nav for first-time shoppers.
- **P2-7** Reduce English leakage in the advanced category filter ("Chef/Garden/Designer").

---

## 18. Final score

| Dimension | Score /10 | Note |
|---|---|---|
| Capability / feature completeness | 9.5 | Almost nothing is missing. |
| First-run orientation ("what/why") | 4.5 | Definition & value prop missing/hidden. |
| Naming & terminology consistency | 5.0 | Same things named several ways; untaught jargon. |
| Selling entry experience | 4.0 | `/sell` misdirection to subscriptions. |
| Buying experience | 8.5 | Safe, clear, reassuring. |
| Discovery & search | 7.0 | Rich but dense; bare chips. |
| Trust & community | 7.0 | Great when populated; overwhelming + trust cliff. |
| Profiles | 8.0 | "Airbnb-host" trust model is excellent. |
| Chat & agreements | 7.0 | Clear once inside; under-taught up front; a typo. |
| Delivery | 7.0 | Well narrated per deal; role naming inconsistent. |
| Mobile feel | 8.0 | Near-native; naming gaps, not layout. |
| Desktop feel | 8.0 | Professional; dense filters. |
| Notifications & settings | 8.0 | Clear, well grouped. |

**Overall: 7.0 / 10.** HomeCheff is ready in capability and polish, but for a launch to
thousands of *new* users the experience is gated by first-run education and naming
consistency. Fixing the two P0 items and the P1 vocabulary/definition work — all
copy-level, no redesign — would realistically move this to an 8.5+ without touching a
single feature.

---

### Scope note
This is an experience audit only. No code, components, files or technical solutions
are proposed, and every recommendation stays within existing functionality (copy,
ordering, visibility, clarity, education, consistency). Implementation, if desired,
would be scoped and prioritized in a later phase.
