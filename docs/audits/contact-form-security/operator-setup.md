# Operator Setup — Contact Anti-Spam

## Environment (Vercel Production)

```
TURNSTILE_SECRET_KEY=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
# alias also supported server-side:
# TURNSTILE_SITE_KEY=...  (same as site key; public endpoint exposes it)

# Optional:
CONTACT_DISPOSABLE_DOMAINS=temp.example,spam.example
CONTACT_SPAM_DOMAINS=known-bad.example
```

## Cloudflare Turnstile

1. Create a widget (Invisible / Managed interaction-only).  
2. Add hostnames: `homecheff.eu`, `www.homecheff.eu`, localhost for test.  
3. Copy site key + secret into Vercel env.  
4. Redeploy.

## Verify

- Submit `/contact` as a human → success email  
- Bot-like POST without token → rejected, no support mail  
- `GET /api/admin/contact-security-metrics` as admin → counters  

## Local / Dev

Without keys, Turnstile verify is bypassed outside Production. Honeypot, timing, rate limit, and spam score still apply.
