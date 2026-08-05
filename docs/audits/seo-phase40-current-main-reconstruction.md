# SEO Phase 4.0 — Current-main reconstruction evidence

**Authoritative tip before release:** `b5be35a9`  
**Historical branches:** reference only (Gate 1 BLOCKED) — not merged.

## Gates

| Gate | Status |
|---|---|
| 1 Current-main reconstruction | PASS — rebuilt on main; no blind SEO branch merge |
| 2 Technical SEO | PASS pending Production smoke after deploy |
| 3 Content/entity accuracy | PASS — SSOT from organization-identity + philosophy |
| 4 AI discoverability | PASS — real `text/plain` llms/ai routes |
| 5 Production safety | PASS — no payment/delivery/Workspace/schema changes |

## AI crawler policy

Allow `*`, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Google-Extended, PerplexityBot, Applebot-Extended with the same private-path disallows. Robots cannot guarantee training behaviour.

## Location pages

No mass generation. Existing curated SEO/city pages only. Radius/query URLs remain non-indexable chrome.

## Tests

```bash
npx tsx scripts/test-seo-ai-discoverability-phase40.ts
```
