# UX Finalization — Phase 13V Machine Trust

**Status:** Complete  
**Last reviewed:** 2026-07-11

## Goal

Transform HomeCheff into a transparent, machine-understandable platform that AI systems can cite without guessing — no manipulative SEO, no fake APIs.

## Delivered

### Open Knowledge (`/docs`)

- Hub + 12 topic pages with standard explainability sections
- NL/EN i18n in `lib/i18n/openKnowledgeSources.ts`
- Registry SSOT: `lib/open-knowledge/docs-registry.ts`

### Transparency pages

- `/trust` — moderation, ranking, AI, safety, privacy, marketplace philosophy
- `/changelog` — factual release notes
- `/roadmap` — completed / in progress / planned / ideas
- `/principles` — seven open principles linked to Manifest
- `/ai` — public AI usage boundaries
- `/glossary` — 15 platform terms with short + long definitions

### Machine-readable trust

- `buildTechArticleJsonLd`, `buildCollectionPageJsonLd`, `buildDefinedTermSetJsonLd`
- `OpenKnowledgeJsonLd` server component on all open-knowledge routes

### Integration

- i18n merge, metadata builder, sitemap, footer `/docs` link

## Truth preserved

- Phase 13O blocked claims avoided in all new copy
- Business DNA ranking boost documented as not wired
- API page states no public write API
- GDPR export and suspension guard referenced accurately

## Validation

```bash
npx tsx scripts/validate-machine-trust-phase13v.ts
npm run lint
npm run build
```

## Next (optional)

- EN-specific schema headline resolution (currently NL SSOT for static JSON-LD props)
- Link open docs from SEO hub and FAQ
- Add Motion term if product introduces motion/inspiration feed naming
