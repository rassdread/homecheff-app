# Company dispatch (manual MVP)

- OWNER/DISPATCHER assigns via `POST /api/delivery/company/assign-driver`
- Reassign writes `DeliveryDriverAssignmentEvent` (history preserved)
- Customer price locked at checkout; driver change does not alter quote
- Assigned DRIVER updates status via `/delivery/driver` + update-status (access resolver)
- Settlement always to company profile owner (88% of locked gross)
