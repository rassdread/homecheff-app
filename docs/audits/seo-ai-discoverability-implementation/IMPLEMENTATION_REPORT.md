# SEO + AI Discoverability Implementation Report

**Phase:** HomeCheff Phase 2 — SEO + AI Discoverability  
**Commit A:** `fce59d1642f43bea8c8fda8329b0391f7ed4947c`  
**Branch:** `seo/phase2-ai-discoverability-implementation`  
**Scope:** P0 + P1 from master audit — no Workspace / planner / UX architecture changes.

## Summary

Implemented crawler-visible JSON-LD, real `/llms.txt` + `/ai.txt` + `security.txt`, SSR homepage identity, robots disallows, sitemap hygiene (removed commonly-noindex city hubs), Open Graph defaults, entity strengthening (sameAs KvK + knowsAbout expansion), English `/en/what-is-homecheff`, and 14 non-food long-tail landings (NL+EN) including Uber Eats / TGTG / Airbnb Experiences alternatives.

## P0 delivered

1. `JsonLdScript` plain HTML script tags across root + SEO surfaces (no next/script queue)
2. `/llms.txt` text/plain AI briefing
3. `/ai.txt` text/plain agent brief
4. Homepage SSR identity via `ssrIdentity` props (orientation strip + hero)
5. `robots.ts` disallow list for app/API chrome
6. Soft-status: machine routes text/plain; missing products `notFound()` for HTTP 404

## P1 delivered

1. Content rebalance registry — garden, handmade, repairs, lessons, creative, help, Wanted, barter, circular, micro-entrepreneurship, competitor alts
2. Sitemap excludes `/maaltijden/*`; includes machine briefs + EN what-is
3. `app/opengraph-image.tsx` + twitter image + metadata wiring
4. Organization sameAs + knowsAbout expansion; platform SSOT neighbourhood marketplace identity
5. Social entity: KvK public search URL verified; LinkedIn/Instagram still pending
6. `/.well-known/security.txt`
7. English SEO: EN landings + `/en/what-is-homecheff` with dual hreflang

## Non-goals preserved

Adaptive Workspace, AvailableSpace, GeoFeed ownership, Controlled Host, planners, Create/Search/Trade UX layout unchanged except SSR copy fill for existing H1 surfaces.
