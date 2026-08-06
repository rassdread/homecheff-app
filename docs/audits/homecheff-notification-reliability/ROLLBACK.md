# Rollback

1. Revert merge/commit of `feature/notification-reliability` on the deploy branch.
2. Redeploy previous production deployment (Vercel) if already promoted.
3. Android: ship previous APK; notification channels with raised importance keep user settings until app update recreates — users may need to clear channel or reinstall if sound/importance stuck (Android channel immutability caveat: channel id `order_updates` importance change may **not** apply until uninstall or channel id bump).

Safe rollback surface: server notification-service + SW + listeners. No Prisma schema changes in this release.
