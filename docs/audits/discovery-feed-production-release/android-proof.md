# Android App Proof

**Status:** DEVICE INTERACTIVE PROOF NOT EXECUTED (`adb devices` empty).

## Remote Production bundle

`capacitor.config.ts` points the Android WebView at Production (`https://homecheff.eu`). After this deploy, the app loads the promoted web bundle without a mandatory APK rebuild for the JS feed fix.

Manifest `adjustResize` from prior location repair remains in tree; soft-keyboard device proof still pending separately.

## Pending on device

- Open with no saved location → feed visible
- Manual place + keyboard
- GPS allow → Nearby
- GPS deny → discovery remains
- Portrait / landscape / restart
