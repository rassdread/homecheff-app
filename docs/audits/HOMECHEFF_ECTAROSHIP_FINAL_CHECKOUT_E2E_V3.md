# HOMECHEFF_ECTAROSHIP_FINAL_CHECKOUT_E2E_V3

Isolated gate-f DB (`homecheff_gate_f` / `127.0.0.1`) + Stripe TEST + mocked Partner label-create.

## Constraints honored

- Production database writes: NO
- Additional real labels: 0 (real DPD `2179330` previously purchased in V2)
- Production deployment / merge: NO
- Stripe: TEST only (`sk_test_`, `livemode=false`)

## PDF investigation (label 2179330, read-only)

Partner list returns the shipment with tracking; GET/POST probes for label/document/pdf/shipment paths return 404/405.

**Provider limitation:** Partner API does not expose a printable carrier label PDF via documented document endpoints after create. Create response historically had no allowlisted PDF URL. Packing slip ≠ carrier label.

## E2E outcome

See `docs/audits/evidence-ectaroship-final-checkout-e2e-v3/certification.json`.

Mock label-create mirrors verified V2 response shape; never calls real `POST /api/v1/shipping/label`.

Paid orders that fail label create remain `CONFIRMED` with `SHIPMENT_FAILED_RETRYABLE`.
