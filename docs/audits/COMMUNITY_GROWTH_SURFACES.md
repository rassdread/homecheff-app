# Community Growth Surfaces

**Phase:** 3D audit  
**Last updated:** 2026-07-06  
**Goal:** How users discover partners, couriers, ambassadors, clubs, schools, municipalities, and local orgs **without spam**.

---

## Growth roles (taxonomy)

| Role | Discovery intent | Primary funnel |
|------|------------------|----------------|
| **Partner seller** | List products/services | Sell onboarding |
| **Courier** | Deliver locally | Delivery signup |
| **Ambassador** | Spread HomeCheff locally | Welkom / invite program |
| **Workshop host** | Teach in person | Create WORKSHOP |
| **Sports club** | Group buying / events | Institutional invite |
| **School** | Educational workshops | Municipality / school link |
| **Municipality** | Civic local food | B2G landing + admin |
| **Local org** | Community kitchen, food bank | Editorial + partner module |

---

## Anti-spam principles

1. **Intent over impression** — Show growth modules only when signals match (role, geo, lifecycle).  
2. **One growth story per session** — Single `OpportunityModule` slot on right sidebar.  
3. **Cooldowns** — 14d dismiss per growth category; 7d repeat for same copy variant.  
4. **No cold outreach UI** — No “invite all contacts”; QR and share sheet only.  
5. **Editorial for institutions** — Schools/municipalities via curated spotlight, not algorithmic blast.  
6. **Separate from sponsored** — Paid business promo ≠ partner recruitment.  
7. **Completion over clicks** — Measure funnel completion, not module CTR alone.

---

## Surface map by role

### Partners (sellers / businesses)

| Stage | Surface | Module |
|-------|---------|--------|
| Awareness | R `OpportunityModule` | “New business in your area” (social proof) |
| Consideration | AC | “Become a partner” / first listing |
| Conversion | PS | Seller onboarding checklist |
| Retention | PS, messages | Order milestones |

**Spam guard:** Hide if user already has seller profile or dismissed 2× in 30d.

### Couriers

| Stage | Surface | Module |
|-------|---------|--------|
| Awareness | R, FI | “Couriers needed nearby” (only if delivery gap signal) |
| Consideration | AC | `marketplace_activation` courier variant |
| Conversion | SH | Delivery signup flow |
| Retention | Role dashboard | Active courier — no recruit modules |

**Spam guard:** Max 1 courier module / 30d unless `deliveryDemandScore` in top quartile for radius.

### Ambassadors

| Stage | Surface | Module |
|-------|---------|--------|
| Awareness | R `PartnerModule` | Ambassador opportunity |
| Consideration | AC | Invite friend / QR share |
| Conversion | PS | Welkom stats, referral link |
| Retention | PS | Badge progression (trust, not HCP gate) |

**Spam guard:** No ambassador module if user &lt; 7d account or zero completed transactions (configurable).

### Clubs & schools

| Stage | Surface | Module |
|-------|---------|--------|
| Awareness | R editorial | “Invite your sports club” |
| Consideration | AC | Share club link + QR |
| Conversion | External / landing | Club onboarding page (future) |
| Institution | Editorial spotlight | School/municipality story — weekly max 1 region |

**Spam guard:** Institutional modules require user-selected interest tag OR neighbour cluster signal; never global push.

### Municipalities & local orgs

| Stage | Surface | Module |
|-------|---------|--------|
| Awareness | H seasonal | Civic partnership hero (admin) |
| Consideration | R `CommunityModule` | Spotlight story |
| Conversion | Dedicated landing | `/partner/gemeente` style — out of feed |
| Ongoing | FI rare | Event co-promotion (labeled platform, not sponsored seller) |

**Spam guard:** B2G content is **editorial tier** — max 1 per municipality per quarter in sidebar.

---

## Dynamic module catalog (right sidebar)

| Module ID | Copy theme | Eligibility signal | Cooldown |
|-----------|------------|-------------------|----------|
| `people_near_you` | Social proof | ≥3 active neighbours in radius | 7d |
| `become_partner` | Seller growth | No seller profile, viewed ≥5 listings | 14d |
| `workshop_nearby` | Event | WORKSHOP within 14d, 5km | Per event |
| `support_nearby` | Help | Open REQUEST, role match | 24h |
| `new_business_area` | Discovery | New seller in 7d, trust ≥ starter | 7d |
| `trending_challenge` | Community | Active challenge, not joined | 14d |
| `community_spotlight` | Editorial | Admin pick | 7d |
| `local_activation` | 3C library | Engine score + category cap | Per activation |
| `invite_business` | B2B growth | User is seller with ≥3 sales | 30d |
| `invite_sports_club` | Institutional | User tag sport OR workshop sport cat | 30d |

Rotation: highest **intent score** wins single `OpportunityModule` slot; ties broken by lowest recent impressions.

---

## Intent scoring (conceptual)

```
intentScore =
  w1 * geoRelevance +
  w2 * roleFit +
  w3 * lifecycleStage +
  w4 * supplyDemandGap -
  w5 * recentDismissals -
  w6 * sessionFatigue
```

**Not ranking** — scores only order growth modules within S5 tier; never affect `orderedListingIds`.

---

## Funnel metrics (non-spam KPIs)

| Metric | Healthy | Spam signal |
|--------|---------|-------------|
| Module dismiss rate | &lt;40% | &gt;60% same module |
| Completion / impression | &gt;5% | High clicks, zero completions |
| Repeat dismiss same category | &lt;2 / 30d | ≥3 → suppress category |
| Push opt-out after growth push | &lt;2% | &gt;10% |

---

## What we explicitly do not do

- Mass email / SMS invite from address book  
- “Invite 10 friends to unlock” dark patterns  
- Growth modules in organic section headers  
- Paid boost for ambassador or courier recruitment (≠ sponsored listing)  
- Municipality blast to all users in province  
- Challenge leaderboards in feed every session  

---

## Phase rollout

| Phase | Scope |
|-------|-------|
| 3D | Architecture (this doc) |
| 3E | `OpportunityModule` + intent scorer |
| 3F | Institutional landing pages |
| 4 | Push policy for time-bound workshops |

---

## References

- [ACTIVATION_TAXONOMY.md](../architecture/ACTIVATION_TAXONOMY.md)
- [../audits/VIRAL_ACTIVATION_CONCEPTS.md](./VIRAL_ACTIVATION_CONCEPTS.md)
- [SIDEBAR_ARCHITECTURE.md](../architecture/SIDEBAR_ARCHITECTURE.md)
