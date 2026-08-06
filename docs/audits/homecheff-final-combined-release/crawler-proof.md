# Crawler Proof (live Production after deploy)

Deployment: `dpl_7zMNTuNm4Yr6d9xpA1zBU55Ru3yJ` → https://homecheff.eu

| URL | Status | Notes |
|-----|--------|-------|
| `/logo.png` | 200 image/png | 394107 bytes (approved asset) |
| `/favicon.ico` | 200 | new ICO |
| `/og-brand.png` | 200 image/png | brand card |
| `/llms.txt` | 200 text/plain | HomeCheff + Sergio present |
| `/ai.txt` | 200 text/plain | HomeCheff + Sergio present |
| `/.well-known/security.txt` | 200 text/plain | |
| `/robots.txt` | 200 | |
| `/sitemap.xml` | 200 application/xml | |
| `/` | 200 | Organization JSON-LD; logo `...?v=hc8`; favicon hc8 |
| `/sergio-arrias` | 200 | real page (not soft-404) |
| `/oorsprong-homecheff` | 200 | real page |
| `/waarom-homecheff` | 200 | real page |
| `/arriassisme` | 200 | real page |
| `/manifest` | 200 | |
| `/trust` | 200 | |

Redirects: www.homecheff.eu / homecheff.nl / www.homecheff.nl → 307 → https://homecheff.eu/

Feed API: `/api/feed?limit=5` → 200

Full JSON: captured in release logs as `live-proof.json` (also summarized in brand-proof.md).
