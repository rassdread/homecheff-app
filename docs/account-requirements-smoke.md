# Account requirements — handmatige smoke

Gebruik na wijzigingen aan onboarding / account-requirements. Geen DB-migratie nodig voor deze feature (velden bestonden al).

## 1. Nieuwe e-mail signup, e-mail nog niet geverifieerd

- Ingelogd, browse feed/marketplace/profielen: werkt.
- Start gesprek of POST naar `/api/conversations/start`: verwacht **403** met `error: ACCOUNT_REQUIREMENTS_MISSING` en stap “e-mail verifiëren”.
- Product aanmaken via create-flow: zelfde 403-gedrag.

## 2. Geverifieerd, nog geen definitieve username (temp\_ of leeg)

- Browsen werkt.
- Bericht / plaatsen: 403 met ontbrekende stap “definitieve gebruikersnaam”.
- Banner bovenin (amber) zichtbaar buiten `/profile` en auth-routes.

## 3. Geverifieerd + definitieve username + voorwaarden

- Berichten starten en versturen via API: **200** (normale flow).
- Product plaatsen: **200** (mits overige validatie slaagt).

## 4. Google login met tijdelijke username

- Browsen werkt.
- Actieve acties: 403 + checklist; banner voor username-keuze.

## 5. Na definitieve username (eenmalige wijziging)

- `/api/profile/username` of profiel-update: alleen toegestaan vanaf placeholder-naam.
- Daarna: profiel mag username niet meer wijzigen (bestaande foutmelding).

## 6. Directe API (curl / Postman)

- POST zonder sessie: **401**.
- Met sessie maar ontbrekende stappen: **403** + `ACCOUNT_REQUIREMENTS_MISSING` + `missing[]` met `key`, `label`, `actionHref`.

## Edge cases

- Gebruiker met **Google account** en **geen** `passwordHash`: als `emailVerified` ontbreekt in DB, wordt e-mail alsnog als betrouwbaar gezien (alleen in combinatie met Google-link).
- **Stripe**: ontbrekende onboarding telt alleen als `stripeConnectAccountId` gezet is en onboarding niet af — dan verschijnt stap in `missing` voor **sell**-snapshot (`canSell`); product plaatsen gebruikt **postItem** (geen stripe in die filter). Live betaalproducten: publish gate in `lib/product/order-method.ts` (Fase 2D).
- **Inspiratie (Dish)**: bewust lichter dan product — alleen login, geen `postItem`-gate. Zie `docs/HOMECHEFF_REGISTRATION_AND_CONTACT.md`.
