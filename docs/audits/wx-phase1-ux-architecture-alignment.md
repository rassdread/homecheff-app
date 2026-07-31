# HomeCheff Workspace Experience (WX)
## Phase 1 — UX / UI Architecture Alignment Report

**Status:** Specification only — no implementation in this phase  
**Architecture baseline:** Adaptive Workspace presentation **FROZEN** (`adaptive-workspace-presentation-production-v1`)  
**Design constitution:** [`docs/architecture/homecheff-workspace-design-language-v1.md`](../architecture/homecheff-workspace-design-language-v1.md) **(WDL 1.0 — binding)**  
**Authority preserved:** GeoFeed remains sole runtime/data owner · Controlled Host remains `COMMIT_READY` · No ownership transfer  
**Production mode:** `HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=on`  
**Core question:** What must change so HomeCheff finally feels like one continuous Adaptive Workspace instead of a responsive website?

> This audit maps **violations** of WDL 1.0. WDL is the constitution; this document is the gap report. Implementation must comply with WDL, not the other way around.

---

## Executive verdict

**Technically:** Adaptive Workspace.  
**Experientially:** Traditional responsive website with a three-column marketing homepage.

Architectural correctness does **not** equal Workspace feeling. The frozen presentation shell (`FeedControlledHostShell` → `FeedWorkspaceVisibleLayout` → stable GeoFeed) is real. The **chrome around it** (marketing hero, website NavBar, finite card rails, stacked discovery controls, page-like scroll) still teaches the user they are on a **landing page**.

**Honest identity answer (Section 1):** **A — a responsive website**, not yet a persistent digital workspace.

---

## Evidence anchors (implementation)

| Surface | Path | Observation |
| --- | --- | --- |
| Page composition | `components/home/HomePageClient.tsx` | Hero rendered **above** the workspace tree; when AW visible, hero wrapper is `max-w-[720px] mx-auto` — center-column width only |
| Workspace grid | `components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx` | True AvailableSpace grid + permanent rails; multi-col height `100dvh - 5rem` |
| Left rail | `components/home/HomeDesktopLeftSidebar.tsx` | Quick actions, env links, marketplace links, collapsible `FeedFiltersPanel` — finite card stack |
| Right rail | `components/home/HomeDesktopSidebar.tsx` | Welcome, reputation, growth, community FAQ card, momentum, promotions — finite “cockpit” cards |
| Hero | `components/home/HomeHeroSection.tsx` | Marketing dorpsplein hero: chips, dual CTAs, platform strip |
| Nav | `components/NavBar.tsx` | Website IA: Home / Werken-bij / auth / messages / HCP / create / language / cart / bell / profile — equal visual weight |
| Discovery | `components/feed/GeoFeed.tsx` | Intent (“Ik zoek” / “Ik bied”), accepted values, chips, geo, sort — overlapping mental models |
| Filter placement | `GeoFeed` + `FeedFiltersPanel` / `FeedSidebarFilters` | **Legacy:** filters live in left rail via composed context. **AW ON:** `homeComposedLayout=false` → fat filter card stacks **in primary above listings**; left `FeedFiltersPanel` renders **empty** |
| Right-rail plan | `useHomeSurfacePlan()` in `HomeDesktopSidebar` | Growth / activity stacks need surface plan from composed GeoFeed context → **silent / null under AW** |

Structural UX inventory also cross-checked via [Explore Workspace UX surfaces](a63bb277-6c91-41ec-85a5-697da6a5dc4e).

---

## Structural defects unique to AW ON (must enter WX Phase 1)

These are not “taste” issues. They are **presentation wiring gaps** that make the Workspace feel broken or hollow while architecture claims rails are live.

