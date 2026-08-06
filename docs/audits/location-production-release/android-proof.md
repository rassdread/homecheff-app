# Android Proof

**Status:** APK BUILT — INSTALL / INTERACTIVE PROOF BLOCKED

## Build

| Field | Value |
|---|---|
| Source | merge `ae8cbb04` + `npx @capacitor/cli sync android` |
| Artifact | `android/app/build/outputs/apk/debug/app-debug.apk` (11 MB) |
| SHA-256 | `6f1c24e4ede30a2d60dc433c3ee33f7d9c693cff441a864a1b30430e2b6aa1cc` |
| Package | `eu.homecheff.mobile` |
| versionName | `1.0.19` (versionCode 25) |
| Manifest softInput | `android:windowSoftInputMode=adjustResize` (aapt `0x10`) |
| Permissions | FINE + COARSE location; no BACKGROUND |
| adb devices | **empty** — no install target |

## Interactive checklist (pending on device)

- [ ] Install APK
- [ ] Tap place field → soft keyboard opens
- [ ] Type city / postcode — no focus theft
- [ ] Select location → feed refresh
- [ ] GPS allow / deny / manual fallback
- [ ] Portrait + landscape
- [ ] Close/reopen → saved location
