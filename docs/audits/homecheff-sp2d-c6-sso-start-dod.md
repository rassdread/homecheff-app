# SP.2D-C6 — DoD / ship record

**DoD: COMPLETE** (app-logic target met; wall-clock still platform-dominated)

## Changes

| Before | After |
|--------|-------|
| `auth()` → session callback marketplace hydrate (DeliveryProfile, affiliate, roles, …) | JWT `getToken` → `id` only |
| User select: claim fields (name/image/emailVerified/…) | Authorize select: id/email/deleted/suspended |
| `await writeSsoAudit` on success | `void writeSsoAudit` (non-blocking) |
| No Server-Timing | `parse/session/user/code/persist/total` |

## Production

| Field | Value |
|-------|-------|
| PR | https://github.com/rassdread/homecheff-app/pull/65 |
| Feature SHA | `deb3938a` |
| Merge SHA | `f32ef5dc` |
| Deployment | `dpl_GvmBup4gdxZdaurGeRpHwrzUurHx` |
| Alias | homecheff.eu |

## Server-Timing (authenticated silent; from HAR)

| Sample | wall (HAR) | ST total | session | user | persist |
|--------|------------|----------|---------|------|---------|
| G3 last | 1646 ms | **45 ms** | 10 | 15 | 18 |
| S3 last | 1266 ms | **30 ms** | 1 | 12 | 17 |
| G3 extra | 1444 ms | **33 ms** | 1 | 13 | 18 |

App path consistently **~30–45 ms**. Wall **0.6–1.6 s** is outside handler (Vercel TTFB / cold start / routing).

## Wall HC start samples (post-C6)

G3 n=3+1: 664, 1345, 1646, 1444 → best 664 · p50 ~1345 · worst 1646  
S3 n=2: 1109, 1266

C5 post-deploy wall was ~1.9–3.2 s — best cases improved; multi-second spikes reduced but not eliminated.

## G3/S3 usable (not solely HC-attributed)

| | session p50-ish | shell | usable |
|--|-----------------|-------|--------|
| G3 after | 2474–4201 | 3143–5659 | 3599–8117 |
| S3 after | 2341–2832 | 2511–3020 | 3537–4741 |

## Security

No Growth/Studio contract change. PKCE/state/redirect/active-check/code persist preserved.
