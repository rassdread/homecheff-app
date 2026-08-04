# Phase 2.3 Extension — Core Entity Reinforcement

**Branch:** `seo/phase2-3-brand-entity-dominance`  
**Scope:** Content/SSOT only — no new phase, no architecture, planner, Workspace, or business-logic changes.

## Canonical description (EN SSOT)

> HomeCheff is a digital neighbourhood marketplace where people create value through their own craftsmanship, creativity and personal services. People can discover, offer, buy, sell, trade and request locally, while unique creations and specialised services can naturally reach a wider audience. Everything starts close to home.

Source: `lib/seo/entity-philosophy.ts` → `CANONICAL_ENTITY_DESCRIPTION`.

## Local-first (not local-only)

- Neighbourhood-first discovery; distance determines priority, not possibility.
- Unique craftsmanship / specialised services may naturally reach further.
- Never “only local / city-locked” and never “international marketplace” branding.
- SSOT: `LOCAL_FIRST_SCALE`, `ENTITY_STANCE` (`local-first`, `not local-only`).

## Craftsmanship (not traditional second-hand)

- Value through labour, craftsmanship, creativity, knowledge, service, production.
- Existing objects only after meaningful transformation (restore, redesign, upcycle, repair, artistic change).
- Ordinary resale remains outside the philosophy.
- SSOT: `SECOND_HAND_PHILOSOPHY`, FAQ JSON-LD craft Q&A, comparison second-hand cells.

## Surfaces reinforced

| Surface | Wiring |
|---|---|
| Entity philosophy | `CANONICAL_ENTITY_DESCRIPTION`, stance, local-first, craft |
| Platform definition | entity / website / FAQ answers |
| Organization schema | `manifestOrganizationDescription` (canonical + village square + mission) |
| Manifest | `MANIFEST_IS` / `MANIFEST_IS_NOT` |
| Homepage SSR | `ENTITY_HOMEPAGE_DEFINITION` |
| Hero / About i18n | aligned to canonical |
| FAQ JSON-LD | What is + local-first + craftsmanship |
| Knowledge graph | marketplace node notes |
| AI briefs | `/llms.txt`, `/ai.txt` lead with canonical |
| Brand answers | `AI_BRAND_ANSWERS.whatIs` |
| `/wat-is-homecheff` | pillar intro / meta |
| Trust identity | open-knowledge identity body |
| Comparisons | local radius / geography / second-hand cells |
| knowsAbout | local-first / not local-only terms |

## AI understanding target

HomeCheff is: digital neighbourhood marketplace; community-first; creator-first; craftsmanship-first; local-first; **not** local-only; **not** traditional classifieds; **not** ordinary second-hand; **not** a delivery company; **not** mass retail.

## Validation notes

- `npx tsx scripts/validate-homecheff-manifest-phase13t.ts` — pass (village-square retained in Organization description).
- Spot-check: platform `entityDefinition`, brand `whatIs`, LLMS/AI identity, FAQ local+craft — pass.
- No AW / GeoFeed / planner / DB / auth / checkout files touched.