| ID | Defect | User-visible effect | Spec fix direction (still presentation-only) |
| --- | --- | --- | --- |
| **S1** | Left-rail “Ontdekken” + `FeedFiltersPanel` mounts but body is **null** without `homeComposedLayout` context | Collapsible filters rail looks present, contains nothing useful | Either bridge filter UI into start rail without remounting GeoFeed, or remove hollow section until bridged |
| **S2** | AW desktop puts the **full non-compact filter card in the primary column** above feed cards | Long scroll before first listing; fights feed-first goal | Stage shows summary chips only; advanced facets in start rail or sheet |
| **S3** | Right-rail `GrowthActionStack` / `DesktopRightSidebarSurfaceStack` depend on `useHomeSurfacePlan()` which is empty under AW | Community cockpit feels dead / incomplete vs legacy | Provide plan to rail widgets without transferring GeoFeed ownership (read-only presentation bridge) |
| **S4** | Feed column max 720px inside a wider primary track | Empty gutters between feed and rails | Accept readable feed cap but fill gutters with stage toolbar / context, or optically center stage chrome |
| **S5** | COMFORT band hides **start**, keeps **end** | Discovery IA flips: tools vanish, cockpit remains | When start hides, ensure primary carries a compact filter summary so discovery does not disappear |
| **S6** | Competing discovery surfaces | Ecosystem strip + mobile toolbar + left marketplace links + hero chips + primary filters | One discovery hierarchy (Section 7); demote duplicates |
| **S7** | Duplicate USP / education taglines | Left blurb + direction toggle tagline + offer/want blocks | Single orientation message in shell strip |

---

# SECTION 1 — Workspace identity

### Verdict: **A. Responsive website**

Not B. It does **not** yet feel like a persistent digital workspace (Notion / Linear / Slack / Figma class — *feeling*, not imitation).

### Why — every reason

1. **Page metaphor:** Document scroll, marketing hero, then “content.” Workspace apps open into a chrome + stage.
2. **Hero is marketing, not workspace chrome:** Gradient banner introduces a *product pitch*, not a *work surface*.
3. **Hero is width-capped to the feed column** (`max-w-[720px]`) while rails exist separately below — the three columns are not introduced as one app.
4. **NavBar is website navigation:** Destinations and account chrome compete as peers; no task grouping.
5. **Primary action is one peer among many:** Create/Share sits beside Messages, HCP, Language, Login.
6. **Rails look like sidebar widgets that end:** Card stacks with `pb-3` and finite modules — not persistent workspace identity.
7. **Independent column scroll ending in emptiness:** When rail content ends, the rail dies visually; the workspace does not “continue.”
8. **Discovery stack reads as a form/landing funnel:** Filters → location → radius → search → sort → feed.
9. **Dorpsplein visual language:** Rounded marketing cards, hero pulse dots, category emoji chips — brochure, not tool.
10. **Dual chrome:** Top NavBar + mobile bottom nav + mobile ecosystem strip + UserActionCenter — page assemblies, not one shell.
11. **Guest experience is acquisition-first:** Login/Register premium shadows; workspace productivity is secondary.
12. **Landscape/desktop still sell first, work second:** AvailableSpace adds rails, but the emotional order remains Hero → explain → filter → browse.
13. **No persistent “you are in Workspace” frame:** No continuous left/right identity strip that survives scroll/context change.
14. **Feed is the product but not the first visual priority:** Listings start after marketing + controls.
15. **Architecture is invisible to the user:** Stable GeoFeed mount and AvailableSpace matter technically; they do not yet create the *feeling* of one continuous app.

---

# SECTION 2 — Hierarchy

### Current state: everything competes

| Level | What should live here | What currently lives here |
| --- | --- | --- |
| **Primary** | Feed stage + Create | Marketing hero, multiple CTAs, nav peers, filter stack |
| **Secondary** | Active filters / place context | Entire discovery form, side card stacks, community FAQ |
| **Tertiary** | Account, language, legal, reputation | Same visual weight as workflow in NavBar |
| **Hidden** | Advanced filters, accepted-values depth, role dashboards | Often visible by default (left filters open) |
| **Missing** | Workspace shell identity, contextual rail modules, single obvious Create, clear search object (“what am I finding?”) | — |

### Failures

- Primary actions are not obvious within 1 second.
- Secondary controls feel equally important (chips, geo, sort, hero CTAs, nav Create).
- User workflow is unclear: *browse?* *sell?* *search people?* *trade values?* *join community?*

---

# SECTION 3 — Top navigation

### Diagnosis: website navigation, not Workspace navigation

**Current IA (desktop):** Logo · Home · Werken-bij · (guest Login icon) · Messages · Reputation · **Create** · Language · Login/Register or Cart/Bell/Profile.

**Problems**

| Issue | Detail |
| --- | --- |
| Equal-level actions | Destination links, reputation, create, language share similar ghost/button treatment |
| No task grouping | Discover / Create / Communicate / Account are not clustered |
| Account mixed with workflow | Profile/cart/bell sit in the same competitive band as Create |
| Primary CTA risk | Mid breakpoints compress labels; production SSR has shown empty label spans under load/i18n timing; Create can read as icon-only |
| Desktop waste | Ultra-wide does not gain a clearer command bar — just more padding |
| “Werken-bij” in primary band | Hiring/marketing destination at same altitude as the work surface |
| Responsive | Hamburger dump + bottom nav duplicate paths without Workspace semantics |

