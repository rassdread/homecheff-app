# Phase 3F Wave 2 — Before / After

**Branch:** `performance/phase3f-first-paint`  
**Baseline:** Wave 1 @ `d19b107`

---

## Document & server bundle

| Metric | Wave 1 | Wave 2 | Δ |
|--------|--------|--------|---|
| Homepage HTML (local prod) | 146,275 B | **25,869 B** | **-82%** |
| Homepage server `page.js` | 206 KB | **35 KB** | **-83%** |
| TTFB (local) | ~289 ms | **~199 ms** | -90 ms |
| First Load JS shared | 637 KB | 637 KB | 0 |

---

## Browser (local Puppeteer, anonymous)

| Scenario | FCP | First tile |
|----------|-----|------------|
| Desktop cold | 732 ms | 2247 ms |
| Desktop warm | 528 ms | 2036 ms |
| Mobile cold | 460 ms | 1826 ms |

---

## vs pre-Wave 1 production

| Metric | Prod (pre-3F) | Wave 2 local |
|--------|---------------|--------------|
| HTML | ~4.25 MB | ~26 KB |
| First paint | ~2.5–4 s | **460–732 ms** |
| First tile | ~7 s | **1.8–2.25 s** |

---

## Invariants

- feedFetches = 1
- geoFeedMounts = 1
- No feed/API/cache/DB changes
