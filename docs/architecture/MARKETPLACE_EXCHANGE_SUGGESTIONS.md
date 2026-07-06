# Marketplace Exchange Suggestions — Phase 4E

**Status:** Architecture only (no implementation)  
**Last updated:** 2026-07-06  
**Builds on:** [MARKETPLACE_VALUE_EXCHANGE_SYSTEM.md](./MARKETPLACE_VALUE_EXCHANGE_SYSTEM.md), [MARKETPLACE_DETAIL_PAGE_SYSTEM.md](./MARKETPLACE_DETAIL_PAGE_SYSTEM.md), [MARKETPLACE_EXCHANGE_MATCHING.md](./MARKETPLACE_EXCHANGE_MATCHING.md)

---

## North star

Exchange opportunities become **visible, optional, and contextual** — without changing discovery ranking, replacing discovery sections, or masquerading as sponsored content.

```
4D match resolver  →  Suggestion classifier  →  Surface router  →  UI module (future)
        ↓                      ↓                      ↓
   Score + signals      Suggestion type          Caps + dedup
```

**This phase defines architecture only.** No UI, no resolver code, no matching engine changes.

**Prior phases:**

| Phase | Delivered |
|-------|-----------|
| 4A | Value exchange taxonomy, payment, barter acceptance, desired exchange |
| 4C | Detail page sections including `value_exchange` block |
| 4D | `ExchangeListingProfile`, match types, score, signals, graph foundation |

---

## 1. Suggestion types

User-facing suggestion types are **presentation labels** — distinct from 4D `ExchangeMatchType` ids. A single resolved match may map to one primary suggestion type plus optional modifiers (e.g. `LOCAL_EXCHANGE`).

### Canonical types

| Type | User meaning | Primary 4D mapping | Key signals |
|------|--------------|-------------------|-------------|
| `DIRECT_EXCHANGE` | You offer something someone wants | `DIRECT_MATCH`, `DESIRED_EXCHANGE_MATCH` | `EXACT_DESIRED_MATCH` |
| `REVERSE_EXCHANGE` | Someone offers something you want | `DIRECT_MATCH` (inverted perspective) | `EXACT_DESIRED_MATCH` |
| `MUTUAL_EXCHANGE` | Both sides can exchange value | `MULTI_MATCH` + mutual overlap | `MUTUAL_EXCHANGE_READINESS`, `POTENTIAL_BARTER_OPPORTUNITY` |
| `LOCAL_EXCHANGE` | Opportunity within local radius | Any match + distance gate | `distanceScore` ≥ 0.6 (~≤10 km) |
| `COMMUNITY_EXCHANGE` | Interesting community-wide opportunity | `CATEGORY_MATCH`, `SUBCATEGORY_MATCH` | `STRONG_CATEGORY_OVERLAP`, trust eligible |
| `MULTI_STEP_EXCHANGE` | Future chain-ready path (A→B→C) | Graph path length ≥ 2 | `FUTURE_RECOMMENDATION_READY` + chain meta |

### Type resolution priority

When multiple types apply, show **one primary** label:

```
MULTI_STEP_EXCHANGE (future, 4F only)
  → MUTUAL_EXCHANGE
  → DIRECT_EXCHANGE / REVERSE_EXCHANGE (perspective wins)
  → LOCAL_EXCHANGE (modifier badge if also local)
  → COMMUNITY_EXCHANGE
```

`LOCAL_EXCHANGE` and `COMMUNITY_EXCHANGE` may appear as **secondary chips** on the same card (e.g. “Mutual exchange · 4 km away”).

### Perspective rules

| Viewer context | `DIRECT_EXCHANGE` | `REVERSE_EXCHANGE` |
|----------------|-------------------|---------------------|
| Viewing own listing | Matches where **your** offer satisfies **their** want | — |
| Viewing other's listing | — | Matches where **their** offer satisfies **your** want |
| Profile aggregate | Top outbound direct matches | Top inbound reverse matches |

### Examples

| Scenario | Type |
|----------|------|
| You offer herbs; neighbour wants basil | `DIRECT_EXCHANGE` + `LOCAL_EXCHANGE` |
| You want portrait; maker offers artistic.portrait | `REVERSE_EXCHANGE` |
| Both barter-open; each accepts the other's category | `MUTUAL_EXCHANGE` |
| Strong 🍳 overlap in your gemeente, 18 km | `COMMUNITY_EXCHANGE` |
| Herb grower → meal cook → repair service chain | `MULTI_STEP_EXCHANGE` *(4F)* |

