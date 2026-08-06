# Performance

- No new geocoding loop.
- No new polling.
- Focus retry bounded (≤8 × 60ms).
- Place typing still draft-only until Apply/Enter (no per-keystroke feed remount).
