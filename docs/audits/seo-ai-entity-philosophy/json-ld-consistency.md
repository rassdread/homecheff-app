# JSON-LD consistency

**No schema type or JsonLdScript architecture changes.**

| Schema | Field | Content source | Philosophy |
|--------|-------|----------------|------------|
| Organization | `description` | `manifestOrganizationDescription` | Buurtmarkt + dorpsplein + mission; **dorpsplein retained** for Phase 13T validator |
| Organization | `knowsAbout` | `ORGANIZATION_KNOWS_ABOUT` | Added community/creator/craft/local-first/upcycling |
| Organization | `alternateName` | `ORGANIZATION_ALTERNATE_NAMES` | Added digitale buurtmarkt / digital neighbourhood marketplace |
| WebSite | `description` | `platform.websiteDescription` | Entity + both mantras |
| FAQ | What is HomeCheff? | `platform.faqWhatIsHomeCheff` | Full ENTITY_FAQ_WHAT |

Validator: `scripts/validate-homecheff-manifest-phase13t.ts` → **63 passed, 0 failed** (post-change).
