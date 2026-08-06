# Operator Checklist — Web Firebase Config (blocking)

Closed-tab browser push will not work until these are set on Vercel **Production** (and Preview), then **redeployed** so Next inlines `NEXT_PUBLIC_*`.

## Firebase Console steps

1. Open Firebase project matching production `FIREBASE_PROJECT_ID`.
2. Project settings → Your apps → Add web app (or open existing web app).
3. Copy: `apiKey`, `authDomain`, `projectId`, `messagingSenderId`, `appId`.
4. Project settings → Cloud Messaging → Web Push certificates → Generate key pair.
5. Copy the **public** key → `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
6. Private key stays in Firebase Console (do not put in app env).

## Vercel env to add

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

Then: redeploy production. Settings → Browser push inschakelen → closed-tab test.

## E2E matrix (after web env)

See `operator-checklist.md` for Android + order/chat/delivery/payment/proposal/refund.
