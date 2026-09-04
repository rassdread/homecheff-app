# Company dispatch (MVP)

Manual only — no fleet optimization.

1. Customer selects company provider (fixed company price).
2. `DeliveryOrder.deliveryProfileId` = company profile.
3. OWNER/DISPATCHER calls `POST /api/delivery/company/assign-driver`.
4. `assignedDriverUserId` set; audit row in `DeliveryDriverAssignmentEvent`.
5. **Price unchanged** (`priceChanged: false`).
6. Reassign before terminal status preserves history (from/to driver).

Authorization: `lib/delivery/company-auth.ts` (server-side).
