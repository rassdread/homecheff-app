# HomeCheff — registratie, bereikbaarheid en contact (Fase 4A)

> Strategische productvisie: [HomeCheff Ecosysteem V3](HOMECHEFF_ECOSYSTEM_V3.md)

Leidende structuur voor account, profiel, bereikbaarheid en betalingen.

## Actieve registratiepaden

| Pad | Entry | Afronding | Status |
|-----|-------|-----------|--------|
| E-mail (licht) | `/register` | `POST /api/auth/register` → e-mailverificatie | **Actief** |
| Google / social | OAuth → `/auth/social-success` | `/onboarding/complete-profile` | **Actief** |
| Legacy URL | `/register?social=true` | Redirect naar `RegisterSocialRedirect` → complete-profile | **Compat** |

## Legacy / niet gebruiken in productie-UI

| Onderdeel | Status | Opmerking |
|-----------|--------|-----------|
| `SocialLoginOnboarding.tsx` | **Verwijderd (4A)** | Nergens geïmporteerd |
| Register wizard stappen 2–6 | **Verwijderd (4A)** | Data werd niet opgeslagen |
| `POST /api/auth/register-simple` | **Legacy API** | Alleen docs; zwakkere validatie |
| `complete-social-onboarding` full path | **Legacy API** | Vereist adres; geen actieve UI |
| `DynamicSeller.contactPhone/Email` | **LEGACY_CONTACT_SYSTEM** | Zie onder |

## Contactvelden — één waarheid

### Privé contact — `User.phoneNumber`

- **Gebruik:** intern, SMS-notificaties, bezorging, admin/support
- **Niet publiek.** Geen automatische koppeling aan bereikbaarheid
- **Bewerken:** geen actieve profiel-UI (alleen legacy social full API)
- **Registratie:** niet opgeslagen via `/api/auth/register`

### Publiek contact — Bereikbaarheid (`User.public*`)

| Veld | Enabled flag |
|------|--------------|
| `publicPhoneNumber` | `publicPhoneEnabled` |
| `publicWhatsappNumber` | `publicWhatsappEnabled` |
| `instagramUrl` | `publicInstagramEnabled` |
| `facebookUrl` | `publicFacebookEnabled` |
| `tiktokUrl` | `publicTikTokEnabled` |
| `websiteUrl` | `publicWebsiteEnabled` |
| `telegramUrl` | `publicTelegramEnabled` |

- **Bewerken:** `MakerContactSettings` → `GET/PATCH /api/profile/contact`
- **Publiek tonen:** `loadPublicContactChannelsForUser` → `MakerContactSection`
- **HomeCheff chat:** altijd gratis; geen DB-veld

### Legacy — `DynamicSeller.contactPhone` / `contactEmail`

- **Model:** `DynamicSeller` (1:1 met User)
- **API:** `POST/GET /api/seller/dynamic-location`
- **UI:** `DynamicSellerForm` — **niet wired** in app
- **Migratiepad (toekomst):** publiek contact via `MakerContactSettings` / `publicContactChannels`
- **Geen automatische migratie** zonder expliciete productbeslissing

## Inspiratie vs. product (bewust beleid)

HomeCheff laat **inspiratie** (Dish: recipe/garden/design) bewust met **minder frictie** delen dan commercieel aanbod:

| | Inspiratie | Product |
|---|------------|---------|
| API gate | Alleen login | `postItem`: e-mail + username + terms |
| Stripe | Nee | Alleen live `HOMECHEFF_PAYMENT` + prijs > 0 |
| Zichtbaarheid | `status: PUBLISHED` | `isActive: true` (+ publish gate) |

Geen extra gates toevoegen zonder productbeslissing.

## Account requirements — `action: 'sell'`

- **`canSell` / `canReceivePayments`:** snapshot voor UI (profiel, dashboards)
- **`assertAccountRequirementsOr403(..., 'sell')`:** **niet gebruikt** door API-routes
- **Stripe voor live betaalproducten:** afgedwongen via `resolveProductPublishState` (Fase 2D)

`action: 'sell'` blijft in types voor compatibiliteit; enforcement = publish gate, niet account-requirements.

## Privacy / account deletion

Bij accountverwijdering worden public contactvelden meegenomen in anonymisatie (Fase 4A).
Zie `lib/account-deletion.ts` en TODO `GDPR_DYNAMIC_SELLER` voor DynamicSeller-rijen.

## Technische schuld (4A)

### Veilig verwijderd

- `SocialLoginOnboarding.tsx`
- Register multi-step wizard (niet-submittende stappen)

### Later verwijderen

- `POST /api/auth/register-simple` (na bevestiging geen externe callers)
- `complete-social-onboarding` full path
- `DynamicSeller` contactvelden + form (na productbeslissing)
- Ongebruikte register state/helpers (address lookup in register page)

### Behouden

- `/onboarding/complete-profile` (canonical social onboarding)
- `MakerContactSettings` / `maker-contact-preferences`
- `account-requirements` `postItem` + `sendMessage`
- Publish gate in `lib/product/order-method.ts`
