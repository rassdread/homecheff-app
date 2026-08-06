# Mobile web review

## Expected post-fix behaviour (Android Chrome)

- Tap place input → soft keyboard opens (user gesture + retained focus).
- No `preventDefault` on place `pointerdown`/`touchstart`.
- No effect cleanup blur on each keystroke.
- Sheet stays open while typing; viewport resize should not unmount sheet (`open` state unchanged).
- Scrolling the sheet panel does not programmatically blur the place input.

## iOS Safari

Supported if the product currently serves the same sheet. `text-base` (16px) reduces focus-zoom. Device proof still required if iOS is in scope.

## Not proven in CI

Soft keyboard appearance, `visualViewport` height delta, 300ms click delay (modern Chrome is fine).
