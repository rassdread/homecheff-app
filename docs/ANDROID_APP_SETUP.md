# Android App Setup - HomeCheff

## 📱 Overzicht

Je Next.js app is nu geconfigureerd om als Android app te draaien met Capacitor. De app wijst naar je live website (`https://homecheff.nl`) en werkt als een native Android app.

## ✅ Wat is al geconfigureerd:

- ✅ Capacitor geïnstalleerd
- ✅ Android platform toegevoegd
- ✅ Manifest.json voor PWA support
- ✅ Capacitor configuratie bestand
- ✅ Build scripts in package.json

## 🚀 Stappen om de Android App te bouwen:

### 1. Installeer Android Studio

Download en installeer [Android Studio](https://developer.android.com/studio) op je computer.

### 2. Configureer Android SDK

1. Open Android Studio
2. Ga naar **Tools** → **SDK Manager**
3. Installeer:
   - Android SDK Platform 33 of hoger
   - Android SDK Build-Tools
   - Android SDK Command-line Tools

### 3. Set Environment Variables (Windows)

Voeg toe aan je systeem environment variables:

```powershell
ANDROID_HOME=C:\Users\Admin\AppData\Local\Android\Sdk
PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
```

**Of via GUI:**
1. Zoek "Environment Variables" in Windows
2. Voeg `ANDROID_HOME` toe met waarde: `C:\Users\Admin\AppData\Local\Android\Sdk`
3. Voeg aan PATH toe: `%ANDROID_HOME%\platform-tools` en `%ANDROID_HOME%\tools`

### 4. App Icons en Splash Screens

Je moet app icons toevoegen aan `public/`:

**Benodigde icon sizes:**
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

**Splash screen:**
- Maak een `splash.png` (minimaal 2732x2732px voor Android)

**Tip:** Gebruik een tool zoals [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) of [App Icon Generator](https://www.appicon.co/) om alle sizes te genereren.

### 5. Sync Capacitor

```bash
npm run cap:sync
```

Dit synchroniseert je web app met het Android project.

### 6. Open Android Project

```bash
npm run cap:open:android
```

Dit opent het Android project in Android Studio.

### 7. Build de App in Android Studio

1. Wacht tot Android Studio het project heeft geïndexeerd
2. Klik op **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Of gebruik **Run** → **Run 'app'** om direct op een emulator/device te testen

### 8. Test op Emulator of Device

**Emulator:**
1. In Android Studio: **Tools** → **Device Manager**
2. Maak een nieuwe virtual device aan
3. Start de emulator
4. Run de app

**Fysiek Device:**
1. Zet USB debugging aan op je Android telefoon
2. Verbind via USB
3. Accepteer de debugging prompt op je telefoon
4. Run de app vanuit Android Studio

## 🔧 Development Workflow

### Voor Development (lokaal testen):

1. Start je Next.js dev server:
```bash
npm run dev
```

2. Pas `capacitor.config.ts` aan:
```typescript
server: {
  url: 'http://localhost:3000',
  cleartext: true
}
```

3. Sync en open:
```bash
npm run cap:sync
npm run cap:open:android
```

### Voor Production:

1. Zorg dat je app live staat op `https://homecheff.nl`
2. Pas `capacitor.config.ts` aan:
```typescript
server: {
  url: 'https://homecheff.nl'
}
```

3. Build:
```bash
npm run cap:build:android
```

## 📦 APK vs AAB

**APK:** Direct te installeren op devices (voor testing)
**AAB (Android App Bundle):** Vereist voor Google Play Store upload

De configuratie is ingesteld op AAB. Om te wisselen, pas `capacitor.config.ts` aan:
```typescript
android: {
  buildOptions: {
    releaseType: 'APK' // of 'AAB'
  }
}
```

## 🎨 App Icons Genereren

Als je nog geen icons hebt, gebruik deze tools:

1. **Online:** [App Icon Generator](https://www.appicon.co/)
2. **CLI:** [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
3. **Photoshop/GIMP:** Exporteer je logo in alle benodigde sizes

Plaats alle icons in de `public/` directory.

## 🔐 Signing Key (voor Google Play)

Voor productie releases moet je een signing key aanmaken:

```bash
keytool -genkey -v -keystore homecheff-release.keystore -alias homecheff -keyalg RSA -keysize 2048 -validity 10000
```

Bewaar dit bestand veilig! Voeg toe aan `capacitor.config.ts`:
```typescript
android: {
  buildOptions: {
    keystorePath: 'path/to/homecheff-release.keystore',
    keystorePassword: 'your-password',
    keystoreAlias: 'homecheff',
    keystoreAliasPassword: 'your-password'
  }
}
```

## 📝 Belangrijke Notities

1. **WebView:** De app gebruikt een WebView die naar je live website wijst. Alle server-side features werken normaal.

2. **Offline Support:** Je service worker (`public/sw.js`) zorgt voor offline caching.

3. **Native Features:** Je kunt later native plugins toevoegen zoals:
   - Camera
   - Geolocation
   - Push notifications
   - File system access

4. **Updates:** Omdat de app naar je live website wijst, krijgen gebruikers automatisch updates zonder app store update.

## 🐛 Troubleshooting

**"Missing dist directory" warning:**
- Dit is normaal, de app wijst naar je live URL

**"Command not found: adb":**
- Zorg dat Android SDK platform-tools in je PATH staat

**Build errors:**
- Zorg dat Android SDK 33+ is geïnstalleerd
- Check dat Java JDK 11+ is geïnstalleerd

**App laadt niet:**
- Check je internet verbinding
- Verify dat `https://homecheff.nl` bereikbaar is
- Check de Capacitor logs in Android Studio

## 📚 Meer Info

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Development Guide](https://developer.android.com/guide)
- [Next.js Deployment](https://nextjs.org/docs/deployment)








