# Capacitor / Android keyboard review

## Capacitor Keyboard plugin

**Not installed.** `capacitor.config.ts` has no Keyboard plugin. No `Keyboard.hide()` / `Keyboard.show()` in app location code. Fix does **not** add native keyboard plugin usage.

## windowSoftInputMode

**Before:** MainActivity had no `android:windowSoftInputMode` (unspecified).  
**After:** `android:windowSoftInputMode="adjustResize"` on `MainActivity` so the WebView resizes when the IME opens (sheet remains visible above keyboard).

## Other Android notes

| Item | Status |
|---|---|
| WebView focusability | Standard Capacitor Bridge WebView; no blur helpers in MainActivity |
| Splash immersive | Splash only; post-splash `AppTheme.NoActionBar` with `setDecorFitsSystemWindows(true)` |
| Geolocation | Unrelated; no Keyboard.hide on GPS paths |
| Route transition after picker open | Choose-place opens sheet in-place; no navigation |

## Rebuild note

Manifest change requires a **new Android APK/AAB build** before Capacitor device proof. Web-only Chrome proof does not need a new native build.
