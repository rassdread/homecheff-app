# Notification Architecture

```
Domain event (order / chat / proposal / delivery / payment / refund)
  → NotificationService.send()
      → inbox Notification row (persist; quiet hours never drop)
      → Pusher private-delivery-{userId} (live; quiet-hours suppressed unless urgent)
      → enqueue NotificationPushOutbox (one row per active FCM token)
      → processDuePushOutbox() best-effort drain
      → Vercel cron /api/cron/notification-outbox (* * * * *) durable drain
          → Firebase Admin messaging.send
          → Android / iOS / Web FCM token

Browser (closed tab):
  Firebase Web getToken (VAPID) → PushToken platform=web
  → firebase-messaging-sw.js onBackgroundMessage + notificationclick

Browser (open tab):
  Pusher → CommsRealtimeListener toast/sound/badge
  Foreground FCM onMessage → no OS duplicate when document.visible

Native Android:
  Capacitor PushNotifications → FCM → channels chat_messages / order_updates_v2
  → pathFromPushNotificationData → exact screen
```

Typing uses only Pusher `user-typing` and never enters NotificationService / outbox / FCM.
