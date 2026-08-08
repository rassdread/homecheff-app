/**
 * Phase I.2 — central account status for SSO claims.
 */

import { prisma } from "@/lib/prisma";
import { SsoError } from "./constants";

export type AccountStatus = "active" | "disabled" | "suspended" | "deleted";

export type CentralUserForSso = {
  id: string;
  email: string;
  emailVerified: Date | null;
  name: string | null;
  image: string | null;
  profileImage: string | null;
  accountDeletedAt: Date | null;
  suspendedAt: Date | null;
};

export function resolveAccountStatus(user: {
  accountDeletedAt: Date | null;
  suspendedAt: Date | null;
}): AccountStatus {
  if (user.accountDeletedAt) return "deleted";
  if (user.suspendedAt) return "suspended";
  return "active";
}

export async function loadCentralUserOrThrow(centralUserId: string): Promise<CentralUserForSso> {
  const user = await prisma.user.findUnique({
    where: { id: centralUserId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      name: true,
      image: true,
      profileImage: true,
      accountDeletedAt: true,
      suspendedAt: true,
    },
  });
  if (!user || !user.email) {
    throw new SsoError("ACCOUNT_DISABLED");
  }
  return user;
}

export function assertAccountActiveForSso(user: CentralUserForSso): void {
  const status = resolveAccountStatus(user);
  if (status !== "active") {
    throw new SsoError("ACCOUNT_DISABLED");
  }
}

export function toMinimalClaims(user: CentralUserForSso, product: "growth") {
  return {
    iss: "https://homecheff.eu" as const,
    aud: product,
    centralUserId: user.id,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    displayName: user.name,
    image: user.image ?? user.profileImage ?? null,
    accountStatus: resolveAccountStatus(user),
    issuedAt: new Date().toISOString(),
  };
}
