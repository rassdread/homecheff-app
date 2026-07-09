# Phase 13H — Mobile Filter Scroll

**Status:** Complete  
**Date:** 2026-07-09

## Summary

Mobile homepage feed filters collapse to a compact sticky “Filters” bar on downward scroll and expand again at the top of the page. Tapping the collapsed bar opens the existing filter sheet with state preserved.

## Validation

```bash
npx tsx scripts/validate-mobile-filter-scroll-phase13h.ts
npm run lint
npm run build
```

## Success criteria

- [x] Filter no longer floats distractingly while scrolling
- [x] Tap collapsed affordance opens filter sheet
- [x] Top-of-page auto-expand
- [x] Active filter count visible when collapsed
- [x] No filter logic / API changes
