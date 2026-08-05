# Ownership Verification

Authentication remains owned by NextAuth (`lib/auth.ts` + `/api/auth/*`).

Consumers only (unchanged ownership):
- Workspace / GeoFeed / chat / proposal / commerce UI read session via `useSession` / `getServerSession` / guards.

No second auth system introduced.
