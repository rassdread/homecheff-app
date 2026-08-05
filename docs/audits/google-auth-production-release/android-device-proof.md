# Android real-device proof

**Status:** NOT PERFORMED

### Blockers

- No connected Android device (`adb devices` empty).
- New APK/AAB not built (JDK + `google-services.json` missing).

### Required before PASS

Clean install of new build from merge `5b18654…` → Login → no raw env warning → Capgo Google chooser → verified ID token → HomeCheff session → Create/Messages continuity → logout → re-login → no duplicate user.

Fallback missing-config test must use non-Production test build only.
