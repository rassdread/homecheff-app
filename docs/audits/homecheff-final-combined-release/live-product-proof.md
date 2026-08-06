# Live Product Proof

Automated HTTP / HTML checks after Production alias update:

| Area | Result |
|------|--------|
| Feed API without forced location | `/api/feed?limit=5` → 200 |
| Homepage loads | 200, brand + Organization JSON-LD |
| Founder/origin knowledge pages | 200, not soft-404 |
| Manifest / Trust | 200 |
| Logo / favicon / og-brand | 200 |
| llms.txt / ai.txt | text/plain 200 |
| Redirects www/.nl | 307 → .eu |

## Not fully re-executed in this window

- Full Playwright Chromium/WebKit/Edge matrix (prior QA harness evidence exists on branch)
- Physical Android device GPS / native Google login / keyboard
- Authenticated Create / chat / checkout flows (manual operator)

These remain operator confirmation items; web crawler + suite gates passed.
