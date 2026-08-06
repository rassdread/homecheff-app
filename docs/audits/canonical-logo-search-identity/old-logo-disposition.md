# Old Logo Disposition

## Replaced in place (same URLs, new bytes)

These URLs remain stable for cache compatibility; content updated:

| URL | Old art | New art |
|-----|---------|---------|
| `/logo.png` | 367×516 legacy mascot | 886×886 approved Globeman |
| `/icon-192.png` | Old square icon | Approved resize |
| `/icon.png` | Old small icon | Approved resize |
| `/favicon.ico` | Old ICO | New multi-size ICO |
| `/apple-touch-icon.png` | Old | New |
| `/homecheff-globeman.png` | Old hero | Approved primary copy |

## Orphan — candidate for later deletion

| Path | Status |
|------|--------|
| `public/Tag 1976_Masscott_L05a-R04b kopie.png` | No code refs; publicly reachable legacy source |

**Not deleted in this PR** — prove unused first; may remain cached externally if ever linked.

## External cache expectations

| Consumer | Expected lag |
|----------|--------------|
| Google Search favicon | Days to weeks |
| Google Organization logo | After recrawl of homepage JSON-LD |
| Facebook/LinkedIn link preview | Until OG scraper refresh |
| CDN/browser `?v=hc8` | Immediate on deploy |

## Redirects

None required — canonical paths unchanged; version query busts Safari/CDN for favicon links.

## Broken references fixed

| Old ref | Fix |
|---------|-----|
| `/icon-192x192.png` in `sw.js` | → `/icon-192.png` |
| `/badge-72x72.png` in `sw.js` | → `/favicon-48.png` |
