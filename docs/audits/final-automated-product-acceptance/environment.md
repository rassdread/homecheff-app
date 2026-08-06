# Environment

- Live Production base: https://homecheff.eu
- Isolated Playwright contexts (clean cookies per suite)
- Geolocation mocks via Playwright permissions API
- No secrets printed; no Production user/listing mutation
- Artifacts: screenshots under `artifacts/`
- Note: DOM focus ≠ physical keyboard; permission mocks ≠ physical dialogs
