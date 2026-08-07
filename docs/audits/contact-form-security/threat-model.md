# Contact Form Security — Threat Model

## Asset

Public `POST /api/contact` → Resend emails to `support@homecheff.eu` + confirmation to submitter.

## Attack vectors (pre-hardening)

1. Unauthenticated open relay — unlimited spam email cost / inbox flood  
2. Confirmation spam to arbitrary addresses  
3. No captcha / honeypot / timing / rate limit  
4. HTML injection into support mail  
5. Disposable / random Gmail bot floods  
6. Shared-proxy IP abuse without CF-Connecting-IP awareness  

## Mitigations

| Vector | Control |
|--------|---------|
| Bots | Cloudflare Turnstile (invisible) + server verify |
| Autofill bots | Honeypot `company_website` |
| Instant POST | Timing &lt;500ms reject; &lt;2s score penalty |
| Flood | 5/hour/IP + 3/min burst, Retry-After |
| Gibberish | Spam score threshold |
| Disposable mail | Domain denylist (+ env extend) |
| HTML XSS in mail | `escapeHtml` |
| Observability | Structured logs + AuditLog + admin metrics |

## Residual risk

In-memory rate limits are best-effort on multi-instance serverless (still reduces volume). Prefer Cloudflare WAF rate rules as belt-and-suspenders.
