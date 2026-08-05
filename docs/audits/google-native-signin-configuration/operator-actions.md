# Operator Actions

1. In Vercel Production (+ Preview if native QA): set  
   `NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID` = Firebase Web client id used as Capgo `webClientId` (legacy `NEXT_PUBLIC_GOOGLE_CLIENT_ID` already present — keep as fallback).
2. Recommended server-only: `GOOGLE_NATIVE_CLIENT_ID` = same audience.
3. Do **not** put NextAuth `GOOGLE_CLIENT_ID` (6156…) into Capgo public vars.
4. Redeploy Production so Next.js rebuilds client bundle (required for NEXT_PUBLIC inlining).
5. Reload Capacitor WebView / ship new Android build pointing at Production.
6. Confirm Firebase SHA fingerprints including Play App Signing.
7. Device test: Google chooser → session → refresh → logout → second login.
8. Development: add `GOOGLE_CLIENT_ID` for local web OAuth; native public id only when device-testing.
