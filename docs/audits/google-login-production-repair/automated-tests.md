# Automated Tests

## Commands

```bash
npm run test:google-login-repair
npx tsx scripts/validate-auth-origin-resolution.ts
npx tsx scripts/validate-google-oauth-client-separation.ts
```

## Results (this branch)

| Suite | Result |
|-------|--------|
| `test:google-login-repair` | PASS (8 + 1 checks) |
| `validate-auth-origin-resolution` | PASS |
| `validate-google-oauth-client-separation` | PASS |

Live Google OAuth is **not** faked in unit tests.
