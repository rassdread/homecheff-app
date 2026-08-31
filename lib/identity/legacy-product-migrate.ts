/**
 * Legacy product → canonical HomeCheff User promotion (JIT).
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { encode } from "next-auth/jwt";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NEXTAUTH_SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie-name";
import { getNextAuthSharedCookieDomain } from "@/lib/auth-cookie-domain";
import {
  HC_ECO_EPOCH_COOKIE,
  ecosystemEpochCookieOptions,
  newEcosystemEpoch,
} from "@/lib/ecosystem-session/epoch";
import {
  normalizeMigrateEmail,
  resolveCentralFromSiblingLinks,
} from "@/lib/identity/legacy-migrate-core";

export type LegacySourceProduct = "growth" | "studio";

export type LegacyMigrateRequest = {
  sourceProduct: LegacySourceProduct;
  sourceUserId: string;
  email: string;
  /** Verified plaintext — preferred for new canonical bcrypt (never stored in audit). */
  passwordPlaintext?: string | null;
  displayName?: string | null;
};

export type LegacyMigrateResult =
  | {
      ok: true;
      outcome:
        | "CREATED_CANONICAL"
        | "LINKED_EXISTING"
        | "LINKED_VIA_SIBLING"
        | "ALREADY_LINKED"
        | "PASSWORD_SET_ON_EXISTING";
      centralUserId: string;
      redeemTicket: string;
    }
  | {
      ok: false;
      code:
        | "AMBIGUOUS"
        | "EMAIL_CONFLICT"
        | "MISSING_CREDENTIAL"
        | "INVALID_EMAIL"
        | "CONFIG"
        | "ALREADY_LINKED_CONFLICT";
      message: string;
    };

function ticketSecret(): string {
  return (
    process.env.LEGACY_MIGRATE_TICKET_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    ""
  );
}

export function issueLegacyMigrateTicket(input: {
  centralUserId: string;
  sourceProduct: LegacySourceProduct;
  sourceUserId: string;
  email: string;
  returnProduct: LegacySourceProduct;
  returnTo: string;
}): string {
  const secret = ticketSecret();
  if (!secret) throw new Error("ticket_secret_missing");
  const payload = {
    v: 1,
    centralUserId: input.centralUserId,
    sourceProduct: input.sourceProduct,
    sourceUserId: input.sourceUserId,
    email: normalizeMigrateEmail(input.email),
    returnProduct: input.returnProduct,
    returnTo: input.returnTo.startsWith("/") ? input.returnTo : "/growth",
    exp: Date.now() + 120_000,
    nonce: randomBytes(12).toString("hex"),
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export type RedeemedTicket = {
  centralUserId: string;
  sourceProduct: LegacySourceProduct;
  sourceUserId: string;
  email: string;
  returnProduct: LegacySourceProduct;
  returnTo: string;
  nonce: string;
};

export function verifyLegacyMigrateTicket(ticket: string): RedeemedTicket | null {
  const secret = ticketSecret();
  if (!secret) return null;
  const [body, sig] = ticket.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as RedeemedTicket & { exp: number; v: number };
    if (payload.v !== 1) return null;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    if (!payload.centralUserId || !payload.email) return null;
    return {
      centralUserId: payload.centralUserId,
      sourceProduct: payload.sourceProduct,
      sourceUserId: payload.sourceUserId,
      email: normalizeMigrateEmail(payload.email),
      returnProduct: payload.returnProduct,
      returnTo: payload.returnTo,
      nonce: payload.nonce,
    };
  } catch {
    return null;
  }
}

async function hashPlaintext(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 12);
}

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

