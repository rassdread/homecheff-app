/**
 * Transient Prisma pool errors (P2024) must not fail Google OAuth / session minting.
 * Neon + serverless often surfaces "Timed out fetching a new connection from the connection pool".
 */

export function isPrismaPoolTimeout(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  if (code === "P2024") return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /connection pool/i.test(msg) || /Timed out fetching a new connection/i.test(msg);
}

export async function withPrismaRetry<T>(
  fn: () => Promise<T>,
  options?: { attempts?: number; delayMs?: number; label?: string },
): Promise<T> {
  const attempts = options?.attempts ?? 3;
  const delayMs = options?.delayMs ?? 150;
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isPrismaPoolTimeout(err) || i === attempts - 1) throw err;
      console.warn(
        JSON.stringify({
          event: "prisma_pool_retry",
          label: options?.label ?? "prisma",
          attempt: i + 1,
          attempts,
        }),
      );
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw last;
}
