# Operator Proof Checklist — Notification Reliability

Run on a physical Android device with a production or staging build that includes this branch, Firebase configured (`FIREBASE_*` server env), and a logged-in test buyer + seller.

## A. Permissions & channels

1. Fresh install → grant `POST_NOTIFICATIONS` when prompted (Android 13+).
2. Settings → Apps → HomeCheff → Notifications: `Berichten` and `Bestellingen & bezorging` both enabled, sound on.
3. Confirm lock screen shows HomeCheff notifications (VISIBILITY_PUBLIC channels).

## B. App states (chat message from second device)

| State | Expected |
|-------|----------|
| App open, other conversation | In-app toast + sound + badge |
| App open, same conversation | No toast (suppressed) |
| App backgrounded | System tray notification + sound |
| App force-stopped | System tray notification |
| Phone locked | Lockscreen notification |
| After reboot | Send another chat; token still delivers (no re-login required if session persists) |

## C. Order events

Trigger each and confirm tray + tap opens correct screen (not homepage):

- [ ] New order → seller `/verkoper/orders?highlight=…`
- [ ] Payment success → buyer `/orders/{id}`
- [ ] Order cancelled / declined / refunded → order screen
- [ ] Ready for pickup / delivered → order screen
- [ ] Courier assigned / arrived / delivery completed → delivery or messages deep link

## D. Chat & proposals

- [ ] New message → `/messages/{conversationId}/`
- [ ] Proposal received / accepted / declined → conversation (FCM type `proposal`)
- [ ] Typing in chat → **no** push, **no** inbox row

## E. Tokens

- [ ] Logout → token deactivated (DELETE `/api/push/register`)
- [ ] Login again → new register
- [ ] Second device → both receive
- [ ] Uninstall / clear data → old token eventually deactivated on next failed FCM send

## F. Quiet hours

- [ ] Enable quiet hours → non-urgent: inbox saved, no FCM/Pusher
- [ ] Urgent order: still live-pushed

## G. Web (partial until Web FCM client ships)

- [ ] Tab open → toast via CommsRealtimeListener
- [ ] Permission only after user action (settings / beta gate)
- [ ] Closed tab: **expect fail** until Firebase Web messaging registration is configured

## Pass criteria for PRODUCTION_SUCCESS

All A–F pass on device + Web FCM client registered + durable retry/outbox or proven zero silent drop under load.
