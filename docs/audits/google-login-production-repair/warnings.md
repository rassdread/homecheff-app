# Remaining Warnings

1. Real Google OAuth end-to-end not proven on this feature branch (no deploy).
2. Development env missing `GOOGLE_CLIENT_ID` on Vercel.
3. Production still uses `Domain=.homecheff.eu` for session cookie (intentional Growth SSO) while PKCE/state are host-only — safe **after** www→apex; do not start OAuth on non-apex hosts.
4. Preview Google redirect URIs must be maintained in Google Cloud for each Preview host used for OAuth QA.
5. Email↔Google link by verified email is intentional; operators should understand soft-link policy.
