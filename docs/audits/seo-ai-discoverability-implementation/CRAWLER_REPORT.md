# Crawler Report

## robots.txt

- Allow `/`
- Disallow `/api/`, `/admin/`, `/settings/`, `/checkout/`, `/cart/`, messages, profile, dashboards, pitch, internal/debug/test, etc.
- Sitemap + host declared

## Machine routes

| Path | Content-Type | Status |
| --- | --- | --- |
| `/llms.txt` | text/plain | 200 |
| `/ai.txt` | text/plain | 200 |
| `/.well-known/security.txt` | text/plain | 200 |

## Soft status

Missing products call `notFound()` (HTTP 404) instead of soft 200 HTML.

## Sitemap

- Helper measurement: 139 URLs
- `/maaltijden/*` removed while activity-gated noindex is common
- Rebalance landings + machine briefs included
- craftish URL vocabulary now ahead of foodish (see validation-metrics.json)
