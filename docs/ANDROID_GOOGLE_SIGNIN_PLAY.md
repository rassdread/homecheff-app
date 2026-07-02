# Google Sign-In — Google Play Open Testing

Lokaal/release APK werkt, maar **Play Store (Open Testing)** faalt meestal door **Google Play App Signing**: de app op het apparaat is ondertekend met een **ander certificaat** dan je upload-keystore. Firebase/Google OAuth kent dan alleen je debug- en upload-SHA, niet de **App signing key** van Play.

Symptoom: `DEVELOPER_ERROR` / `ApiException: 10` in de native Google-login flow.

## Package

- **applicationId:** `eu.homecheff.mobile`
- **Firebase project:** `homecheff-cbb05`

## Diagnose in repo

```bash
node scripts/android-signing-fingerprints.mjs
node scripts/validate-google-services.mjs
```

`validate-google-services.mjs` **faalt** als `oauth_client` leeg is voor `eu.homecheff.mobile` — dat betekent: nog geen SHA-1 in Firebase geregistreerd, of `google-services.json` niet opnieuw gedownload.

## Stappen (eenmalig + na elke nieuwe signing key)

### 1. SHA’s verzamelen

| Bron | Waar |
|------|------|
| Debug | `node scripts/android-signing-fingerprints.mjs` (of Android Studio) |
| Upload / release | Zelfde script (`android/homecheff-release-key.jks`) |
| **Play App Signing** | Play Console → **Setup** → **App integrity** → **App signing key certificate** |

### 2. Firebase

1. [Firebase Console](https://console.firebase.google.com/project/homecheff-cbb05/settings/general) → **Your apps** → Android `eu.homecheff.mobile`
2. **Add fingerprint** voor **alle** SHA-1 (minimaal; SHA-256 mag ook)
3. **Download** `google-services.json` → `android/app/google-services.json`
4. `node scripts/validate-google-services.mjs` moet slagen (minstens één Android `oauth_client`)

### 3. Google Cloud (zelfde project)

- **OAuth consent screen:** status **In production** / Published
- **Credentials → Web client:** zelfde client id als `NEXT_PUBLIC_GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_ID` op Vercel
- Geen aparte “verkeerde” Android client id in de app — native flow gebruikt **Web client id** via `@capgo/capacitor-social-login` (`mode: 'online'`)

### 4. Build & upload

```bash
npm run build
npx cap sync android
node scripts/validate-google-services.mjs
cd android && ./gradlew clean bundleRelease
```

Version bump: `config/android-version.json` (of `node scripts/release-android.mjs <versie> --aab --play`).

Upload AAB naar **Open Testing** in Play Console.

### 5. Testen

Inlogscherm → native Google-knop. Bij fout: Chrome remote debugging / `adb logcat` en zoek `[HomeCheff google-login]` — bevat o.a. `statusCode: 10`, `DEVELOPER_ERROR` als SHA nog ontbreekt.

## Veelvoorkomende fouten

| Fout | Oorzaak |
|------|---------|
| ApiException **10** / DEVELOPER_ERROR | Play App Signing SHA ontbreekt in Firebase |
| Lege `oauth_client` in json | SHA niet toegevoegd of json niet opnieuw gedownload |
| Token OK, API `token_audience_mismatch` | `GOOGLE_CLIENT_ID` op server ≠ `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in app |
| Werkt op beta APK, niet Play | Beta APK = upload key; Play = app signing key |

## Bestanden

- `android/app/google-services.json` — lokaal, **niet** committen (`.gitignore`)
- `android/keystore.properties` + `*.jks` — lokaal, niet committen
