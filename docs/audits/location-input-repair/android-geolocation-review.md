# Android Geolocation Review

| Item | Value |
|------|-------|
| Runtime | Capacitor `@capacitor/geolocation` inside WebView |
| Package | `eu.homecheff.mobile` |
| Manifest | `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` |
| Background | **Not** requested |
| User action | `requestAndGetNativeCurrentPosition` |
| Fallback | On native failure, browser geolocation attempted; then manual place |

Real-device proof still operator-required after deploy.
