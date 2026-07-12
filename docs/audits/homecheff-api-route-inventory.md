# HomeCheff API Route Inventory

**Datum:** 2026-07-12  
**Totaal:** 324 App Router routes (`app/api/**/route.ts`) · 0 Pages Router routes  
**Scope:** Read-only inventarisatie uit broncode.

---

## Classificatie-legenda

| Class | Betekenis |
|-------|-----------|
| **A** | Geschikt om op Vercel te blijven |
| **B** | Mogelijk naar Render (na meting) |
| **C** | Sterke Render-kandidaat (zware I/O, cron, uploads) |
| **D** | Niet verplaatsen zonder herontwerp (auth, webhooks, payments) |
| **E** | Eerst meten voordat besloten kan worden (hot path / user-facing read) |

### Classificatie-verdeling (heuristisch, uit code)

| Class | Aantal | % |
|-------|--------|---|
| A — Vercel | 56 | 17% |
| B — Mogelijk Render | 128 | 40% |
| C — Render-kandidaat | 21 | 6% |
| D — Niet verplaatsen | 19 | 6% |
| E — Eerst meten | 100 | 31% |

---

## Samenvatting per domein

| Domein | Routes | Class dominant | Kritieke routes |
|--------|--------|----------------|-----------------|
| Admin | 56 | A | `command-center`, `financial`, `analytics` |
| Auth | 19 | B/D | `[...nextauth]` (D), `native/google` |
| Feed & Home | 3 | E | **`/api/feed`** (kritiek) |
| Products & Inspiratie | 10 | E/B | `/api/inspiratie`, `/api/products` |
| Marketplace & Proposals | 18 | B/E | `exchange-suggestions` |
| Checkout & Orders | 12 | D | `checkout`, `orders`, Stripe |
| Stripe & Webhooks | 5 | D | `stripe/webhook`, `connect/webhook`, `ectaroship` |
| Chat & Conversations | 23 | E | `conversations`, `messages/*` |
| Delivery | 28 | E/C | `dashboard`, uploads |
| Seller | 28 | B | `dashboard/*`, payouts |
| Uploads & Media | 11 | C | `upload/*`, `video-*` |
| Profile & User | 32 | E | **`/api/profile/me`**, `/api/user/me` |
| Notifications & Push | 11 | E | `notifications`, `push/register` |
| Gamification | 5 | B | `home-carousel` (unstable_cache) |
| Cron | 4 | C | `send-notifications` (elke minuut) |
| Geocoding | 5 | E | `geocoding/global` |
| Overig | 59 | B | affiliate, analytics, workspace |

---

## Bijzondere routes (detail)

### Webhooks (Class D — nooit blind verplaatsen)

| Route | Auth | Extern |
|-------|------|--------|
| `POST /api/stripe/webhook` | Stripe signature | Stripe + EctaroShip labels |
| `POST /api/stripe/connect/webhook` | Connect signature | Stripe Connect |
| `POST /api/webhooks/ectaroship` | EctaroShip signature | Shipping status |

### Cron (Class C)

| Route | Schedule (vercel.json) | Auth in code |
|-------|------------------------|--------------|
| `/api/cron/send-notifications` | `* * * * *` | Geen CRON_SECRET in route |
| `/api/cron/schedule-shift-notifications` | `0 * * * *` | Geen CRON_SECRET in route |
| `/api/cron/cleanup-stock-reservations` | Niet in vercel.json | `Bearer CRON_SECRET` |
| `/api/cron/delivery-warnings` | Niet in vercel.json | `Bearer CRON_SECRET` |

### Runtime = nodejs (17 routes)

Uploads, video-proxy, pitch-pdf, auth native/session, review routes met streaming.

### maxDuration

| Route | Waarde |
|-------|--------|
| `vercel.json` default `app/api/**/*.ts` | 30s |
| `app/api/upload/route.ts` | 60s, 1024MB |
| Upload/video routes | 60s (route-level) |
| Review routes | 30s |

### Caching uitzonderingen

| Route | Cache |
|-------|-------|
| `/api/feed` | `s-maxage=45` alleen public default feed |
| `/api/inspiratie` | `revalidate` + Cache-Control |
| `/api/users` | `force-static`, `revalidate=3600` |
| `/api/gamification/home-carousel` | `unstable_cache` 120s |
| `/api/gamification/ranking-promo` | `unstable_cache` |

