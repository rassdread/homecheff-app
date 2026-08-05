# Google / Firebase Checklist

Package: `eu.homecheff.mobile` · Firebase project: `homecheff-cbb05`

1. Firebase → Android app → SHA-1/SHA-256 (debug, upload, **Play App Signing**)
2. Download `google-services.json` → `android/app/` (gitignored)
3. `node scripts/validate-google-services.mjs`
4. Capgo `webClientId` = Firebase **Web** client (ID-token audience), via:
   - `NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID` (preferred) or legacy `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
5. Server allowlist: same id in `GOOGLE_NATIVE_CLIENT_ID` (recommended) and/or public vars
6. NextAuth web OAuth remains `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (6156…) — separate
7. Consent screen published for public pilot
8. Redeploy Vercel after any NEXT_PUBLIC change; rebuild Android WebView assets
