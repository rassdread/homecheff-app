# Token Validation

`createSessionFromNativeGoogleIdToken`:

- `google-auth-library` `verifyIdToken`
- Audience = `resolveNativeGoogleAudiences()` allowlist only (no web NextAuth client fallback)
- Requires email; rejects `email_verified === false`
- Uses Google `sub` for Account linking
- Accepts ID tokens only (body field `idToken`)
- Session JWT minted server-side with `NEXTAUTH_SECRET`; cookie name `next-auth.session-token`
