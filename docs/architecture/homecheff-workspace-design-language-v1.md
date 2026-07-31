# HomeCheff Workspace Design Language (WDL)
## Version 1.0 — The Constitution of the Adaptive Workspace

**Document class:** Permanent design constitution  
**Status:** Binding for all future Adaptive Workspace UI  
**Not:** An implementation · Not a component redesign · Not a migration plan  

**Authority relationship**

| Layer | Document | Governs |
| --- | --- | --- |
| Runtime / data ownership | `docs/architecture/homecheff-adaptive-workspace-presentation-only-authority.md` | GeoFeed vs Workspace vs Host |
| Presentation freeze | `adaptive-workspace-presentation-production-v1` | Shipped presentation shell |
| **Experience constitution** | **This document (WDL 1.0)** | How the Workspace must *feel* and decide |
| Experience gap audit | `docs/audits/wx-phase1-ux-architecture-alignment.md` | Where current UI violates WDL |

If implementation conflicts with this constitution, **the implementation is wrong**.

No future implementation may violate these principles without an **explicit architectural decision** recorded in writing (ADR or equivalent), stating which principle is waived, why, and the expiry or revisit condition.

---

## Mission

HomeCheff must no longer feel like a responsive website.

It must feel like **one continuous adaptive workspace**.

The user should never experience separate pages as the primary mental model.

The user should feel they are always working inside **one living environment**.

The interface should adapt to the user.

The user should never have to adapt to the interface.

### Intended description (success language)

Not: “A marketplace website.”

Yes: “A living adaptive workspace where discovering, creating, offering, requesting and growing all happen inside one continuous environment.”

---

## Constitutional scope

WDL governs:

- Homepage / discovery Workspace presentation  
- Rails, stage, orientation strip, command chrome  
- Responsive *behaviour* (not mere resize)  
- Hierarchy, density, progressive disclosure  
- Contextual modules and mental models for search/discovery  

WDL does **not** authorize:

- Transfer of GeoFeed request, cache, pagination, observer, or scroll ownership  
- Controlled Host `ACTIVE`  
- Retirement of GeoFeed  
- Second feed request owner  

Design may rearrange **presentation**. Runtime ownership remains as frozen unless a separate architecture decision changes it.

---

# PRINCIPLE 1 — Workspace first

The feed is the product.

Everything else exists to support the feed.

Never design around menus.  
Never design around marketing.  
Never design around forms.

Always design around the user’s current task.

**Ask:** What helps the user complete the current task?  
**Not:** What component belongs here?

---

# PRINCIPLE 2 — One continuous Workspace

The Workspace never ends.

There is no visual moment where the Workspace stops and a webpage begins.

The Workspace should feel continuous from top to footer.

Scrolling moves through the Workspace.  
It never exits it.

---

# PRINCIPLE 3 — Permanent rails

The left and right rails are structural elements.

They never disappear while the Workspace is active in a mode that resolves rails.

Only their contents change.

Modules are dynamic.  
Rails are permanent.

A user should always feel surrounded by their working environment.

**Clarification:** Mode resolution may hide a rail for AvailableSpace honesty (e.g. narrow widths). When a rail is hidden, the *Workspace shell* must still feel continuous, and discovery tools that lived in that rail must remain reachable on the stage (never leave a hollow affordance). Hollow permanent-looking panels violate Principle 15.

---

# PRINCIPLE 4 — Full-width orientation

The Hero is not marketing.

The Hero introduces the Workspace.

It spans the complete Workspace.

It visually connects:

- Left rail  
- Primary stage  
- Right rail  

into one application.

The Hero should never appear trapped inside the center column.

---

# PRINCIPLE 5 — The feed is immediately visible

Users come to HomeCheff to discover.

The first listing should appear within the first viewport on desktop.

Long stacks of filters above the feed are **prohibited**.

Marketing must never delay discovery.

---

# PRINCIPLE 6 — One primary action

Every screen has exactly one primary action.

Examples: Create Listing · Offer Service · Request Item · Share Meal.

This action must always be completely readable.  
It must never be truncated.  
It must visually dominate secondary actions.

---

# PRINCIPLE 7 — Progressive discovery

Do not ask users everything immediately.

The Workspace progressively reveals complexity.

| Level | Purpose |
| --- | --- |
| **1** | Discover |
| **2** | Refine |
| **3** | Advanced filtering |

Never expose expert functionality before basic discovery.

---

# PRINCIPLE 8 — Clear mental models

Users should never ask: “What does this search search?”

Every interaction has one purpose.

Separate clearly:

- Searching listings  
- Searching categories  
- Searching people  
- Searching services  
- Searching requests  
- Searching offers  
- Accepted trade values  
- Location  
- Sorting  
- Filtering  

