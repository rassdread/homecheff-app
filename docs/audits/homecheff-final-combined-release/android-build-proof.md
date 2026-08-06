# Android Build Report

| Item | Status |
|------|--------|
| Package `eu.homecheff.mobile` | Confirmed in `android/app/build.gradle` |
| versionName / versionCode | `1.0.19` / `25` (unchanged — no policy bump this release) |
| Launcher icons | Updated in merge (Globeman-derived mipmaps) |
| `google-services.json` | **Not present in clean worktree** (typically gitignored) — operator must supply |
| `npm run sync-android-splash` | Ran |
| `./gradlew :app:assembleDebug` | **FAILED** — no Java Runtime on release agent |
| Play Store publish | **Not performed** |

**Operator required:** install JDK, place `google-services.json`, `npm run cap:sync`, build signed AAB/APK from SHA `7a3b24c5`, verify launcher icon + native Google login + location keyboard/GPS on device.
