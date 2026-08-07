# Turnstile Configuration

| Item | Value |
|------|--------|
| Mode | Invisible + `appearance: interaction-only` |
| Client | `components/contact/ContactTurnstile.tsx` — `getToken()` on submit |
| Site key API | `GET /api/public/turnstile-config` |
| Verify | `https://challenges.cloudflare.com/turnstile/v0/siteverify` |
| Secret env | `TURNSTILE_SECRET_KEY` |
| Site key env | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` or `TURNSTILE_SITE_KEY` |

Reject reasons: `TURNSTILE_FAILED`, `TURNSTILE_MISSING`.
