# Required Operator Actions

1. **Google Cloud Console** — ensure authorised redirect URI:
   - `https://homecheff.eu/api/auth/callback/google`
2. **Optional:** remove obsolete www callback URI after confirming www→apex redirect is live.
3. **Vercel Development** — add `GOOGLE_CLIENT_ID` (mirror Production web client id). Secret already present.
4. **Preview Google Cloud** — for each long-lived Preview hostname used for OAuth QA, add matching redirect URI, **or** rely on `PREVIEW_AUTH_URL` + that host in Google Cloud.
5. **After merge/deploy (separate phase):** complete real Google login proof matrix (first-time, returning, email collision, Create return, refresh, logout).
6. **Do not commit** client secrets.
