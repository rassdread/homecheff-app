# Security Review

- **Auth:** public form remains anonymous (no login required)  
- **Gates order:** honeypot → rate limit → timing → fields → email → Turnstile → spam score → Resend  
- **Fail closed:** Production without `TURNSTILE_SECRET_KEY` rejects  
- **Fail open (dev):** missing secret outside production allows local testing  
- **PII in logs:** only IP/UA SHA-256 prefixes + reason codes  
- **Admin metrics:** `GET /api/admin/contact-security-metrics` (`canViewAuditLogs`)
