# Phase 3D — Trust Snapshot Cache

**Datum:** 2026-07-12  
**Branch:** `performance/phase2-baseline`

---

## 1. Probleem

Preview (3C): trust enrichment **~1097 ms** gemiddeld voor ~4 verkopers per feed page.  
Dominant: batch `groupBy`/`findMany` in [lib/discovery/trust/fetch-seller-trust-snapshots.ts](lib/discovery/trust/fetch-seller-trust-snapshots.ts).

---

## 2. Alternatieven

| Optie | Beschrijving | Besluit |
|-------|--------------|---------|
| **A. Request-local dedup** | Bestond al binnen één fetch-batch | Onvoldoende voor herhaalde feed loads |
| **B. Module-level bounded TTL cache** | Per `sellerId`, in-process Map | **Gekozen** — kleinste veilige variant |
| **C. Database snapshot** | Materialized view / tabel | Te zwaar voor deze fase |
| **D. Redis** | Externe cache | Expliciet uitgesloten |

---

## 3. Implementatie (optie B)

Bestand: [lib/discovery/trust/trust-snapshot-cache.ts](lib/discovery/trust/trust-snapshot-cache.ts)

| Eis | Implementatie |
|-----|----------------|
| Key per sellerId | `{version}:{mode}:{userId}` |
| Contractversie in key | `TRUST_SNAPSHOT_CACHE_VERSION = '1'` |
| TTL | **60 s** (binnen 30–120 s band) |
| Geen private/cross-user data | Publieke seller trust snapshots alleen |
| Max entries | **200**, LRU-achtige eviction (oudste key) |
| Geen permanente groei | `pruneExpired` + `evictIfNeeded` |
| Cache miss | Door naar `fetchSellerTrustSnapshotsWithReport` |
| Cache fout blokkeert feed niet | Fout in batch-enrichment → empty snapshots |
| Stale risico | 60 s TTL; nieuwe review/deal zichtbaar binnen TTL |
| Serverless | Best-effort per instance; geen cross-instance |

Integratie:

- [lib/discovery/trust/batch-enrichment.ts](lib/discovery/trust/batch-enrichment.ts) — `useCache` default `true`
- [lib/feed/trust-enrichment-timing.ts](lib/feed/trust-enrichment-timing.ts) — `cacheStats` in `trustTiming` → `debug.perf`

---

## 4. Lokale metingen (4 sellers, minimal mode)

| Run | Wall-clock | cacheStats |
|-----|------------|------------|
| Cold (miss) | **504 ms** | hits: 0, misses: 4, size: 4 |
| Warm (hit) | **0 ms** | hits: 4, misses: 4 (cumulatief), size: 4 |

Equivalencetest: cached vs uncached tile fingerprints **identiek** (validator).

---

## 5. Preview verwachting

| Scenario | Verwacht trust ms |
|----------|-------------------|
| Cold cache (eerste instance) | ~1000–1100 ms (ongewijzigd) |
| Warm cache (TTL 60s, zelfde sellers) | **< 50 ms** |
| Doel p50 na warm traffic | **600–700 ms** → haalbaar met cache hits op populaire sellers |

---

## 6. Stale / trust-correctheid

- **Geen** foutieve badges: snapshots zijn immutable gedurende TTL; badges komen uit aparte `fetchAuthorBadgeSummariesByUserIds` (niet gecachet in snapshot cache).
- **Tier/sellerTier** afgeleid uit snapshot counts — max 60 s vertraging acceptabel voor feed tiles.
- Bij nieuwe review/deal: TTL expiry of instance recycle op Vercel.

---

## 7. Observability

`debug.perf.trustTiming.cacheStats`:

```json
{
  "version": "1",
  "ttlMs": 60000,
  "maxEntries": 200,
  "hits": 4,
  "misses": 4,
  "evictions": 0,
  "size": 4,
  "missSellerCount": 0
}
```

---

## 8. Risico's

| Risico | Ernst | Mitigatie |
|--------|-------|-----------|
| Per-instance cache cold | Laag | Best-effort; herhaalde requests warmen |
| Stale trust 60s | Laag | Acceptabel feed UX; geen payment path |
| Memory op edge | Laag | Max 200 entries, bounded |