### Workspace navigation direction (spec — not implement yet)

**Command bar, not site header:**

1. **Brand / Workspace home** (always)
2. **Work cluster:** Discover (current feed) · Create (dominant) · Messages
3. **Context cluster (optional):** Place / mode indicator (browsing vs offering)
4. **Account cluster (trailing, de-emphasized):** Notifications · Profile · Language (menu)
5. **Demote:** Werken-bij, FAQ, legal → overflow / footer / profile

Create must remain **always labeled** at every breakpoint where text fits; icon-only only below a defined micro-width with `aria-label`.

---

# SECTION 4 — Primary action

### Platform verbs to support

Create · Sell · Share · Offer · Request — currently collapsed into `ctaShare` / create flow / `/sell/new`, but **scattered**.

### Current placements (competing)

1. NavBar Create button  
2. Hero primary/secondary CTAs  
3. Left rail guest “Share” CTA  
4. Mobile bottom / guest gates  

### Spec placement

| Priority | Placement | Role |
| --- | --- | --- |
| **P0** | Workspace command bar — single dominant Create | Always visible, never truncated unreadably |
| **P1** | Empty-feed / zero-result stage action | Contextual |
| **P2** | Left rail “Compose” only when authenticated productivity mode | Secondary |
| **Remove from competition** | Hero should not fight Nav for Create once Workspace shell exists | Hero becomes orientation, not second app entry |

Unacceptable today: any state where the primary CTA is partially unreadable or visually equal to Messages/HCP.

---

# SECTION 5 — Hero

### Current (architecturally incorrect for Workspace)

```text
[ NavBar — full bleed ]
[ Hero — max-w 720px, centered ]   ← only “feed column” width
[ Workspace grid: start | primary | end ]
```

Code: `HomePageClient` wraps `HomeHeroSection` in `max-w-3xl lg:max-w-[720px] mx-auto` when layout is visible.

### Option A — Hero only over feed

- Pros: keeps rails “pure tools”
- Cons: **breaks unity**; hero floats as a marketing island; rails feel bolted on

### Option B — Hero spans entire Workspace (**correct**)

- Pros: one application introduction; visually binds start · primary · end; matches Notion/Linear “top of workspace” feeling
- Cons: must become **compact Workspace chrome**, not a tall marketing billboard

### Decision

**Hero must span the full Workspace width** (edge to edge of the AW grid / full-bleed shell), and must be redesigned as:

- Short Workspace orientation strip (1 line purpose + optional place)
- Optional compact Create affordance only if command bar is incomplete
- **Not** a multi-paragraph landing section with 8 emoji chips + platform strip + dual large CTAs

Marketing depth moves to `/wat-is-homecheff` or first-run overlay — not every session’s first viewport.

---

# SECTION 6 — Vertical space

### Approximate first-viewport stack (desktop ON)

1. NavBar (~64px)  
2. Hero (compact mobile ~7.5–10rem; desktop hero much taller with chips + CTAs + strip)  
3. Mobile-only: UserActionCenter + Ecosystem strip  
4. Inside primary: filter/intent/geo/sort controls  
5. **Then** first listing  

### Diagnosis

Too much scrolling (or cognitive scrolling) before the product. Behaves like a **marketing page**, not a **Workspace**.

### Target

| Mode | Time-to-first-listing (intent) |
| --- | --- |
| Returning user desktop | **Immediate** — listings in first viewport |
| New guest desktop | Orientation ≤ **1 short strip**; listings still in first viewport |
| Mobile portrait | Compact hero ≤ ~72–96px; filters collapsible; listings ASAP |

**Cut ruthlessly:** hero height, default-open filter panels, duplicate CTAs, ecosystem strips above fold.

---

# SECTION 7 — Search experience

### Overlapping concepts today

| Concept | User question it answers |
| --- | --- |
| “Ik zoek” / “Ik bied” | Direction of intent |
| Accepted values | What trade/payment forms matter |
| Category / vertical chips | What kind of thing |
| Location + radius | Where |
| Search text | Free text |
| Sort | Ordering |

These **compete as peers** instead of nesting.

### Required mental model

Always answer: **What am I searching?**

Recommended hierarchy:

1. **Object** — Listings (default) | People/Creators | Requests | Offers | Businesses *(phase later)*  
2. **Direction** — Looking for · Offering *(secondary segment)*  
3. **Constraints** — Place · Radius · Category · Accepted values · Query  
4. **Order** — Sort  

Accepted values are a **constraint facet**, not a parallel “mode” equal to the whole feed.

UI principle: one primary question visible; advanced facets progressive.

---

# SECTION 8 — Sidebars / rails

### Current

Permanent **slots** exist (architecture ✅).  
Permanent **identity** does not (UX ❌). Content is finite cards; scroll ends; modules feel like website widgets.

### Spec

| Layer | Behavior |
| --- | --- |
| **Permanent rails** | Always present in work modes that resolve rails; same visual frame (background, border, width rhythm) whether empty or full |
| **Contextual modules** | Swap *inside* the rail; never unmount the rail chrome |
| **Persistent identity** | Mini brand/place/user context at rail top that does not “end” |
| **End of content** | Soft continuation (ambient empty state / “listening for context”), not blank dead space |

Left rail bias: **navigation + filters (tools)**.  
Right rail bias: **context + relationships + activity (awareness)**.

---

# SECTION 9 — Scroll experience

### Current feeling

`sidebar → ends → page → feed` (and independent overflow per column).

### Desired feeling

**Workspace continues forever. Only modules change.**

### Spec principles

1. Rails never visually “finish the product.”  
2. Primary stage owns infinite content (GeoFeed already does technically).  
3. Avoid teaching document-page scroll for the whole home when in desktop work mode — the **stage** scrolls; the **shell** stays.  
4. Mobile portrait may keep document scroll, but still minimize pre-feed chrome.

---

# SECTION 10 — Contextual panels

### Current: static cards

Reputation, community FAQ, promotions, growth tasks, marketplace link lists — mostly **plan/session static**, not selection-aware.

### Spec evolution (still presentation-only; GeoFeed owns data)

Rails should react to:

| Context | Example modules |
| --- | --- |
| Selected category / chip | Related creators, tips for that vertical |
| Active listing hover/focus | Safe preview actions (no ownership steal) |
| Saved searches | Resume chips |
| Place/radius | Friends nearby, popular nearby |
| Auth session | Messages peek, notifications peek |
| Empty/sparse feed | Compose / widen radius / change intent |

**Rule:** context changes modules; it does **not** create a second feed owner.

---

# SECTION 11 — Responsive experience

| Mode | Desired | Current gap |
| --- | --- | --- |
| **Portrait** | Browsing mode — feed-first, chrome minimal | Still marketing-first; strips + hero |
| **Landscape** | Work mode — distinct from “wide portrait” | Often same components stretched; not a true work posture |
| **Desktop** | Productivity mode — rails + command bar + stage | Rails present; productivity IA incomplete |
| **Ultra-wide** | Dual rails + readable feed cap | Width used; content quality/density not yet “pro tool” |

Architecture already distinguishes modes (`mobile-portrait`, `tablet-landscape`, `desktop`, `desktop-wide`). **UI content strategy does not yet honor those modes.**

---

# SECTION 12 — AvailableSpace failures

AvailableSpace correctly grows usable width (~2528px QHD) and caps feed (~720px). UX fails to exploit it:

1. Hero ignores full workspace width.  
2. Rails get space but fill with sparse stacked cards (large unused vertical and visual weight imbalance).  
3. Nav does not gain a denser command structure on wide screens.  
4. Extra horizontal space becomes margin/void rather than contextual density.  
5. No “stage toolbar” docked to the feed column for filters — filters either bloat primary or hide in left rail inconsistently by mode.

---

# SECTION 13 — Feed priority

**The feed is the product. Everything else supports it.**

| Metric | Current | Target |
| --- | --- | --- |
| First listing in first viewport (desktop returning) | Often no | **Yes** |
| Marketing before feed | Yes | No (or ≤ one compact strip) |
| Default-open heavy filters | Yes (left rail) | Collapsed / summary chips |
| Duplicate Create above fold | Yes | One dominant |

---

# SECTION 14 — Interaction model

Workspace should adapt; user should not.

### Where the user is forced to adapt today

1. Learn which of 3 Creates is “the” Create.  
2. Scroll past marketing to reach inventory.  
3. Decode Ik zoek / Ik bied / accepted values / chips / geo as peers.  
4. Discover that left rail filters exist while primary also shows controls.  
5. Treat landscape as “more width” rather than a new posture.  
6. Re-find context after rail content ends.  
7. Switch mental model between website pages (Werken-bij, FAQ) and feed tool without shell continuity.

