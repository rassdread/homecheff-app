import type { Prisma, PrismaClient } from "@prisma/client";
import { tryNormalizeEmail } from "@/lib/auth/normalize-email";

/**
 * Resolve user by canonical email (trim + lowercase), case-insensitive on DB
 * so legacy rows with mixed casing still match.
 */
export async function findUserByCanonicalEmail<T extends Prisma.UserSelect>(
  prisma: PrismaClient,
  emailRaw: unknown,
  options?: { select?: T },
): Promise<Prisma.UserGetPayload<{ select: T }> | null> {
  const normalized = tryNormalizeEmail(emailRaw);
  if (!normalized) return null;

  const select = (options?.select ?? { id: true }) as T;

  return prisma.user.findFirst({
    where: {
      email: { equals: normalized, mode: "insensitive" },
    },
    select,
  }) as Promise<Prisma.UserGetPayload<{ select: T }> | null>;
}
