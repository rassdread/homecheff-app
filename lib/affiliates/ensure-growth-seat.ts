import { prisma } from "@/lib/prisma";
import { growthServiceBase } from "@/lib/hc/preview-service-target";

function growthBase() {
  return growthServiceBase() ?? "";
}

function growthSecret() {
  return (
    process.env.HC_ECOSYSTEM_INTERNAL_SECRET?.trim() ||
    process.env.HC_MARKETPLACE_QUOTE_INTERNAL_SECRET?.trim() ||
    process.env.STUDIO_HC_INTERNAL_SECRET?.trim() ||
    process.env.HC_INTERNAL_PROBE_SECRET?.trim() ||
    process.env.GROWTH_INTERNAL_SECRET?.trim() ||
    ""
  );
}

/**
 * Idempotent Growth affiliate seat for the canonical HomeCheff identity.
 * Does not create a Studio adapter and does not rewrite commissions.
 */
export async function ensureGrowthAffiliateCapability(input: {
  centralUserId: string;
  email: string;
  displayName?: string | null;
}): Promise<{ ok: boolean; code?: string }> {
  const secret = growthSecret();
  const base = growthBase();
  if (!secret) return { ok: false, code: "GROWTH_SECRET_MISSING" };
  if (!base) return { ok: false, code: "CONFIGURATION_ERROR" };
  try {
    const res = await fetch(`${base}/api/internal/ecosystem/affiliate/ensure-growth-seat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-hc-ecosystem-internal-secret": secret,
        Authorization: `Bearer ${secret}`,
      },
      cache: "no-store",
      body: JSON.stringify({
        centralUserId: input.centralUserId,
        email: input.email,
        displayName: input.displayName ?? null,
      }),
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; code?: string } | null;
    if (!res.ok || !json?.ok) return { ok: false, code: json?.code ?? "GROWTH_SEAT_FAILED" };
    return { ok: true };
  } catch {
    return { ok: false, code: "GROWTH_UNAVAILABLE" };
  }
}

export async function ensureCapabilitiesForMarketplaceUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      affiliate: { select: { status: true, populationClass: true } },
    },
  });
  const population = user?.affiliate?.populationClass;
  const provisionable = population === "COMMERCIAL" || population === "TECHNICAL";
  if (!user?.email || user.affiliate?.status !== "ACTIVE" || !provisionable) {
    return { ok: false as const, code: "NOT_ACTIVE_AFFILIATE" };
  }
  const link = await prisma.authIdentityLink.findFirst({
    where: { sourceSystem: "homecheff", sourceUserId: user.id, status: "linked" },
    select: { centralUserId: true },
  });
  return ensureGrowthAffiliateCapability({
    centralUserId: link?.centralUserId ?? user.id,
    email: user.email,
    displayName: user.name ?? user.username ?? null,
  });
}