export async function migrateLegacyProductIdentity(
  input: LegacyMigrateRequest & {
    returnProduct: LegacySourceProduct;
    returnTo: string;
  },
): Promise<LegacyMigrateResult> {
  const email = normalizeMigrateEmail(input.email);
  if (!email.includes("@")) {
    return { ok: false, code: "INVALID_EMAIL", message: "invalid_email" };
  }

  const plaintext =
    typeof input.passwordPlaintext === "string" && input.passwordPlaintext.length > 0
      ? input.passwordPlaintext
      : null;

  if (!plaintext) {
    return {
      ok: false,
      code: "MISSING_CREDENTIAL",
      message: "verified_plaintext_required",
    };
  }

  // Idempotent: this product row already linked
  const existingLink = await prisma.authIdentityLink.findUnique({
    where: {
      sourceSystem_sourceUserId: {
        sourceSystem: input.sourceProduct,
        sourceUserId: input.sourceUserId,
      },
    },
    select: { centralUserId: true, status: true },
  });
  if (existingLink?.status === "linked") {
    const redeemTicket = issueLegacyMigrateTicket({
      centralUserId: existingLink.centralUserId,
      sourceProduct: input.sourceProduct,
      sourceUserId: input.sourceUserId,
      email,
      returnProduct: input.returnProduct,
      returnTo: input.returnTo,
    });
    await prisma.ssoAuditEvent.create({
      data: {
        action: "MIGRATION_ALREADY_COMPLETE",
        product: input.sourceProduct,
        centralUserId: existingLink.centralUserId,
        metadata: { sourceUserIdPrefix: input.sourceUserId.slice(0, 8) },
      },
    });
    return {
      ok: true,
      outcome: "ALREADY_LINKED",
      centralUserId: existingLink.centralUserId,
      redeemTicket,
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const hcMatches = await tx.user.findMany({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, email: true, passwordHash: true },
        take: 3,
      });

      if (hcMatches.length > 1) {
        throw new Error("AMBIGUOUS:multiple_canonical");
      }

      const siblingLinks = await tx.authIdentityLink.findMany({
        where: { sourceEmailNormalized: email, status: "linked" },
        select: { centralUserId: true, sourceSystem: true },
      });
      const siblingCentral = resolveCentralFromSiblingLinks(siblingLinks);

      let centralUserId: string;
      let outcome:
        | "CREATED_CANONICAL"
        | "LINKED_EXISTING"
        | "LINKED_VIA_SIBLING"
        | "PASSWORD_SET_ON_EXISTING";

      if (hcMatches.length === 1) {
        centralUserId = hcMatches[0]!.id;
        outcome = "LINKED_EXISTING";
        if (!hcMatches[0]!.passwordHash) {
          const hash = await hashPlaintext(plaintext);
          await tx.user.update({
            where: { id: centralUserId },
            data: { passwordHash: hash },
          });
          outcome = "PASSWORD_SET_ON_EXISTING";
        }
      } else if (siblingCentral && "centralUserId" in siblingCentral) {
        centralUserId = siblingCentral.centralUserId;
        outcome = "LINKED_VIA_SIBLING";
        const hc = await tx.user.findUnique({
          where: { id: centralUserId },
          select: { passwordHash: true },
        });
        if (!hc?.passwordHash) {
          const hash = await hashPlaintext(plaintext);
          await tx.user.update({
            where: { id: centralUserId },
            data: { passwordHash: hash },
          });
          outcome = "PASSWORD_SET_ON_EXISTING";
        }
      } else if (siblingCentral && "ambiguous" in siblingCentral) {
        throw new Error("AMBIGUOUS:sibling_links");
      } else {
        const hash = await hashPlaintext(plaintext);
        const name =
          (input.displayName && input.displayName.trim().slice(0, 120)) ||
          email.split("@")[0] ||
          "HomeCheff";
        const created = await tx.user.create({
          data: {
            email,
            passwordHash: hash,
            name,
            emailVerified: null,
          },
          select: { id: true },
        });
        centralUserId = created.id;
        outcome = "CREATED_CANONICAL";
      }

      await tx.authIdentityLink.upsert({
        where: {
          sourceSystem_sourceUserId: {
            sourceSystem: input.sourceProduct,
            sourceUserId: input.sourceUserId,
          },
        },
        create: {
          centralUserId,
          sourceSystem: input.sourceProduct,
          sourceUserId: input.sourceUserId,
          sourceEmailNormalized: email,
          status: "linked",
        },
        update: {
          centralUserId,
          sourceEmailNormalized: email,
          status: "linked",
          conflictCode: null,
        },
      });

      const auditAction =
        outcome === "CREATED_CANONICAL"
          ? "PRODUCT_IDENTITY_PROMOTED"
          : outcome === "LINKED_VIA_SIBLING"
            ? "CROSS_PRODUCT_IDENTITY_LINKED"
            : "PRODUCT_IDENTITY_LINKED";

      await tx.ssoAuditEvent.create({
        data: {
          action: auditAction,
          product: input.sourceProduct,
          centralUserId,
          metadata: {
            outcome,
            sourceUserIdPrefix: input.sourceUserId.slice(0, 8),
            passwordMigration: "rehash_from_verified_plaintext",
            migrationVersion: 2,
          },
        },
      });

      if (outcome === "CREATED_CANONICAL") {
        await tx.ssoAuditEvent.create({
          data: {
            action: "LEGACY_AUTH_RETIRED",
            product: input.sourceProduct,
            centralUserId,
            metadata: {
              note: "canonical_credential_authoritative",
              migrationVersion: 2,
            },
          },
        });
      }

      return { centralUserId, outcome };
    });

    const redeemTicket = issueLegacyMigrateTicket({
      centralUserId: result.centralUserId,
      sourceProduct: input.sourceProduct,
      sourceUserId: input.sourceUserId,
      email,
      returnProduct: input.returnProduct,
      returnTo: input.returnTo,
    });

    return {
      ok: true,
      outcome: result.outcome,
      centralUserId: result.centralUserId,
      redeemTicket,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("AMBIGUOUS")) {
      await prisma.ssoAuditEvent.create({
        data: {
          action: "MIGRATION_SKIPPED_AMBIGUOUS",
          product: input.sourceProduct,
          metadata: { reason: msg.slice(0, 120) },
        },
      });
      return { ok: false, code: "AMBIGUOUS", message: msg };
    }
    if (isUniqueViolation(err)) {
      const raced = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, passwordHash: true },
      });
      if (!raced) {
        return {
          ok: false,
          code: "EMAIL_CONFLICT",
          message: "concurrent_create_collision",
        };
      }
      await prisma.authIdentityLink.upsert({
        where: {
          sourceSystem_sourceUserId: {
            sourceSystem: input.sourceProduct,
            sourceUserId: input.sourceUserId,
          },
        },
        create: {
          centralUserId: raced.id,
          sourceSystem: input.sourceProduct,
          sourceUserId: input.sourceUserId,
          sourceEmailNormalized: email,
          status: "linked",
        },
        update: {
          centralUserId: raced.id,
          sourceEmailNormalized: email,
          status: "linked",
        },
      });
      const redeemTicket = issueLegacyMigrateTicket({
        centralUserId: raced.id,
        sourceProduct: input.sourceProduct,
        sourceUserId: input.sourceUserId,
        email,
        returnProduct: input.returnProduct,
        returnTo: input.returnTo,
      });
      return {
        ok: true,
        outcome: "LINKED_EXISTING",
        centralUserId: raced.id,
        redeemTicket,
      };
    }
    await prisma.ssoAuditEvent.create({
      data: {
        action: "MIGRATION_FAILED",
        product: input.sourceProduct,
        metadata: { reason: msg.slice(0, 120) },
      },
    });
    throw err;
  }
}

