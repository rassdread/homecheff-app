# Automated tests

## Command

```bash
npm run test:location-mobile-keyboard
```

## Results (this session)

**21/21 passed**

Includes:

- Pre-fix simulation: unstable `onClose` steals focus on re-render
- Fixed simulation: place focus retained across 5 parent re-renders
- Sheet effect deps = `[open]` only
- No `select()` on open focus
- Input attributes (`type`, `inputMode`, `text-base`, label `htmlFor`)
- `onPointerDown` focus without `.preventDefault()`
- Stable `closeMobileFilterSheet` wiring
- Android `adjustResize`
- No `Keyboard.hide` in MainActivity / GeoFeed

## Related regression suites

| Suite | Result |
|---|---|
| `npm run test:location-input-repair` | 16/16 |
| `npm run test:gps-location-repair` | 30/30 |

## Explicit non-claim

These tests report **focus retention**, not soft-keyboard PASS.
