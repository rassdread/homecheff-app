# Adaptive Workspace — Post-Deployment Checklist

Manual checklist. **Do not mark items complete as if deployment already occurred.**

Status: `CHECKLIST_PREPARED_NOT_EXECUTED`

## Identity

- [ ] Deployed commit equals AW-R6 freeze `be42e9fd73f9dbf09d64dbbb3ccc6eb5e5413170`
- [ ] Production environment confirmed
- [ ] Production URL recorded
- [ ] Deployment identifier recorded
- [ ] Deployment timestamp recorded

## Contract

- [ ] Feed ON=true
- [ ] Production promotion=true
- [ ] Workspace authority active/sole
- [ ] Legacy authority inactive
- [ ] One GeoFeed instance
- [ ] Mount/render/unmount = 1/1/0

## Continuity

- [ ] No duplicate requests
- [ ] No duplicate pagination
- [ ] No duplicate observers
- [ ] No duplicate cache writes
- [ ] Filters function
- [ ] Pagination functions
- [ ] Scroll continuity intact
- [ ] Loading status intact
- [ ] Skeleton behavior intact
- [ ] Tiles intact
- [ ] Soft navigation OK
- [ ] Hard reload OK

## Access / viewport

- [ ] Authenticated flow OK
- [ ] Unauthenticated flow OK
- [ ] Mobile viewport OK
- [ ] Desktop viewport OK
- [ ] Landscape Adaptive Workspace behavior OK where applicable

## Operations

- [ ] Monitoring OK
- [ ] Logs OK
- [ ] Error rate acceptable
- [ ] Rollback readiness confirmed (AW-R5)
