# WX Phase 1B.5.6 — Test Evidence

| Suite | Result |
| --- | --- |
| `npm run test:honesty-density-1b56` | PASS — 461 assertions · 11 groups · 7 Mode×density vectors |
| `npm run test:adaptive-workspace-react` | PASS (1B.1–1B.5.6 chain) |
| `npm run build` | PASS |

## Coverage

- EMPTY / SPARSE / NORMAL / DENSE / OVERFLOW
- UNKNOWN (fail-closed)
- NONE / OPTIONAL / RECOMMENDED / REQUIRED
- Boundary: DENSE vs OVERFLOW on tool (persistent + heightDemoted)
- Mixed Workspace modes (browse / compact / hybrid / full / professional)
- Forbidden runtime source patterns
- Layout diagnostics bind without UI apply
- FromPlans integration chain

Fixtures: `lib/adaptive-workspace-react/tests/fixtures/honesty-density-vectors.ts`  
Browser density snapshot matrix: `honesty-density-matrix.json`
