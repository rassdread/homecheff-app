# Security Review

- Web ≠ native client separation preserved
- No secrets via NEXT_PUBLIC (client ids only)
- Strict audience allowlist; no arbitrary audiences
- ID token verify before trust
- No Production env-var leakage in UI
- System-browser fallback uses canonical host OAuth
- Session cookie still server-minted
