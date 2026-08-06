# HomeCheff Notification & Live Order Reliability

**Branch:** `feature/notification-reliability`  
**Date:** 2026-08-06  
**Static validator:** `npx tsx scripts/validate-notification-reliability.ts` → `HOMECHEFF_NOTIFICATION_PIPELINE_STATIC_OK`

## Executive verdict

`HOMECHEFF_NOTIFICATION_SYSTEM_PARTIAL`

Production code gaps that blocked WhatsApp-level reliability were fixed on this branch (proposal FCM, route/actionUrl deep links, quiet-hours persistence, SW click routing, Android HIGH + lockscreen, in-app toasts). Real-device Android proof, Web FCM client registration (no Firebase Web SDK / VAPID client in repo), and durable FCM outbox remain open — therefore **not** `PRODUCTION_SUCCESS`.

## Architecture (post-fix)

```
Server event (order / chat / proposal / delivery)
  → NotificationService.send()
      → persist inbox (always when saveToDatabase; quiet hours no longer drop)
      → Pusher private-delivery-{userId} (suppressed in quiet hours unless urgent)
      → FCM per active PushToken (chat | order | proposal; suppressed in quiet hours)
          → Capacitor Android / FCM web token / iOS token
      → optional email / SMS by preference
Client open:
  → CommsRealtimeListener toast + sound + badge refresh
Client closed (native):
  → FCM system tray → tap → pathFromPushNotificationData → exact screen
Client closed (browser):
  → requires FCM web token + SW; SW now deep-links; **web token registration incomplete**
```

## Gaps remaining (honest)

| Gap | Impact |
|-----|--------|
| No `firebase` web client / VAPID subscribe path | Closed-tab browser push not production-complete |
| No durable FCM outbox / multi-retry queue | Single in-process retry only |
| No physical Android device proof in this run | Operator checklist required |
| iOS Capacitor project absent | iOS push not in scope of this tree |
| Battery / Doze exemption UX | Not guided in-app (OEM-specific) |

## Operator proof checklist

See `OPERATOR_CHECKLIST.md`.

## Files changed

- `lib/notifications/notification-service.ts`
- `lib/native/pushDeepLink.ts`
- `lib/native/safeRoute.ts`
- `public/sw.js`
- `components/communication/CommsRealtimeListener.tsx`
- `components/delivery/DeliveryNotificationListener.tsx`
- `android/.../MainActivity.java`
- `scripts/validate-notification-reliability.ts`
- `docs/audits/homecheff-notification-reliability/*`
