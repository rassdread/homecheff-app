# HomeCheff HC_ONLY seller fee resolver wiring

See Growth `docs/audits/homecheff-hc-only-seller-fee-resolver-wiring.md`.

Canonical resolver lives on Growth. This app calls `/api/internal/marketplace/hc/fee-snapshot` and never duplicates program precedence.

Flags OFF → LEGACY_NO_SNAPSHOT (`resolvePlatformFeeBps`). Flags ON + resolve fail → no order.
