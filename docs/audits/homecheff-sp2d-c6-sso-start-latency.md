# SP.2D-C6 — HomeCheff `/auth/sso/start` authenticated silent latency

## Call graph (authenticated silent) — before

```
parse params + client/redirect allowlist     PURE COMPUTE / SECURITY
auth() = getServerSession                    SECURITY + DB READ (session callback)
  └─ findUserByCanonicalEmail + DeliveryProfile + affiliate + roles   DUPLICATE / ONLY FOR UI
issueSsoAuthorizationCode
  └─ validate state/PKCE/client              SECURITY / PURE COMPUTE
  └─ User.findUnique (full claim select)     SECURITY / DB READ
  └─ void deleteMany expired codes           DB WRITE (async)
  └─ SsoAuthorizationCode.create             SECURITY / DB WRITE
  └─ await SsoAuditEvent.create              DB WRITE (serial, non-security)
302 product callback
```

## After (C6)

```
parse params                                 SECURITY / PURE COMPUTE
getToken (JWT id only)                       SECURITY / PURE COMPUTE (no session DB)
issueSsoAuthorizationCode
  └─ validate state/PKCE/client              SECURITY
  └─ User.findUnique (id/email/deleted/suspended only)  SECURITY / DB READ
  └─ void deleteMany expired                 DB WRITE async
  └─ SsoAuthorizationCode.create             SECURITY / DB WRITE
  └─ void SsoAuditEvent.create               DB WRITE async (non-blocking)
302 + Server-Timing
```

## Classifications preserved

| Step | Class |
|------|-------|
| Client + redirect allowlist | SECURITY REQUIRED |
| JWT session presence | SECURITY REQUIRED |
| User active/deleted/suspended | SECURITY REQUIRED / DB READ |
| Code + PKCE bind + persist | SECURITY REQUIRED / DB WRITE |
| Audit | Observability (now non-blocking on success) |
| Session marketplace hydrate | REMOVED from silent start (was UI bootstrap) |

## Product access

No per-product entitlement on HC start (pre-existing). Products enforce post-exchange.
