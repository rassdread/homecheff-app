# HomeCheff V20 production release readiness

PRODUCTION_RELEASE_READY = NO

Blockers:

1. Preview deployment of this branch is not certified yet.
2. Authenticated admin preview of the repaired screens is not certified yet.
3. The new stock and transfer behavior is covered by policy tests. It was not re-run as a new Stripe test payment after the V19 webhook was removed.
4. The seven V19 preview database integration tests were not re-executed in this pass. The 156 previous unit tests and 23 new unit tests passed (179).

Production commit must stay `85b11d6d4708f68760122314a1ace654591f7643`. No production deploy, production database write, or production Stripe write is authorized from this branch.
