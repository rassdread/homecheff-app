# Android App - Benodigdheden Overzicht

## ✅ Wat je al hebt:
- ✅ Capacitor geïnstalleerd (`@capacitor/android`, `@capacitor/core`, `@capacitor/cli`)
- ✅ Android platform toegevoegd (`android/` directory)
- ✅ Capacitor configuratie (`capacitor.config.ts`)
- ✅ Build scripts in `package.json`
- ✅ App wijst naar live website: `https://homecheff.nl`

## 📥 Software die je moet installeren:

### 1. **Android Studio** (VERPLICHT)
- **Download:** https://developer.android.com/studio
- **Waarom:** Je hebt Android Studio nodig om:
  - Android SDK te installeren
  - De app te builden
  - APK/AAB bestanden te genereren
  - Op emulator of device te testen

**Installeer tijdens setup:**
- Android SDK Platform 33 of hoger
- Android SDK Build-Tools
- Android SDK Command-line Tools
- Android SDK Platform-Tools

### 2. **Java Development Kit (JDK)** (VERPLICHT)
- **Download:** JDK 11 of hoger (JDK 17 aanbevolen)
- **Link:** https://adoptium.net/ (gratis OpenJDK)
- **Waarom:** Android Studio gebruikt Java om Android apps te builden

**Check of je JDK hebt:**
```powershell
java -version
```

### 3. **Node.js** (AL GEÏNSTALLEERD)
- ✅ Je hebt Node.js al (zie `package.json` → `engines`)
- **Check:** `node -version` (moet >= 18.0.0 zijn)

## 🔧 Environment Variables Setup (Windows)

Na installatie van Android Studio, moet je deze environment variables instellen:

### Via PowerShell (Administrator):
```powershell
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\Admin\AppData\Local\Android\Sdk", "User")
$env:Path += ";C:\Users\Admin\AppData\Local\Android\Sdk\platform-tools"
$env:Path += ";C:\Users\Admin\AppData\Local\Android\Sdk\tools"
[System.Environment]::SetEnvironmentVariable("Path", [System.Environment]::GetEnvironmentVariable("Path", "User"), "User")
```

### Via GUI (Aanbevolen):
1. Zoek "Environment Variables" in Windows Start menu
2. Klik op "Edit the system environment variables"
3. Klik "Environment Variables..."
4. Onder "User variables" klik "New":
   - **Variable name:** `ANDROID_HOME`
   - **Variable value:** `C:\Users\Admin\AppData\Local\Android\Sdk`
5. Selecteer "Path" variabele → "Edit"
6. Klik "New" en voeg toe:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`

**Let op:** Herstart PowerShell/CMD na het instellen van environment variables.

**Test of het werkt:**
```powershell
adb version
```

## 🎨 App Assets (Optioneel maar aanbevolen)

### App Icons
Plaats in `public/` directory:
- `icon-192x192.png`
- `icon-512x512.png`
- (Meer sizes optioneel)

### Splash Screen
- Maak `splash.png` (minimaal 2732x2732px)
- Plaats in `public/`

**Tip:** Gebruik [App Icon Generator](https://www.appicon.co/) of [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) voor automatische generatie.

## 🔐 Keystore voor Google Play (Alleen voor publicatie)

Als je de app wilt publiceren op Google Play Store, moet je een signing key aanmaken:

```bash
keytool -genkey -v -keystore android/app/homecheff-release.keystore -alias homecheff -keyalg RSA -keysize 2048 -validity 10000
```

**Belangrijk:** Bewaar de keystore en wachtwoorden VEILIG! Zonder deze kun je geen updates meer publiceren.

## 📱 Workflow: App bouwen en testen

### Stap 1: Sync Capacitor
```bash
npm run cap:sync
```

### Stap 2: Open in Android Studio
```bash
npm run cap:open:android
```

### Stap 3: In Android Studio:
1. Wacht tot project geïndexeerd is
2. **Voor APK (testen):**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - APK vind je in: `android/app/build/outputs/apk/debug/app-debug.apk`

3. **Voor AAB (Google Play):**
   - Build → Generate Signed Bundle / APK
   - Selecteer "Android App Bundle"
   - Volg de wizard

4. **Voor testen op emulator:**
   - Tools → Device Manager → Create Device
   - Run → Run 'app'

5. **Voor testen op fysiek device:**
   - Zet USB debugging aan op telefoon
   - Verbind via USB
   - Accepteer debugging prompt
   - Run → Run 'app'

## 🔍 Checklist voor eerste build:

- [ ] Android Studio geïnstalleerd
- [ ] Android SDK Platform 33+ geïnstalleerd
- [ ] JDK 11+ geïnstalleerd
- [ ] Environment variables ingesteld (`ANDROID_HOME`, `PATH`)
- [ ] `adb version` werkt in PowerShell
- [ ] `npm install` uitgevoerd
- [ ] `npm run cap:sync` uitgevoerd
- [ ] Android Studio opent zonder errors

## ⚙️ Huidige Configuratie

Je app is nu geconfigureerd als **Hybrid Web App**:
- Laadt `https://homecheff.nl` in een WebView
- Updates komen automatisch (geen app store update nodig)
- Native Android features beschikbaar via Capacitor plugins

**Voordelen:**
- ✅ Automatische updates
- ✅ Eén codebase voor web en app
- ✅ Geen extra build nodig voor web

**Mogelijke uitbreidingen later:**
- Offline support (statische export)
- Native plugins (camera, geolocation, push notifications)
- Custom splash screens en icons

## 🐛 Troubleshooting

**"Command not found: adb"**
- Environment variables niet goed ingesteld
- Herstart PowerShell/CMD
- Check `ANDROID_HOME` path

**"SDK not found"**
- Open Android Studio
- Tools → SDK Manager
- Installeer Android SDK Platform 33+

**"Java not found"**
- Installeer JDK 11+
- Check `java -version` in PowerShell

**Build errors in Android Studio:**
- File → Sync Project with Gradle Files
- Build → Clean Project
- Build → Rebuild Project

## 📚 Meer informatie

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Studio Guide](https://developer.android.com/studio/intro)
- [Next.js + Capacitor](https://capacitorjs.com/docs/guides/next)







