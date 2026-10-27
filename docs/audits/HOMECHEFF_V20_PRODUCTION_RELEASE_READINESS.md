# HomeCheff V20 production release readiness

PRODUCTION_RELEASE_READY = NO

Preview deployment: `dpl_46NdLGgvamyrRH8dvu8JymoaavXx`
Preview host: `homecheff-7qhkr80td-sergio-s-projects-f7b64ee1.vercel.app`
Commit: `42867de829a98905ebc6e04a72e656c9ca24b8bb`
Target: none. This is not a production deployment.
State: READY

The local Next.js build exhausted the 4096 MB heap twice after a clean typecheck (699 current, 767 baseline, 0 new). The heap was not raised. The same commit built on the isolated Vercel preview.

An unauthenticated request to the preview webhook is redirected to Vercel Authentication. The preview was not opened to the public.

Blockers:

1. Authenticated admin flows were not exercised. Vercel Authentication stands in front of the preview, and no admin session was created.
2. The stock and transfer recovery rules passed policy tests. They were not re-run as a new Stripe test payment.
3. The seven V19 preview database integration tests were not re-executed. The previous 156 unit tests and 23 new unit tests passed (179).

Production remains `dpl_9Vm1Gy9G6w2U6S2oJCXQRWrmbRtj` at `85b11d6d4708f68760122314a1ace654591f7643`. No production database write, Stripe write, or production deployment was made. No schema migration was added.