---

## 2. Surfaces

Suggestions live on **contextual surfaces** — never inside organic discovery section ordering.

| Surface | Role | Allowed | Notes |
|---------|------|---------|-------|
| **Tile** (browse feed) | — | **No** | Would imply feed promotion / ranking |
| **Tile** (owner: my listings) | Awareness | Teaser badge | “2 ruilkansen” — links to profile module |
| **Preview** (long-press sheet) | Discovery | Yes | Max 1 line + CTA “See exchange options” |
| **Detail page** | Primary conversion | Yes | Section after `value_exchange`, before `trust_block` *(future slot)* |
| **Profile** (owner) | Hub | Yes | `ExchangeSuggestionsModule` — top matches |
| **Profile** (visitor) | — | **No** | Privacy + spam risk |
| **Sidebar** (desktop right) | Ambient | Yes | Compact stack below `OpportunityModule` |
| **Mobile feed** | Timed insert | Yes | Full-width band — **not** inline tile reorder |
| **Notifications** | Re-engagement | Future | High-intent only — see notification audit |

Full matrix: [EXCHANGE_SURFACE_MATRIX.md](../audits/EXCHANGE_SURFACE_MATRIX.md).

### Surface ownership

Exchange suggestions are a **new content class** — `exchange_suggestion`:

- **Not** a discovery section (`buildDiscoveryFeed` does not own)
- **Not** sponsored (`SponsoredModule` / `SP` slots)
- **Not** activity cards (3C activation engine)
- **Not** growth surfaces (3M) — may **link** to exchange module but separate resolver

Future resolver (4F+): `resolveExchangeSuggestions({ viewer, context, surface })`.

---

## 3. Visibility rules

### Always true

1. **Never affect ranking** — suggestion score does not write to feed rank, section order, or tile position.
2. **Never replace discovery sections** — organic shelves (`Nieuw in de buurt`, etc.) unchanged.
3. **Never appear as sponsored** — no paid slot, no “Aanbevolen” mimicry, no `sponsoredBoost`.
4. **Optional and contextual** — user dismisses, snoozes, or ignores without penalty.
5. **Clearly labeled** — copy uses “Ruilkans” / “Exchange opportunity”, not generic discovery language.
6. **Eligibility gated** — both listings pass `evaluateExchangeEligibility()`; suppressed pairs stay hidden.
7. **Auth required** — guest users see no suggestions (preview may show locked teaser in 4F).

### Context gates

| Context | Show suggestions when |
|---------|----------------------|
| Detail | Viewing barter-capable listing (`BarterOpenness` ≠ `MONEY`) OR `REQUEST` |
| Profile | Owner has ≥1 active barter-capable listing |
| Sidebar | Viewer logged in + ≥1 eligible local match in pool |
| Mobile insert | Same as sidebar + insert budget remaining |
| Notification | Opt-in + high-confidence match + cooldown clear |

### Hard forbiddens

| Forbidden | Reason |
|-----------|--------|
| Inject into organic tile sort | Ranking change |
| Replace `related_listings` | Discovery section ownership |
| Use sponsored placement IDs | Commercial confusion |
| Show on `INSPIRATION` detail | Out of marketplace exchange scope |
| Show same-user matches | `shouldSuppressMatchPair` |
| Boost visibility via HCP/views/followers | Engagement gaming |

---

## 4. Recommendation rules

### Allowed inputs (from 4D score model)

| Signal | Use in suggestions |
|--------|-------------------|
| `exchangeScore` (0–100) | Primary sort within surface |
| `distance` / `distanceScore` | Local filter + `LOCAL_EXCHANGE` type |
| `availability` | Hide expired / unavailable listings |
| `acceptedCategories` / taxonomy overlap | Type classification + copy |
| `desiredExchanges` | `DIRECT_EXCHANGE` / `REVERSE_EXCHANGE` |
| `trustEligibility` | Minimum gate (tier ≥ 1 or `FUTURE_RECOMMENDATION_READY`) |
| `recency` | Tie-breaker only |
| 4D `ExchangeSignal` kinds | Card subtitle chips |

### Forbidden inputs

Same as `FORBIDDEN_EXCHANGE_SCORE_SIGNALS` plus:

