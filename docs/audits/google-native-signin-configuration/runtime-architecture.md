# Runtime Architecture

| Surface | Runtime | Google path |
|---------|---------|-------------|
| Desktop / mobile browser | Next.js | NextAuth GoogleProvider (`GOOGLE_CLIENT_*`) |
| PWA | Browser | Same as web OAuth |
| Android app | Capacitor WebView + `androidBridge` / Capgo | Capgo SocialLogin → idToken → `POST /api/auth/native/google` |
| iOS app | **Not present** in repo as a shipped Cap target for this phase | N/A |

## Key files

- Button / flow: `components/auth/NativeGoogleSignInButton.tsx`
- UI mode: `lib/native/useGoogleLoginUiMode.ts`, `useGoogleLoginUiResolved.ts`, `subscribeNativeShell.ts`
- Capgo client id: `lib/native/google-sign-in-config.ts` → `resolvePublicNativeGoogleClientId()`
- Capgo init: `lib/native/prewarm-google-social-login.ts`
- Token verify + session cookie: `lib/auth/native-google-session.ts`, `app/api/auth/native/google/route.ts`
- Audiences: `lib/auth/google-oauth-clients.ts`
- Fallback: `lib/native/open-system-browser-google-oauth.ts`
