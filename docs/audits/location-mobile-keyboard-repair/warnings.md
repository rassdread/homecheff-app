# Warnings

1. **No real-device soft-keyboard proof** in this session → verdict cannot be full PASS.
2. **Capacitor proof needs new APK** after `adjustResize` manifest change.
3. Production headless browsers may hit Vercel security checkpoint — prefer physical device or local/staging.
4. Automated tests assert focus retention only — do not treat as keyboard PASS.
5. iOS Safari not exercised here.
6. Do not merge / deploy / freeze / Formal Review until device matrix is green.