These concepts must never compete as peers for the same attention band.

---

# PRINCIPLE 9 — Context over navigation

Navigation is secondary.  
Context is primary.

The Workspace should adapt based on:

- Current category  
- Selected listing  
- Location  
- Saved searches  
- Recent activity  
- Notifications  
- Relationships  
- Time  

The user should rarely need to navigate manually between “sites” to stay productive.

---

# PRINCIPLE 10 — Responsive modes

Responsive means changing **behaviour**.  
Not simply resizing.

| Mode | Intent |
| --- | --- |
| Desktop | Productivity mode |
| Tablet landscape | Workspace mode |
| Tablet portrait | Hybrid mode |
| Phone landscape | Quick work mode |
| Phone portrait | Discovery mode |

Each mode should feel intentionally designed.  
Not scaled.

---

# PRINCIPLE 11 — AvailableSpace

AvailableSpace is the primary layout driver.

Unused whitespace represents unused capability.

Every additional pixel of space should improve productivity.

Never simply enlarge margins.

---

# PRINCIPLE 12 — Visual hierarchy

Every screen answers immediately:

1. What am I doing?  
2. Where am I?  
3. What is most important?  
4. What should I do next?  

Only one element owns the user’s attention at any time.

---

# PRINCIPLE 13 — Rails are contextual

Rails are living assistants.

Their modules evolve.

Examples: recent activity · nearby creators · suggested trades · messages · growth · reviews · marketplace insights · recommendations · Workspace shortcuts · saved searches.

They respond to context.  
They never become empty decoration.

---

# PRINCIPLE 14 — Reduce vertical friction

Every unnecessary pixel above the feed delays discovery.

Challenge every component:

- Must this exist here?  
- Can this become contextual?  
- Can this become collapsible?  
- Can this move into a rail?  

---

# PRINCIPLE 15 — No dead space

Every visible area must provide value.

Prohibited as *stable* UX:

- Empty gutters that carry no stage purpose  
- Large unused margins as “layout”  
- Hollow panels  
- Static placeholders pretending to be tools  
- Oversized spacing that only mimics a brochure  

These represent wasted Workspace.

---

# PRINCIPLE 16 — Consistency

Typography · Spacing · Elevation · Corners · Animation · Icons · Buttons · Cards · Panels · Shadows · Density · Interaction  

must feel like **one system**.

Never like independently designed pages.

Brand language remains governed by `docs/brand/HOMECHEFF_BRAND_LANGUAGE.md`; WDL governs Workspace *behaviour and structure*. Where they conflict on the home Workspace surface, **WDL wins for structure**; brand wins for voice and meaning—reconcile deliberately, do not invent a third system.

---

# PRINCIPLE 17 — Design before components

Never begin implementation by moving components.

First define:

1. User goal  
2. Interaction  
3. Hierarchy  
4. Context  

Only then choose components.

---

# PRINCIPLE 18 — Workspace Experience Test

Every implementation must answer **YES** to every question:

1. Does this strengthen the Workspace?  
2. Does this reduce cognitive load?  
3. Does the feed remain the product?  
4. Does this improve productivity?  
5. Does this reduce scrolling friction to discovery?  
6. Does this preserve permanent rails (or honest mode-equivalent continuity)?  
7. Does it use AvailableSpace better?  
8. Does it simplify navigation?  
9. Does it create a more continuous Workspace?  

If any answer is **NO**, the implementation must be redesigned.

---

# PRINCIPLE 19 — The HomeCheff Test

Close all logos.  
Remove all colours.  
Remove all branding.

Would someone still recognise this as a HomeCheff Workspace?

If not, the design is not distinctive enough.

Distinctiveness must come from **structure and behaviour** (continuous shell, rails, stage, progressive discovery)—not decoration alone.

---

## Governance

### Compliance

- WX / UI proposals cite the WDL principles they satisfy.  
- PRs that change homepage Workspace presentation include a Principle 18 checklist.  
- Waivers require a dated architectural decision with owner and revisit date.

### Amendment

- WDL version increments (`1.1`, `2.0`) only via explicit design + architecture agreement.  
- Silent drift in implementation does not amend the constitution.

### Relationship to audits

The WX Phase 1 alignment audit documents **violations**. It does not replace WDL. Closing violations is how the product becomes constitutional—not the other way around.

---

## Success criteria

HomeCheff should no longer be described as a marketplace website.

It should naturally be described as a living adaptive workspace where discovering, creating, offering, requesting and growing all happen inside one continuous environment.

This document is the permanent constitutional design reference for every future Adaptive Workspace implementation.

**WDL 1.0 — ratified as design constitution.**
