# Warnings

1. **P0 device proof missing** — PRODUCTION_SUCCESS not claimed.
2. **Web push inert until** `NEXT_PUBLIC_FIREBASE_*` + VAPID set on the deployment that serves the client bundle (rebuild required after adding env).
3. **Migration** `20260806_notification_push_outbox` must be applied (or rely on runtime `CREATE TABLE IF NOT EXISTS` — FK to User may need migrate for full constraints).
4. **Safari** Web Push support is OS/browser dependent; primary browsers are Chrome/Edge/Android Chrome.
5. **Android channel** `order_updates_v2` requires APK update for existing installs to pick up HIGH importance.
6. **Local `.env.local`** in this workspace had no Firebase web public keys at audit time.
