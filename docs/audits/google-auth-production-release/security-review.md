# Security review

## Web OAuth

- State + PKCE present on live sign-in start.
- Callback pinned to apex.
- www forced to apex before OAuth (prevents host-only PKCE split).
- Session cookie name SSOT shared with middleware.
- No client secret in `NEXT_PUBLIC_*`; no `GOCSPX-` in client bundle sample.

## Native token path (code)

- Server verifies Google ID token (signature/issuer/expiry/audience).
- `email_verified` required.
- Google `sub` as provider identity.
- No client-side session minting.
- Audience allowlist explicit/minimal in implementation.
- Optional `GOOGLE_NATIVE_CLIENT_ID` server allowlist not set (non-blocking; public native + web clients still constrain aud).

## Account linking

- Policy unchanged: no dangerous automatic linking / email takeover; consistent web vs native resolution paths reviewed in prior gate + retained in merge.

## Residual risk

Interactive takeover/duplicate proofs deferred to operator live tests + DB integrity pass.
