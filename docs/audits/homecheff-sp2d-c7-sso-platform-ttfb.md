# SP.2D-C7 — HomeCheff SSO platform / function TTFB

## Latency equation (pre-change authenticated HAR)

| Sample | HAR wall | Server-Timing | Platform overhead |
|--------|----------|---------------|-------------------|
| G3 | 1646 | 45 | **1601** |
| S3 | 1266 | 30 | **1236** |
| G3 | 1444 | 33 | **1411** |

Unauth controlled curl (pre-change): warm SSO TTFB ~130–250 ms; ST ≤1 ms → almost all wall is pre-handler.

## Chosen implementation (class B + C)

1. Slim Edge LEGAL-0: `homecheffSeoPageSlugs.ts` (~1.5KB) instead of page copy (~82KB)
2. Middleware: dynamic `next-auth/jwt`; `security-headers` without setInterval
3. Middleware SSO fast-path: `/auth/sso/*` after host canonicalize (keep host 307)
4. Route: dynamic `import(authorize)` so Prisma loads only on code issue

Keep-warm: **not implemented** (last resort; not needed to prove mechanism).

## Security impact

| Change | Impact |
|--------|--------|
| Host canonicalize | **Preserved** before SSO fast-path |
| LEGAL-0 skip on `/auth/sso/*` | Safe — `auth` already known; no entity catch-all |
| Dynamic getToken | Suspension mutations unchanged |
| Dynamic authorize | Same issue path; deferred init only |
