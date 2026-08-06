# Crawler Validation

## Pre-deploy local checks (code/static)

| Check | Result |
|-------|--------|
| Organization `@id` stable | `https://homecheff.eu/#organization` |
| Logo URL absolute in JSON-LD | `https://homecheff.eu/logo.png?v=hc8` |
| robots.txt blocks images | No `robots.txt` in repo — default allow assumed |
| X-Robots on logo paths | None configured |
| middleware CSP bypass for icons | `/favicon*`, `/icon-*`, `/icon.png`, `/apple-touch-icon.png` |
| vercel.json rewrite excludes icons | Yes |

## Post-deploy operator validation

```bash
curl -sI https://homecheff.eu/logo.png | head -5
curl -sI https://homecheff.eu/favicon.ico?v=hc8 | head -5
curl -sI https://homecheff.eu/og-brand.png | head -5
curl -s https://homecheff.eu/ | grep -E 'Organization|logo|favicon|og:image'
```

Expected: all logo asset URLs return **HTTP 200**, `Content-Type: image/png` or `image/x-icon`.

## AI / machine-readable entity consistency

| Source | HomeCheff | homecheff.eu | Logo ref | Arrias Beheer B.V. | Sergio Arrias |
|--------|-----------|--------------|----------|-------------------|---------------|
| Organization JSON-LD | ✓ | ✓ | `/logo.png` absolute | parentOrganization | founder |
| WebSite JSON-LD | ✓ | ✓ | via publisher | — | — |
| `llms.txt` | — | — | — | — | — |
| `ai.txt` | — | — | — | — | — |

**Note:** `llms.txt` and `ai.txt` do not exist in this repository. No image binaries embedded anywhere.

## Pass

Static configuration **PASS**. Live HTTP 200 verification requires production deploy.