| Signal | Reason |
|--------|--------|
| `viewCount` | Popularity proxy |
| `followerCount` / `fansCount` | Social proof gaming |
| `hcpPoints` | Economy gamification |
| `workspacePropsCount` / `itemPropsCount` | Engagement metric |
| `blendedRating` / `averageRating` | Wrong trust channel |
| `reputationScore` | Composite ranking |
| `feedRankBoost` / `sponsoredBoost` | Commercial / ranking |
| Session scroll depth | Engagement optimization |

**Rule:** Suggestion sort = `exchangeScore` DESC → `distanceScore` DESC → `recencyScore` DESC. No ML engagement layer in 4E–4F.

### Minimum score thresholds (by surface)

| Surface | Min score | Min signals |
|---------|-----------|-------------|
| Detail | 55 | ≥1 signal |
| Profile module | 50 | ≥1 signal |
| Sidebar | 60 | ≥2 signals OR mutual |
| Preview teaser | 65 | `EXACT_DESIRED_MATCH` OR `MUTUAL_EXCHANGE_READINESS` |
| Mobile insert | 65 | Same as sidebar |
| Notification | 75 | `MUTUAL_EXCHANGE_READINESS` OR exact desired + local |

---

## 5. Suggestion caps (anti-spam)

### Per page

| Surface | Max visible | Max expanded |
|---------|-------------|--------------|
| Detail | 3 cards | 1 expanded |
| Profile module | 5 computed, 3 shown | 1 expanded |
| Sidebar | 2 compact cards | 0 (link to profile) |
| Preview sheet | 1 teaser line | — |
| Mobile insert band | 2 cards | 1 |

### Per session (authenticated viewer)

| Cap | Limit |
|-----|-------|
| Total suggestion impressions | 8 |
| Mobile feed insert bands | 2 |
| Sidebar renders | 4 (same module, rotation) |
| Detail pages with suggestions shown | 5 |
| Dismiss actions before global cooldown | 3 → 24h snooze all |

### Per seller (counterparty)

| Cap | Limit |
|-----|-------|
| Same seller across all surfaces / day | 3 impressions |
| Same seller on single page | 1 card |
| Same listing pair after dismiss | Hidden 14 days |

### Per listing (source)

| Cap | Limit |
|-----|-------|
| Outbound suggestions computed | 10 |
| Outbound shown on own detail | 3 |
| Inbound suggestions on detail | 3 |

### Dedup

- Same `listingId` pair → one card (keep highest score).
- Same `userId` pair → suppress (4D rule).
- If match already shown on detail this session → suppress sidebar duplicate.

---

## 6. Desktop UX

### Sidebar — `ExchangeSuggestionModule`

**Position:** Right sidebar, order **9.5** — after `OpportunityModule` (9), before `EventModule` (10). See [SIDEBAR_ARCHITECTURE.md](./SIDEBAR_ARCHITECTURE.md).

```
┌─────────────────────────┐
│ Ruilkansen in de buurt  │
├─────────────────────────┤
│ 🔄 Mutual · 3 km        │
│ Basil ↔ Your herbs      │
│ [Bekijk]                │
├─────────────────────────┤
│ 🌱 Direct · 8 km        │
│ They want your tomatoes │
│ [Bekijk]                │
└─────────────────────────┘
      → Alle ruilkansen
```

- **Size:** `compact` (2 cards max)
- **Dismissible:** yes — 7-day cooldown
- **Guest:** hidden
- **Collapse:** into “Meer in je buurt” accordion when stack overflows

### Detail page — `exchange_suggestions` section (future)

Insert **after** `value_exchange`, **before** `trust_block` — does not alter 4C canonical ids; implemented as sub-block inside `value_exchange` collapsible OR new optional section `exchange_suggestions` slotted at index 2.5 (4F wiring decision).

```
Value exchange block (4A)
  ↓
Exchange suggestions (4E) — max 3
  ↓
Trust block (4C)
```

Card anatomy:

- Type chip (`Mutual exchange`, `4 km`)
- Counterparty listing thumbnail + title
- One-line overlap summary (icons from 4A taxonomy)
- CTA: “View listing” / “Send proposal” (kind-aware from 4C action matrix)
- Dismiss (⋯)

### Profile — `ExchangeSuggestionsProfileModule`

**Owner profile only** (`PS` surface).

| Zone | Content |
|------|---------|
| Header | “Your exchange opportunities” |
| Tabs | Outbound (you offer) · Inbound (you want) |
| List | Top 3 per tab, score sorted |
| Footer | Link to messages / create listing |

Visitor profiles: **no module**.

---

## 7. Mobile UX

Follows [MOBILE_SURFACE_ARCHITECTURE.md](./MOBILE_SURFACE_ARCHITECTURE.md) insert rules.

