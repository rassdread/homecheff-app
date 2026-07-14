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

## Browser (local prod @ `63f1845`, anonymous)

| Scenario | FCP | LCP | First tile | First image |
|----------|-----|-----|------------|-------------|
| Desktop cold | 580 ms | 580 ms | 2103 ms | — |
| Desktop warm | 572 ms | 572 ms | 1977 ms | 2341 ms |
| Mobile cold | 500 ms | 500 ms | 1589 ms | 2008 ms |

Preview URL (SSO): https://homecheff-5o7aspfvn-sergio-s-projects-f7b64ee1.vercel.app — handmatige browsercheck vereist.

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
