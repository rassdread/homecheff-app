# Real-device reproduction

## Agent environment limitation

No physical Android phone, Android emulator with interactive soft keyboard capture, or iOS device was available in this session. Desktop Chrome DevTools device emulation **does not** prove soft-keyboard behaviour.

## Pre-fix behaviour (operator / live report)

| Field | Value |
|---|---|
| Symptom | Place input visible; tap does not open soft keyboard; cannot type |
| Route | Home / Discovery feed (mobile compact chrome) |
| Tap target | “Kies een plaats” → sheet → place/postcode field |
| Runtimes reported | Android Capacitor app; Android Chrome |
| Orientations | Phone portrait (primary); landscape also affected |

## Code-traced reproduction (deterministic)

1. Open mobile filter sheet (`open=true`).
2. Effect focuses place input (or user taps it) → `activeElement` = place input.
3. Parent re-renders (e.g. `setPlace` on first keystroke, or any GeoFeed state).
4. Inline `onClose` identity changes.
5. Effect cleanup runs → `previousFocus.focus()` → place input blurs.
6. Soft keyboard dismisses / never appears; programmatic re-focus does not restore keyboard.

Simulation: `lib/feed/mobile-sheet-focus-lifecycle.ts` + `npm run test:location-mobile-keyboard`.

## Required operator matrix (still open)

| Runtime | Orientation | Keyboard visible? | City typed? | Postcode typed? | Feed updated? |
|---|---|---|---|---|---|
| Android Capacitor | Portrait | TBD | TBD | TBD | TBD |
| Android Capacitor | Landscape | TBD | TBD | TBD | TBD |
| Android Chrome | Portrait | TBD | TBD | TBD | TBD |
| Android Chrome | Landscape | TBD | TBD | TBD | TBD |
| PWA (if installed) | Portrait | TBD | TBD | TBD | TBD |
| iOS Safari (if supported) | Portrait | TBD | TBD | TBD | TBD |

Instrumentation checklist for operator (DevTools remote):

- `document.activeElement` before/after tap
- `input.matches(':focus')`, `disabled`, `readOnly`, `tabIndex`, `inputMode`, `type`
- inert / aria-hidden ancestors
- `document.elementFromPoint(x,y)` at tap
- focus/blur sequence
- `visualViewport.height` before/after tap
- remount count of `#feed-mobile-place-input`
