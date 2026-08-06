# GPS Permission Review

| State | Behaviour |
|-------|-----------|
| Not previously requested | Prompt only after “Gebruik mijn locatie” tap |
| Granted | Coords → nearby scope → feed refresh → preference |
| Denied once | Structured message + open place input |
| Permanently denied / blocked | Same message + settings guidance + manual fallback |
| GPS disabled / unavailable | Unavailable message + manual fallback |
| Timeout | Timeout message + retry + manual fallback |
| Approximate only | `enableHighAccuracy: false` by default for discovery |
| Android granted/denied | Capacitor `requestAndGetNativeCurrentPosition` |
| Browser granted/denied | `navigator.geolocation.getCurrentPosition` |

No permission request on page load. No repeated prompt loop (single user-initiated call per tap).