### Feed inserts — `ExchangeSuggestionFeedBand`

| Property | Value |
|----------|-------|
| Type | Full-width band (not tile) |
| Priority | **Below** activity cards, **above** sponsored |
| Index | @14, @28 (max 2/session) |
| Yield | Suppressed if activity card @12; never @4 (too early) |

```
─── tiles ───
─── tiles ───
┌──────────────────────────────┐
│ 🔄 Ruilkans · 2 km           │
│ Jullie kunnen waarde ruilen  │
│ [Bekijk]  [Niet nu]          │
└──────────────────────────────┘
─── tiles ───
```

### Bottom sheets

| Trigger | Sheet |
|---------|-------|
| Preview long-press | `ExchangeSuggestionTeaserSheet` — 1 match summary |
| Detail “See all” | `ExchangeSuggestionListSheet` — full list for listing |
| Feed band tap | Same list sheet |
| Profile module tap | Tabbed list sheet |

Sheets use 4C actions — `request_proposal` for REQUEST/SERVICE, `message` for exploratory contact.

### Profile modules

Mobile profile owner tab: same data as desktop `ExchangeSuggestionsProfileModule`, stacked below growth progress (3M), not replacing it.

### Short feed

When organic listings &lt; 4: **no** exchange feed insert (same rule as sponsored).

---

## 8. Notification architecture (future)

Phase 4E **prepares** notification contracts only — no push implementation.

See [EXCHANGE_NOTIFICATION_READINESS.md](../audits/EXCHANGE_NOTIFICATION_READINESS.md).

| Notification kind | Example copy |
|-------------------|--------------|
| `NEARBY_ACCEPTS_YOUR_OFFER` | “Someone nearby accepts what you offer” |
| `NEW_LOCAL_EXCHANGE` | “New local exchange opportunity” |
| `MUTUAL_EXCHANGE_FOUND` | “Mutual exchange found with [listing]” |
| `DESIRED_MATCH_FOUND` | “A listing matches what you wanted” |

**Global notification caps:** 1 exchange push / day, 3 / week, opt-in required.

---

## 9. Data contract (future — not implemented in 4E)

```typescript
type ExchangeSuggestion = {
  id: string;                          // stable pair + type hash
  suggestionType: ExchangeSuggestionType;
  primaryMatchType: ExchangeMatchType;   // from 4D
  score: number;
  signals: ExchangeSignal[];             // from 4D
  sourceListingId: string;
  targetListingId: string;
  distanceKm: number | null;
  labelKey: string;                      // marketplace.exchange.suggestions.*
  surfaceHints: ExchangeSurfaceId[];
  dismissedUntil?: string;               // ISO
};

type ExchangeSuggestionType =
  | 'DIRECT_EXCHANGE'
  | 'REVERSE_EXCHANGE'
  | 'MUTUAL_EXCHANGE'
  | 'LOCAL_EXCHANGE'
  | 'COMMUNITY_EXCHANGE'
  | 'MULTI_STEP_EXCHANGE';
```

i18n namespace (future): `marketplace.exchange.suggestions.*` — distinct from `marketplace.exchange.signals.*` (4D).

---

## 10. Phase sequence

| Phase | Focus |
|-------|-------|
| **4E** | Suggestion + surface architecture *(this)* |
| **4F** | `resolveExchangeSuggestions()` + read-only UI on profile/detail |
| **4G** | Mobile insert + sidebar module |
| **4H** | Notifications + `MULTI_STEP_EXCHANGE` chains |
| **4I** | Message-thread match context |

---

## 11. Out of scope (4E)

- UI components or API routes
- Matching engine / score weight changes
- Discovery ranking or section registry changes
- Sponsored placement integration
- Push notification delivery
- Automated proposal / barter execution

---

## References

- [EXCHANGE_SURFACE_MATRIX.md](../audits/EXCHANGE_SURFACE_MATRIX.md)
- [EXCHANGE_NOTIFICATION_READINESS.md](../audits/EXCHANGE_NOTIFICATION_READINESS.md)
- [EXCHANGE_SIGNAL_MATRIX.md](../audits/EXCHANGE_SIGNAL_MATRIX.md)
- [SURFACE_OWNERSHIP_MATRIX.md](../audits/SURFACE_OWNERSHIP_MATRIX.md)
- [MARKETPLACE_EXCHANGE_PHASE4E.md](../progress/MARKETPLACE_EXCHANGE_PHASE4E.md)
