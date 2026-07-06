# Viral Activation Concepts

**Phase:** 3C — Architecture only  
**Last updated:** 2026-07-06

---

## Purpose

Identify activations with **word-of-mouth potential** — things people mention at dinner, at the club, or in the group chat — while staying **legal, safe, voluntary, non-harassing, and community-positive**.

Viral ≠ spam. Viral = **memorable real-world stories** tied to HomeCheff roles.

---

## Safety & ethics charter

| Rule | Requirement |
|------|-------------|
| Legal | No pyramid schemes, no unlicensed raffles, GDPR-safe invites |
| Safe | No meeting strangers in unsafe settings; prefer public pickup/workshop venues |
| Voluntary | Opt-in only; easy dismiss; no repeated nagging |
| Non-harassing | No “you’re letting down the community” guilt |
| Community-positive | Net benefit to neighbourhood, not extraction |

**Forbidden viral patterns:** Challenge chains, public shaming, competitive leaderboards in feed, pay-to-viral.

---

## Tier 1 — High talkability (recommended pilots)

| ID | Concept | Why people talk | Real-world hook |
|----|---------|-----------------|-----------------|
| S01 | **QR at the market** | “Scan my HomeCheff — I sell tomato jam” | Maker prints QR, stall conversation |
| C08 | **Bring-a-friend workshop** | Shared experience | Two attend cooking class |
| H02 | **Help a neighbour** | Moral pride story | Fulfilled local REQUEST |
| E04 | **First barter story** | “We swapped lessons for vegetables” | Completed barter deal |
| P08 | **Sports club catering** | Team WhatsApp shares link | Club orders from local chef |
| W05 | **Last seat at workshop** | Mild FOMO, real capacity | Genuine `capacityRemaining` |
| C07 | **Support a starter** | “I was their first customer” | First deal for new seller |
| L04 | **Visit the workshop** | Behind-the-scenes content offline | Workspace visit / pickup |
| P03 | **Ambassador neighbourhood** | “I brought our street online” | 5+ neighbours joined via welkom |
| B05 | **Gemeente market day** | Civic pride | Official market + local makers |

---

## Tier 2 — Seasonal & event-led

| Concept | Talkability | Guardrails |
|---------|-------------|------------|
| Harvest swap weekend | High in GROW season | No waste shaming |
| neighbourhood BBQ supply | Cheff + GROW combo | Allergen clarity |
| Koningsdag orange bake sale | Dutch cultural moment | Time-boxed activation |
| School fête makers | Parents share | School consent |
| Christmas workshop gift | Workshop output as gift | Capacity limits |
| New Year resolution coaching | COACHING listings | No health claims |
| Spring garden start kits | GROW starters | Real stock only |
| Local election market (neutral) | Civic | No political endorsement |
| Ramadan/Eid meal sharing | Community | Cultural sensitivity |
| Sint surprise handmade | CREATE gifts | Child-safe |

---

## Tier 3 — Partner & institution (slow burn, high trust)

| Concept | Who talks | Outcome |
|---------|-----------|---------|
| Invite sports club (P08) | Coach / board | Team uses local food |
| Invite school (P07) | Parent council | Workshop in curriculum |
| Invite municipality (P06) | Civil servant | Pilot market |
| Invite business (P05) | Shop owner | Second location online |
| Mentor new seller (P10) | Established maker | Human story |
| Makerspace open day (B06) | Members | Discovery walk-in |
| Garden association (B07) | Chair | Collective GROW |
| Charity stall (B08) | Volunteers | Donation + visibility |
| Business week (B09) | Chamber of commerce | Batch onboarding |
| Cross-promote (B10) | Two owners | Ethical local pact |

---

## Narrative templates (copy architecture, not final i18n)

**Starter support (C07):**  
“{name} is nieuw in de buurt. Eén lokale bestelling maakt echt verschil.”

**Barter (E04):**  
“Ruil is geen truc — het is een afspraak die je face-to-face afsluit.”

**Workshop buddy (C08):**  
“Neem iemand mee. Samen naar de workshop = samen onthouden.”

**QR (S01):**  
“Geen app-verkoop — gewoon even laten zien wat je maakt.”

---

## Anti-patterns (do not ship)

| Pattern | Why rejected |
|---------|--------------|
| “Share or lose your listing” | Coercive |
| Public donor wall without consent | Privacy |
| Leaderboard of most invites | Harassment adjacent |
| Auto-invite entire contact book | GDPR / spam |
| “Viral bonus HCP” as prompt | Gamification gate (forbidden eligibility) |
| Fake neighbour alerts | Trust destruction |

---

## Measurement (non-ranking)

- `activation_viral_share` — user tapped share sheet (optional)
- `welkom_conversion` — invite link → signup (existing)
- `activation_completed` + story tag — self-reported “I did this”
- Qualitative: support tickets, community feedback

**No feed ranking impact from viral completion.**

---

## Mapping to library

Tier 1 IDs: S01, C08, H02, E04, P08, W05, C07, L04, P03, B05 — cross-ref [ACTIVATION_LIBRARY_100.md](./ACTIVATION_LIBRARY_100.md).