const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;

export async function mintCanonicalSessionCookies(centralUserId: string): Promise<{
  sessionCookie: string;
  epochCookie: string;
  epoch: string;
} | null> {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) return null;

  const user = await prisma.user.findUnique({
    where: { id: centralUserId },
    select: { id: true, email: true, role: true },
  });
  if (!user?.email) return null;

  const encoded = await encode({
    secret,
    token: {
      email: user.email.toLowerCase().substring(0, 100),
      sub: user.id,
      id: user.id,
      role: user.role,
    },
    maxAge: SESSION_MAX_AGE_SEC,
  });

  const isProd = process.env.NODE_ENV === "production";
  const domain = getNextAuthSharedCookieDomain();
  const sessionParts = [
    `${NEXTAUTH_SESSION_COOKIE_NAME}=${encoded}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SEC}`,
  ];
  if (isProd) sessionParts.push("Secure");
  if (domain) sessionParts.push(`Domain=${domain}`);

  const epoch = newEcosystemEpoch();
  const epochOpts = ecosystemEpochCookieOptions(SESSION_MAX_AGE_SEC);
  const epochParts = [
    `${HC_ECO_EPOCH_COOKIE}=${epoch}`,
    "Path=/",
    "HttpOnly",
    `SameSite=${epochOpts.sameSite}`,
    `Max-Age=${epochOpts.maxAge}`,
  ];
  if (epochOpts.secure) epochParts.push("Secure");
  if (epochOpts.domain) epochParts.push(`Domain=${epochOpts.domain}`);

  return {
    sessionCookie: sessionParts.join("; "),
    epochCookie: epochParts.join("; "),
    epoch,
  };
}

export async function markTicketRedeemed(nonce: string, centralUserId: string): Promise<boolean> {
  const existing = await prisma.ssoAuditEvent.findFirst({
    where: {
      action: "LEGACY_MIGRATE_TICKET_REDEEMED",
      codeId: nonce,
    },
    select: { id: true },
  });
  if (existing) return false;
  await prisma.ssoAuditEvent.create({
    data: {
      action: "LEGACY_MIGRATE_TICKET_REDEEMED",
      centralUserId,
      codeId: nonce,
      metadata: { migrationVersion: 2 },
    },
  });
  return true;
}

/** SAFE_AUTO_LINK: link product row to existing canonical (no password proof). */
export async function safeAutoLinkProductIdentity(input: {
  sourceProduct: LegacySourceProduct;
  sourceUserId: string;
  email: string;
  centralUserId: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const email = normalizeMigrateEmail(input.email);
  const hc = await prisma.user.findUnique({
    where: { id: input.centralUserId },
    select: { id: true, email: true },
  });
  if (!hc || normalizeMigrateEmail(hc.email) !== email) {
    return { ok: false, code: "EMAIL_CONFLICT" };
  }

  await prisma.authIdentityLink.upsert({
    where: {
      sourceSystem_sourceUserId: {
        sourceSystem: input.sourceProduct,
        sourceUserId: input.sourceUserId,
      },
    },
    create: {
      centralUserId: input.centralUserId,
      sourceSystem: input.sourceProduct,
      sourceUserId: input.sourceUserId,
      sourceEmailNormalized: email,
      status: "linked",
    },
    update: {
      centralUserId: input.centralUserId,
      sourceEmailNormalized: email,
      status: "linked",
    },
  });

  await prisma.ssoAuditEvent.create({
    data: {
      action: "PRODUCT_IDENTITY_LINKED",
      product: input.sourceProduct,
      centralUserId: input.centralUserId,
      metadata: {
        linkMethod: "safe_auto_link_batch",
        sourceUserIdPrefix: input.sourceUserId.slice(0, 8),
      },
    },
  });

  return { ok: true };
}
