import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";

type LinkParams = {
  userId: string;
  googleSub: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
};

/**
 * Persist NextAuth-style Account row for Google so dashboards can detect linked provider.
 * Does not reassign a Google sub already linked to another user (safety).
 */
export async function linkGoogleOAuthAccount(
  prisma: PrismaClient,
  params: LinkParams,
): Promise<void> {
  const sub = params.googleSub.trim();
  if (!sub) return;

  const existing = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: sub,
      },
    },
  });

  if (existing) {
    if (existing.userId !== params.userId) {
      return;
    }
    await prisma.account.update({
      where: { id: existing.id },
      data: {
        access_token: params.accessToken ?? existing.access_token,
        refresh_token: params.refreshToken ?? existing.refresh_token,
        expires_at: params.expiresAt ?? existing.expires_at,
      },
    });
    return;
  }

  await prisma.account.create({
    data: {
      id: randomUUID(),
      userId: params.userId,
      type: "oauth",
      provider: "google",
      providerAccountId: sub,
      access_token: params.accessToken ?? null,
      refresh_token: params.refreshToken ?? null,
      expires_at: params.expiresAt ?? null,
    },
  });
}