---

# SECTION 15 — Design consistency

| Token area | Observation | Workspace direction |
| --- | --- | --- |
| Typography | Marketing display in hero + UI sans in tools | Shell uses tool typography; marketing type only on marketing routes |
| Spacing | Generous landing gaps | Dense shell, generous stage |
| Cards | `hc-dorpsplein-card` everywhere | Rails = panels; cards only for interactive units |
| Elevation/shadows | Hero + guest CTA shadows | Flatten shell; elevate only active stage/modals |
| Corners | Large rounded-2xl marketing | Slightly tighter shell rhythm |
| Icons | Many equal lucide peers in nav | Hierarchy by size/weight/cluster |
| Motion | Hover translate on marketing CTAs | Shell transitions for panel swap, not sales bounce |
| Visual rhythm | Broken by hero island | Continuous top bar → rails → stage |

---

# SECTION 16 — Workspace Experience scores

Scale 1–10. Architecture score reflects frozen technical presentation quality, **not** UX.

| Dimension | Score | Note |
| --- | --- | --- |
| Architecture (presentation shell) | **9** | Stable mount, AvailableSpace, ownership intact |
| Workspace feeling | **3** | Still a website |
| Navigation | **3** | Website IA |
| Productivity | **4** | Rails help; chrome fights them |
| Clarity | **4** | Overlapping search concepts |
| Discoverability | **5** | Inventory exists; path muddy |
| Visual hierarchy | **3** | Peer competition |
| Interaction | **4** | User adapts |
| Responsive behaviour (technical) | **7** | Modes resolve |
| Landscape mode (UX) | **3** | Not true work mode |
| Desktop mode (UX) | **4** | Grid without app feeling |
| **Overall UX** | **3.5** | Architecture ahead of experience |

---

# SECTION 17 — Priority matrix (implementation waves)

## WX Phase 1 — Critical (Workspace feeling)

*Presentation-only. No GeoFeed ownership change. No Host ACTIVE.*

1. **Full-width Workspace hero/orientation strip** (replace center-capped marketing hero on home ON).  
2. **Time-to-first-listing** — collapse pre-feed chrome; feed in first viewport for returning desktop.  
3. **Single dominant Create** in command bar — always readable.  
4. **Nav regroup** — Work cluster vs Account cluster; demote marketing destinations.  
5. **Rail chrome persistence** — visual continuity even when modules are short.  
6. **Filter summary in stage** — advanced facets progressive; stop peer competition above fold.  
7. **Fix S1/S2** — stop hollow left-rail filters; stop stacking the fat filter card above listings in AW primary.  
8. **Fix S3** — restore right-rail growth/activity presentation under AW via a read-only surface-plan bridge (no ownership transfer).  
9. **Fix S5** — when start rail is hidden, keep a compact discovery summary on the stage.

## WX Phase 2 — Contextual intelligence

1. Context-aware right-rail modules (category, place, session).  
2. Search object hierarchy (what am I searching?).  
3. Landscape = work posture layouts (not stretched portrait).  
4. Saved searches / nearby / activity peeks in rails.  
5. Empty/sparse feed guidance without second request owner.

## WX Phase 3 — Polish

1. Motion for panel swap / mode change.  
2. Density & typography system for shell vs marketing.  
3. Ultra-wide productive density.  
4. Accessibility pass on command bar & facets.  
5. Guest vs auth shell variants without acquisition theater on every visit.

---

# SECTION 18 — Explicit non-goals (this report)

- Do **not** change GeoFeed request/cache/pagination/observer/scroll ownership.  
- Do **not** open Controlled Host ACTIVE.  
- Do **not** retire GeoFeed.  
- Do **not** implement UI in this phase.  
- Do **not** copy Notion/Figma/Linear/Slack visually — match the **feeling of one continuous workspace** only.

---

## One-sentence answer

**HomeCheff will feel like an Adaptive Workspace only when the marketing page chrome is demoted, the hero spans and introduces the full shell, Create and navigation become a command bar, discovery collapses into a clear “what am I searching?” model, rails become permanent contextual frames, and the feed occupies the first viewport as the product — all without touching GeoFeed or Host authority.**

---

## Next step

**WX Phase 1 implementation** should treat this document as the specification. Start with hero span + time-to-first-listing + Create/nav hierarchy; measure with viewport proofs already established in the AW freeze toolchain.
