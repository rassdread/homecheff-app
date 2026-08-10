/**
 * Incident: HomeCheff Production Google auth redirect/reload loop (2026-08-10).
 * Read-only forensics + smallest safe fix notes.
 */

import assert from "node:assert/strict";
import { isPrismaPoolTimeout, withPrismaRetry } from "../lib/auth/prisma-retry";

function ok(msg: string) {
  console.log("  ✓", msg);
}

async function main() {
  assert.equal(isPrismaPoolTimeout({ code: "P2024" }), true);
  assert.equal(isPrismaPoolTimeout(new Error("Timed out fetching a new connection from the connection pool")), true);
  assert.equal(isPrismaPoolTimeout({ code: "P2002" }), false);
  ok("P2024 detection");

  let n = 0;
  const value = await withPrismaRetry(
    async () => {
      n += 1;
      if (n < 3) {
        const err = Object.assign(new Error("pool"), { code: "P2024" });
        throw err;
      }
      return "ok";
    },
    { attempts: 3, delayMs: 1, label: "test" },
  );
  assert.equal(value, "ok");
  assert.equal(n, 3);
  ok("withPrismaRetry recovers after transient P2024");

  await assert.rejects(
    () =>
      withPrismaRetry(
        async () => {
          throw Object.assign(new Error("unique"), { code: "P2002" });
        },
        { attempts: 3, delayMs: 1 },
      ),
    (e: unknown) => e instanceof Error && (e as { code?: string }).code === "P2002",
  );
  ok("non-pool errors are not retried");

  console.log("\nGoogle auth incident unit checks: PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
