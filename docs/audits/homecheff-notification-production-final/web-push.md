# Web Push

## Stack

- `firebase` JS SDK (`getToken`, `onMessage`, `isSupported`)
- VAPID: `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- Dedicated SW: `/firebase-messaging-sw.js` (does **not** replace `/sw.js` caching)
- Config API: `GET /api/public/firebase-web-config`
- Registration: `WebPushRegistration` in Providers + **user gesture** button in Notification Settings (`enableBrowserPush`)
- Silent refresh only when `Notification.permission === 'granted'`
- Token POST `/api/push/register` with `platform: "web"`

## Behaviour

| State | Behaviour |
|-------|-----------|
| Permission default | No prompt until user clicks “Browser push inschakelen” |
| Tab visible | In-app toast (Pusher); FCM foreground suppresses OS duplicate |
| Tab background / closed | FCM SW shows notification |
| Click | Focus existing origin tab + navigate; else `openWindow` |
| Deep link | allowlisted routes only |

## Required env (deploy)

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_VAPID_KEY
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

Safari: Web Push only where Safari supports Push API + granted permission (macOS/iOS versions vary); Android Chrome / Chrome / Edge are primary targets.
