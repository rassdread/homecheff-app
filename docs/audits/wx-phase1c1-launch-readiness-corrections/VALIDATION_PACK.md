# Journey / Responsive / Browser / Ownership / Performance / Regression / Rollback

## Journey
Guest open → browse → search field present → filters reachable → Create always present → rotate → Create preserved.

## Responsive
Portrait browse (short strip, bottom Create). Landscape work (collapsed bottom nav, header Create, tools rail, compact filters). Dual-rail laptop+ with one primary Create.

## Browser Proof
`browser-proof.json` · Verdict `WX_PHASE_1C1_PASS` · 7/7 + rotation.

## Ownership
`OWNERSHIP_PRESERVED` — GeoFeed sole owner; planners untouched; remount=0.

## Performance
No new polling/observers; pure layout preference change only; continuity preserved.

## Regression
`npm run test:adaptive-workspace-react` PASS (incl. 1C matrix with start-rail preference).

## Rollback
Do not merge branch. Revert Commit A+B if needed. Production remains 1B.5.9. No DB changes.