---

## Hot-path routes — migratie-risico

| Route | Class | Cold-start | Migratie-risico | Reden |
|-------|-------|------------|-----------------|-------|
| `/api/feed` | E | **Hoog** | **Hoog** | 25–40+ queries; homepage blocker; cookie/session |
| `/api/auth/[...nextauth]` | D | Middel | **Kritiek** | OAuth, cookies, Capacitor Google login |
| `/api/profile/me` | E | Hoog | Hoog | Bootstrap gate; dubbele fetch |
| `/api/user/me` | E | Hoog | Middel | Pusher user id |
| `/api/messages/unread-count` | E | Middel | Middel | Comms badge |
| `/api/pusher/auth` | D | Middel | **Kritiek** | Private channel auth |
| `/api/stripe/webhook` | D | Laag | **Kritiek** | Payment state machine |
| `/api/upload` | C | Middel | Middel | Blob + 60s timeout |

---

## Volledige route-tabel (324 routes)

| Route | Methods | Class | Dynamic | Runtime | Prisma | Gewicht | Cold-start |
| `/admin/admins` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/affiliates/[id]/status` | PUT | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/affiliates/attributions` | GET,POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/affiliates/commission-adjustment` | POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/affiliates/referral-link` | PUT | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/affiliates` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/alerts` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/all-users` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/analytics/ga4` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/analytics` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/analytics/unified` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/assign-role` | POST,DELETE | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/audit-log` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/beta-insights` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/business-subscriptions/[userId]` | GET,POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/clear-messages` | DELETE | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/command-center` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/delivery/[profileId]/block` | PATCH | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/delivery/[profileId]/status` | PATCH | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/delivery/orders/[orderId]/assign` | POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/disputes` | GET,POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/financial` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/hcp-carousel/[id]` | PATCH,DELETE | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/hcp-carousel` | GET,POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/messages/[conversationId]` | GET | A | default | default | Y | zwaar | middel |
| `/admin/messages` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/messages/stats` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/migrate-orders` | POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/moderation/logs` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/moderation/review` | POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/notifications/send` | POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/orders/[orderId]` | GET,PATCH,DELETE | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/orders/release-escrow` | POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/orders` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/payouts` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/permissions` | GET,PUT | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/preferences` | GET,PUT | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/products` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/promo-codes/[id]` | PATCH | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/promo-codes` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/refunds` | GET,POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/sellers` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/send-bulk-message` | POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/send-message` | POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/settings` | GET,PATCH | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/stripe-status` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/subscriptions` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/transactions` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/trust-queue` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/upgrade-to-superadmin` | POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/user-contact` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/users/[id]` | PATCH,DELETE | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/users/[id]/suspend` | POST,DELETE | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/users/bulk-delete` | POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/users` | GET,POST | A | force-dynamic | default | Y | zwaar | middel |
| `/admin/users/search` | GET | A | force-dynamic | default | Y | zwaar | middel |
| `/affiliate/create-sub` | POST | B | force-dynamic | default | Y | middel | middel |
| `/affiliate/dashboard` | GET | B | force-dynamic | default | Y | middel | middel |
| `/affiliate/delete-sub` | DELETE | B | force-dynamic | default | Y | middel | middel |
| `/affiliate/payouts/process` | POST | B | force-dynamic | default | Y | middel | middel |
| `/affiliate/payouts/update-status` | POST | B | force-dynamic | default | Y | middel | middel |
| `/affiliate/promo-codes/[id]` | GET,PUT,DELETE | B | force-dynamic | default | Y | middel | middel |
| `/affiliate/promo-codes` | GET,POST | B | force-dynamic | default | Y | middel | middel |
| `/affiliate/referral-link` | GET | B | force-dynamic | default | Y | middel | middel |
| `/affiliate/referral` | GET | B | force-dynamic | default | N | licht | middel |
| `/affiliate/signup` | POST | B | force-dynamic | default | Y | middel | middel |
| `/affiliate/update-sub-commission` | PUT | B | force-dynamic | default | Y | middel | middel |
| `/affiliate/validate-invite` | GET | B | force-dynamic | default | Y | middel | middel |
| `/affiliate/validate-promo-code` | POST | B | force-dynamic | default | Y | middel | middel |
| `/agreements` | GET | B | force-dynamic | default | N | licht | middel |
| `/analytics/dashboard` | GET | B | force-dynamic | default | Y | middel | middel |
| `/analytics/generate-organic` | POST | B | force-dynamic | default | Y | middel | middel |
| `/analytics/track-profile-view` | POST | B | force-dynamic | default | Y | middel | middel |
| `/analytics/track-view` | POST | B | force-dynamic | default | Y | middel | middel |
| `/app-version` | GET | E | force-dynamic | default | N | licht | middel |
| `/auth/[...nextauth]` | — | D | force-dynamic | default | N | licht | middel |
| `/auth/callback/delivery-redirect` | GET | B | force-dynamic | default | Y | middel | middel |
| `/auth/callback/role-redirect` | GET | B | force-dynamic | default | N | licht | middel |
| `/auth/check-onboarding` | GET | B | default | default | Y | middel | middel |
| `/auth/complete-social-onboarding` | POST | B | default | default | Y | middel | middel |
| `/auth/force-logout` | GET,POST | B | force-dynamic | nodejs | N | licht | middel |
| `/auth/forgot-password` | POST | B | force-dynamic | default | Y | middel | middel |
| `/auth/native/google` | POST | B | force-dynamic | nodejs | N | licht | middel |
| `/auth/register-simple` | POST | B | force-dynamic | default | Y | middel | middel |
| `/auth/register` | POST | B | force-dynamic | default | Y | middel | middel |
| `/auth/resend-verification-simple` | POST | B | force-dynamic | default | N | licht | middel |
| `/auth/resend-verification` | POST | B | force-dynamic | default | N | licht | middel |
| `/auth/reset-password` | POST | B | force-dynamic | default | Y | middel | middel |
| `/auth/session-mode` | POST | B | force-dynamic | nodejs | N | licht | middel |
| `/auth/validate-email` | POST | B | force-dynamic | default | Y | middel | middel |
| `/auth/validate-username` | GET,POST | B | force-dynamic | default | N | licht | middel |
| `/auth/verify-email-simple` | GET | B | force-dynamic | default | N | licht | middel |
| `/auth/verify-email` | GET,POST | B | force-dynamic | default | N | licht | middel |
| `/beta/onboarding/complete` | POST | B | force-dynamic | default | Y | middel | middel |
| `/beta/track-download` | POST | B | force-dynamic | default | Y | middel | middel |
| `/checkout/calculate-delivery-fee` | POST | D | force-dynamic | default | Y | middel | middel |
| `/checkout` | POST | D | force-dynamic | default | Y | middel | middel |
| `/checkout/session` | GET | D | force-dynamic | default | N | licht | middel |
| `/checkout/validate-coupon` | POST | D | force-dynamic | default | N | licht | middel |
| `/community-orders/[id]/cancel` | POST | B | force-dynamic | default | N | licht | middel |
| `/community-orders/[id]/checkout-context` | GET | B | force-dynamic | default | Y | middel | middel |
| `/community-orders/[id]/complete` | POST | B | force-dynamic | default | N | licht | middel |
| `/community-orders/[id]/deal-review` | GET,POST | B | force-dynamic | default | N | licht | middel |
| `/community-orders/[id]/delivery-request` | POST | B | force-dynamic | default | N | licht | middel |
| `/community/category-ecosystem` | GET | E | force-dynamic | default | N | licht | middel |
| `/community/ecosystem-hub` | GET | E | force-dynamic | default | N | licht | middel |
| `/contact` | POST | B | force-dynamic | default | N | licht | middel |
| `/conversations-fast` | GET | E | force-dynamic | default | N | licht | middel |
| `/conversations/[conversationId]/delete` | DELETE | E | default | default | Y | middel | middel |
| `/conversations/[conversationId]/messages-fast` | GET | E | default | default | Y | middel | middel |
| `/conversations/[conversationId]/messages/quick` | POST | E | force-dynamic | default | Y | middel | middel |
| `/conversations/[conversationId]/messages` | GET,POST | E | force-dynamic | default | Y | middel | middel |
| `/conversations/[conversationId]/proposals` | GET,POST | E | force-dynamic | default | N | licht | middel |
| `/conversations/[conversationId]` | GET | E | force-dynamic | default | Y | middel | middel |
| `/conversations/[conversationId]/typing` | POST | E | force-dynamic | default | Y | middel | middel |
| `/conversations` | GET,POST | E | force-dynamic | default | Y | middel | middel |
| `/conversations/start-general` | POST | E | force-dynamic | default | Y | middel | middel |
| `/conversations/start-order` | POST | E | force-dynamic | default | Y | middel | middel |
| `/conversations/start-seller` | POST | E | force-dynamic | default | Y | middel | middel |
| `/conversations/start` | POST | E | force-dynamic | default | Y | middel | middel |
| `/coupon` | POST | B | force-dynamic | default | N | licht | middel |
| `/creator/audience-insights` | GET | B | force-dynamic | default | Y | middel | middel |
| `/creator/visibility-summary` | GET | B | force-dynamic | default | Y | middel | middel |
| `/cron/cleanup-stock-reservations` | GET | C | force-dynamic | default | Y | middel | laag |
| `/cron/delivery-warnings` | GET | C | force-dynamic | default | N | licht | laag |
| `/cron/schedule-shift-notifications` | GET | C | force-dynamic | default | Y | middel | laag |
| `/cron/send-notifications` | GET | C | force-dynamic | default | Y | middel | laag |
| `/debug-session` | GET | B | force-dynamic | default | N | licht | middel |
| `/debug/email-status` | GET | B | force-dynamic | default | N | licht | middel |
| `/delivery-requests/[id]/accept` | POST | B | force-dynamic | default | N | licht | middel |
| `/delivery-requests/[id]/assign` | POST | B | force-dynamic | default | N | licht | middel |
| `/delivery-requests/[id]/claim` | POST | B | force-dynamic | default | N | licht | middel |
| `/delivery-requests/[id]/complete` | POST | B | force-dynamic | default | N | licht | middel |
| `/delivery-requests/[id]/review` | GET,POST | B | force-dynamic | default | N | licht | middel |
| `/delivery-requests/[id]` | GET | B | force-dynamic | default | N | licht | middel |
| `/delivery/add-seller-roles` | POST | E | force-dynamic | default | Y | middel | middel |
| `/delivery/assign-order` | POST | E | force-dynamic | default | Y | middel | middel |
| `/delivery/check-availability` | POST | E | force-dynamic | default | Y | middel | middel |
| `/delivery/community-requests` | GET | E | force-dynamic | default | N | licht | middel |
| `/delivery/dashboard` | GET | E | force-dynamic | default | Y | middel | middel |
| `/delivery/earnings` | GET | E | force-dynamic | default | Y | middel | middel |
| `/delivery/gps-location` | GET,POST | E | default | default | Y | middel | middel |
| `/delivery/location` | GET,POST | E | force-dynamic | default | Y | middel | middel |
| `/delivery/match-deliverers` | GET | E | force-dynamic | default | Y | middel | middel |
| `/delivery/match-orders` | GET | E | force-dynamic | default | Y | middel | middel |
| `/delivery/notification-settings` | GET,PUT | E | force-dynamic | default | Y | middel | middel |
| `/delivery/orders/[orderId]/accept` | POST | E | force-dynamic | default | Y | middel | middel |
| `/delivery/orders/[orderId]/countdown` | GET | E | force-dynamic | default | N | licht | middel |
| `/delivery/orders/[orderId]/update-status` | POST | E | force-dynamic | default | Y | middel | middel |
| `/delivery/orders` | GET,POST | E | force-dynamic | default | Y | middel | middel |
| `/delivery/profile` | GET,POST,PUT | E | force-dynamic | default | Y | middel | middel |
| `/delivery/settings` | GET,PUT | E | force-dynamic | default | Y | middel | middel |
| `/delivery/signup` | POST | E | force-dynamic | default | Y | middel | middel |
| `/delivery/toggle-status` | POST | E | force-dynamic | default | Y | middel | middel |
| `/delivery/update-gps` | POST | E | force-dynamic | default | Y | middel | middel |
| `/delivery/upload-profile-photo` | POST | C | force-dynamic | default | Y | zwaar | middel |
| `/delivery/upload-vehicle-photos` | POST | C | force-dynamic | default | Y | zwaar | middel |
| `/delivery/vehicle-photos/[photoId]` | DELETE | E | force-dynamic | default | Y | middel | middel |
| `/distance` | POST | E | default | default | N | licht | middel |
| `/dorpsplein/products/[id]/reviews` | GET,POST | B | force-dynamic | nodejs | Y | middel | middel |
| `/earnings/combined` | GET | B | force-dynamic | default | Y | middel | middel |
| `/earnings/export` | GET | B | force-dynamic | default | Y | middel | middel |
| `/favorites` | GET,POST | B | force-dynamic | default | Y | middel | middel |
| `/favorites/status` | GET | B | force-dynamic | default | Y | middel | middel |
| `/favorites/toggle` | POST | B | force-dynamic | default | Y | middel | middel |
| `/feed` | GET | E | force-dynamic | default | Y | kritiek | hoog |
| `/follows/fans` | GET | B | force-dynamic | default | Y | middel | middel |
| `/follows` | GET | B | force-dynamic | default | Y | middel | middel |
| `/follows/status` | GET | B | force-dynamic | default | Y | middel | middel |
| `/follows/toggle` | POST | B | force-dynamic | default | Y | middel | middel |
| `/gamification/home-carousel` | GET | B | force-dynamic | default | Y | middel | middel |
| `/gamification/leaderboard` | GET | B | force-dynamic | default | Y | middel | middel |
| `/gamification/me` | GET | B | force-dynamic | default | Y | middel | middel |
| `/gamification/onboarding/dismiss` | POST | B | force-dynamic | default | Y | middel | middel |
| `/gamification/ranking-promo` | GET | B | force-dynamic | default | Y | middel | middel |
| `/geocoding/countries` | GET | E | default | default | N | licht | middel |
| `/geocoding/dutch` | GET | E | force-dynamic | default | N | licht | middel |
| `/geocoding/global` | GET,POST | E | default | default | N | licht | middel |
| `/geocoding/international` | GET | E | force-dynamic | default | N | licht | middel |
| `/home/community-pulse` | GET | E | force-dynamic | default | Y | middel | middel |
| `/i18n/[lang]` | GET | E | force-dynamic | default | N | licht | middel |
| `/inspiratie/[id]/reviews/count` | GET | E | force-dynamic | default | Y | middel | middel |
| `/inspiratie/[id]/reviews` | GET,POST | E | force-dynamic | nodejs | Y | middel | middel |
| `/inspiratie` | GET | E | revalidate | default | N | licht | middel |
| `/internal/user-suspended` | GET | B | force-dynamic | default | N | licht | middel |
| `/marketplace/exchange-suggestions` | GET | B | force-dynamic | default | Y | middel | middel |
| `/marketplace/pending-accepted-values` | GET,POST | B | force-dynamic | default | N | licht | middel |
| `/messages/[messageId]/delivered` | POST | E | force-dynamic | default | Y | middel | middel |
| `/messages/[messageId]/read` | PUT | E | force-dynamic | default | Y | middel | middel |
| `/messages/all` | GET | E | force-dynamic | default | Y | middel | middel |
| `/messages/decrypt` | POST | E | force-dynamic | default | Y | middel | middel |
| `/messages/encrypt` | POST | E | force-dynamic | default | Y | middel | middel |
| `/messages/personal` | GET,POST | E | force-dynamic | default | Y | middel | middel |
| `/messages` | GET | E | force-dynamic | default | Y | middel | middel |
| `/messages/unread-count` | GET | E | force-dynamic | default | Y | middel | middel |
| `/moderation/analyze-image` | POST | C | force-dynamic | default | Y | middel | middel |
| `/notifications/[id]/read` | POST,PUT,PATCH | E | force-dynamic | default | Y | middel | middel |
| `/notifications/mark-related-read` | POST | E | force-dynamic | default | Y | middel | middel |
| `/notifications/new-product` | POST | E | force-dynamic | default | Y | middel | middel |
| `/notifications/new-products-check` | GET | E | force-dynamic | default | Y | middel | middel |
| `/notifications/orders` | GET | E | force-dynamic | default | Y | middel | middel |
| `/notifications/preferences` | GET,PUT | E | force-dynamic | default | Y | middel | middel |
| `/notifications/read-all` | POST,PUT,PATCH | E | force-dynamic | default | Y | middel | middel |
| `/notifications` | GET,PATCH | E | force-dynamic | default | Y | middel | middel |
| `/notifications/seller-orders/ack` | POST | E | force-dynamic | default | Y | middel | middel |
| `/onboarding/analytics` | POST | B | force-dynamic | default | Y | middel | middel |
| `/operations/communication-summary` | GET | B | force-dynamic | default | Y | middel | middel |
| `/orders/[orderId]/complete` | POST | D | force-dynamic | default | Y | middel | middel |
| `/orders/[orderId]` | GET | D | force-dynamic | default | Y | middel | middel |
| `/orders/[orderId]/update` | PATCH | D | force-dynamic | default | Y | middel | middel |
| `/orders` | GET | D | force-dynamic | default | Y | middel | middel |
| `/payment/create` | POST | D | force-dynamic | default | Y | middel | middel |
| `/pitch-pdf` | GET | C | force-dynamic | nodejs | N | licht | middel |
| `/products/[id]/reviews` | GET,POST | B | force-dynamic | default | Y | middel | middel |
| `/products/[id]` | GET,PATCH,DELETE | B | force-dynamic | default | Y | middel | middel |
| `/products/create` | POST | B | force-dynamic | default | Y | middel | middel |
| `/products/debug` | GET | B | force-dynamic | default | Y | middel | middel |
| `/products/feed` | GET | E | revalidate | default | Y | middel | middel |
| `/products` | GET | B | force-dynamic | default | Y | middel | middel |
| `/profile/buyer` | POST | E | force-dynamic | default | Y | middel | hoog |
| `/profile/contact` | GET,PATCH | E | force-dynamic | default | Y | middel | hoog |
| `/profile/deals` | GET | E | force-dynamic | default | N | licht | hoog |
| `/profile/delete-account` | DELETE | E | force-dynamic | default | Y | middel | hoog |
| `/profile/dishes/[id]` | GET,PATCH,DELETE | E | force-dynamic | default | Y | middel | hoog |
| `/profile/dishes` | GET,POST | E | force-dynamic | default | Y | middel | hoog |
| `/profile/export-data` | GET | E | force-dynamic | default | Y | middel | hoog |
| `/profile/favorites` | GET | E | force-dynamic | default | Y | middel | hoog |
| `/profile/follows` | GET | E | force-dynamic | default | Y | middel | hoog |
| `/profile/garden/[id]` | GET,PATCH,DELETE | E | force-dynamic | default | Y | middel | hoog |
| `/profile/garden/photo/upload` | POST | C | force-dynamic | nodejs | N | zwaar | hoog |
| `/profile/garden` | GET,POST | E | force-dynamic | default | Y | middel | hoog |
| `/profile/items-with-reviews` | GET | E | force-dynamic | default | Y | middel | hoog |
| `/profile/me` | GET | E | force-dynamic | default | Y | middel | hoog |
| `/profile/orders` | GET | E | force-dynamic | default | Y | middel | hoog |
| `/profile/password` | PUT | E | force-dynamic | default | Y | middel | hoog |
| `/profile/photo` | POST | E | force-dynamic | default | Y | middel | hoog |
| `/profile/photo/upload` | POST | C | force-dynamic | nodejs | N | zwaar | hoog |
| `/profile/privacy` | GET,PUT | E | force-dynamic | default | Y | middel | hoog |
| `/profile/proposals` | GET | E | force-dynamic | default | N | licht | hoog |
| `/profile/recipes/photo/upload` | POST | C | force-dynamic | nodejs | N | zwaar | hoog |
| `/profile` | GET | E | force-dynamic | default | Y | middel | hoog |
| `/profile/stats` | GET | E | force-dynamic | default | Y | middel | hoog |
| `/profile/update` | PUT | E | force-dynamic | default | Y | middel | hoog |
| `/profile/username` | POST | E | force-dynamic | default | Y | middel | hoog |
| `/profile/workspace-photos` | GET | E | force-dynamic | default | Y | middel | hoog |
| `/proposals/[proposalId]/accept` | POST | B | force-dynamic | default | N | licht | middel |
| `/proposals/[proposalId]/cancel` | POST | B | force-dynamic | default | N | licht | middel |
| `/proposals/[proposalId]/counter` | POST | B | force-dynamic | default | N | licht | middel |
| `/proposals/[proposalId]/reject` | POST | B | force-dynamic | default | N | licht | middel |
| `/proposals/[proposalId]` | GET | B | force-dynamic | default | N | licht | middel |
| `/props/count` | GET | B | force-dynamic | default | Y | middel | middel |
| `/props/status` | GET | B | force-dynamic | default | Y | middel | middel |
| `/props/toggle` | POST | B | force-dynamic | default | Y | middel | middel |
| `/push/debug/status` | GET | B | force-dynamic | default | Y | middel | middel |
| `/push/register` | POST,DELETE | B | force-dynamic | default | Y | middel | middel |
| `/pusher/auth` | POST | D | force-dynamic | default | Y | middel | middel |
| `/recipes/[id]` | GET | B | force-dynamic | default | Y | middel | middel |
| `/recommendations/smart` | GET | E | force-dynamic | default | Y | middel | middel |
| `/register` | POST | B | force-dynamic | default | Y | middel | middel |
| `/reports/create` | POST | B | force-dynamic | default | Y | middel | middel |
| `/reviews/[id]/responses` | GET,POST | B | force-dynamic | default | Y | middel | middel |
| `/reviews/count` | GET | B | force-dynamic | default | Y | middel | middel |
| `/reviews/create` | POST | B | force-dynamic | default | Y | middel | middel |
| `/reviews/token/[token]` | GET | B | force-dynamic | default | Y | middel | middel |
| `/seller/[sellerId]/recipes` | GET | B | force-dynamic | default | Y | middel | middel |
| `/seller/[sellerId]` | GET | B | force-dynamic | default | Y | middel | middel |
| `/seller/[sellerId]/stats` | GET | B | force-dynamic | default | Y | middel | middel |
| `/seller/action-center` | GET | B | force-dynamic | default | Y | middel | middel |
| `/seller/dashboard/export` | POST | B | force-dynamic | default | Y | middel | middel |
| `/seller/dashboard/orders` | GET | B | force-dynamic | default | Y | middel | middel |
| `/seller/dashboard/products` | GET | B | force-dynamic | default | Y | middel | middel |
| `/seller/dashboard/stats` | GET | B | force-dynamic | default | Y | middel | middel |
| `/seller/delivery-settings` | GET,PUT | B | force-dynamic | default | Y | middel | middel |
| `/seller/dynamic-location` | GET,POST | B | default | default | Y | middel | middel |
| `/seller/earnings` | GET | B | force-dynamic | default | Y | middel | middel |
| `/seller/fees` | POST | B | force-dynamic | default | N | licht | middel |
| `/seller/payouts/request-bank` | POST | B | force-dynamic | default | Y | middel | middel |
| `/seller/payouts/request` | POST | B | force-dynamic | default | Y | middel | middel |
| `/seller/payouts` | GET | B | force-dynamic | default | Y | middel | middel |
| `/seller/products` | GET | B | force-dynamic | default | Y | middel | middel |
| `/seller/profile` | GET,PUT | B | force-dynamic | default | Y | middel | middel |
| `/seller/refunds` | GET | B | force-dynamic | default | Y | middel | middel |
| `/seller/stripe/status` | GET | B | force-dynamic | default | Y | middel | middel |
| `/seller/transactions` | GET | B | force-dynamic | default | Y | middel | middel |
| `/seller/upload-profile-photo` | POST | C | force-dynamic | default | Y | zwaar | middel |
| `/seller/upload-workplace-photos` | POST | C | force-dynamic | nodejs | Y | zwaar | middel |
| `/seller/workplace-photos/[id]` | DELETE | B | force-dynamic | default | Y | middel | middel |
| `/seller/workplace-photos` | GET | B | force-dynamic | default | Y | middel | middel |
| `/shipping/calculate-price` | POST | B | force-dynamic | default | Y | middel | middel |
| `/shipping/create-label` | POST | B | force-dynamic | default | Y | middel | middel |
| `/stripe/connect/onboard` | GET,POST | D | default | default | Y | middel | middel |
| `/stripe/connect/webhook` | POST | D | force-dynamic | default | Y | middel | middel |
| `/stripe/webhook` | POST | D | force-dynamic | default | Y | middel | middel |
| `/subscribe/cancel` | POST | D | force-dynamic | default | Y | middel | middel |
| `/subscribe/confirm` | POST | D | force-dynamic | default | Y | middel | middel |
| `/subscribe` | POST | D | force-dynamic | default | Y | middel | middel |
| `/subscribe/validate` | GET | D | force-dynamic | default | N | licht | middel |
| `/test-products` | GET | B | default | default | Y | middel | middel |
| `/test-stripe` | GET | B | default | default | N | licht | middel |
| `/upload` | POST | C | force-dynamic | nodejs | N | zwaar | middel |
| `/upload/video-chunked/chunk` | POST | C | force-dynamic | nodejs | N | zwaar | middel |
| `/upload/video-chunked/finalize` | POST | C | force-dynamic | nodejs | N | zwaar | middel |
| `/upload/video-chunked/init` | POST | C | force-dynamic | nodejs | N | zwaar | middel |
| `/upload/video-direct` | POST | C | force-dynamic | nodejs | N | zwaar | middel |
| `/upload/video-token` | POST | C | force-dynamic | nodejs | N | zwaar | middel |
| `/user/[userId]/items-with-reviews` | GET | E | force-dynamic | default | Y | middel | middel |
| `/user/[userId]/stats` | GET | E | force-dynamic | default | N | licht | middel |
| `/user/[userId]/trust-summary` | GET | E | force-dynamic | default | N | licht | middel |
| `/user/action-center` | GET | E | force-dynamic | default | Y | middel | middel |
| `/user/beta-status` | GET | E | force-dynamic | default | Y | middel | middel |
| `/user/home-ui` | GET,PATCH | E | force-dynamic | default | Y | middel | middel |
| `/user/language` | GET,POST | E | force-dynamic | default | Y | middel | middel |
| `/user/me` | GET | E | force-dynamic | default | Y | middel | hoog |
| `/user/relationship-summary` | GET | E | force-dynamic | default | Y | middel | middel |
| `/user/return-signals` | GET | E | force-dynamic | default | Y | middel | middel |
| `/users/online-status` | GET,POST | B | force-dynamic | default | Y | middel | middel |
| `/users` | GET | B | static | default | Y | middel | middel |
| `/verify/company` | POST | B | force-dynamic | default | N | licht | middel |
| `/video-proxy` | GET | C | default | nodejs | N | zwaar | middel |
| `/webhooks/ectaroship` | POST | D | force-dynamic | default | Y | middel | middel |
| `/workspace-content/comments` | GET,POST,DELETE | B | force-dynamic | default | Y | middel | middel |
| `/workspace-content/props` | GET,POST | B | force-dynamic | default | Y | middel | middel |
| `/workspace-content` | GET,POST | B | force-dynamic | default | Y | middel | middel |
| `/workspace-content/upload-photos` | POST | C | force-dynamic | default | Y | zwaar | middel |
---

## Auth-patronen (repo-breed)

| Patroon | Gebruik |
|---------|---------|
| `auth()` / `getServerSession` | Meeste authenticated routes |
| `requireAdminPermission` | Admin guard routes |
| `Bearer CRON_SECRET` | Sommige cron routes |
| Stripe/EctaroShip signature | Webhooks |
| Public | Geocoding, i18n, app-version, registratie |

---

## Externe integraties per route-type

| Service | Routes |
|---------|--------|
| Stripe | checkout, subscribe, webhooks, connect, seller earnings |
| Pusher | pusher/auth, messages, typing, online-status |
| Vercel Blob | upload/*, profile/seller/delivery photos |
| Resend | contact, forgot-password, admin messaging |
| EctaroShip | shipping/*, webhooks |
| Firebase FCM | push/register |
| Google APIs | admin/analytics/ga4, auth/native/google, moderation vision |

---

## Acceptatiecriteria

- [x] Alle 324 API routes geïnventariseerd
- [x] Classificatie A–E per route
- [x] Webhooks, cron, hot paths uitgelicht
- [x] Geen codewijzigingen

