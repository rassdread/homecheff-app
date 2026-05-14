import { prisma } from "@/lib/prisma";

export type DuplicateSignupKind = "google_only" | "password_only" | "both";

/** True when user has a bcrypt password hash (email/password login). */
export function passwordHashLooksLikeBcrypt(
  passwordHash: string | null | undefined,
): boolean {
  if (!passwordHash || typeof passwordHash !== "string") return false;
  const t = passwordHash.trim();
  return t.length >= 50 && t.startsWith("$2");
}

/**
 * Classify existing account for provider-aware duplicate signup messages.
 * - Google-only: linked Google Account row OR no bcrypt (typical social-only user).
 */
export async function getDuplicateSignupKindForUser(
  userId: string,
): Promise<DuplicateSignupKind> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  const googleCount = await prisma.account.count({
    where: { userId, provider: "google" },
  });

  const hasPw = passwordHashLooksLikeBcrypt(user?.passwordHash);
  const hasGoogle = googleCount > 0;

  if (hasGoogle && hasPw) return "both";
  if (hasGoogle) return "google_only";
  if (hasPw) return "password_only";
  return "google_only";
}
