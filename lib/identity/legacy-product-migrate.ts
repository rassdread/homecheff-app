/**
 * Legacy product → canonical HomeCheff User promotion (JIT).
 * Server-only. Never trust client-supplied centralUserId mappings alone —
 * email uniqueness + credential proof (Growth) must hold.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { NEXTAUTH_SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie-name";
import { getNextAuthSharedCookieDomain } from "@/lib/auth-cookie-domain";
import {
  HC_ECO_EPOCH_COOKIE,
  ecosystemEpochCookieOptions,
  newEcosystemEpoch,
} from "@/lib/ecosystem-session/epoch";

export type LegacySourceProduct = "growth" | "studio";

export type LegacyMigrateRequest = {
  sourceProduct: LegacySourceProduct;
  sourceUserId: string;
  email: string;
  /** bcrypt hash from Growth (already verified). Prefer over plaintext. */
  passwordHashBcrypt?: string | null;
  /** plaintext only when Studio scrypt verified and hash cannot be reused */
  passwordPlaintext?: string | null;
  displayName?: string | null;
};

export type LegacyMigrateResult =
  | {
      ok: true;
      outcome:
        | "CREATED_CANONICAL"
        | "LINKED_EXISTING"
        | "ALREADY_LINKED"
        | "HASH_COPIED_TO_EXISTING";
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
        | "CONFIG";
      message: string;
    };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function ticketSecret(): string {
  return (
    process.env.LEGACY_MIGRATE_TICKET_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    ""
  );
}

function isBcryptHash(h: string): boolean {
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(h);
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
    email: normalizeEmail(input.email),
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
      email: normalizeEmail(payload.email),
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

/**
 * Create or link canonical HomeCheff User for a proven legacy product identity.
 * Does not set product.centralUserId (caller DB). Does issue redeem ticket.
 */
export async function migrateLegacyProductIdentity(
  input: LegacyMigrateRequest & {
    returnProduct: LegacySourceProduct;
    returnTo: string;
  },
): Promise<LegacyMigrateResult> {
  const email = normalizeEmail(input.email);
  if (!email.includes("@")) {
    return { ok: false, code: "INVALID_EMAIL", message: "invalid_email" };
  }

  const bcryptHash =
    input.passwordHashBcrypt && isBcryptHash(input.passwordHashBcrypt)
      ? input.passwordHashBcrypt
      : null;
  const plaintext =
    typeof input.passwordPlaintext === "string" && input.passwordPlaintext.length > 0
      ? input.passwordPlaintext
      : null;

  if (!bcryptHash && !plaintext) {
    return {
      ok: false,
      code: "MISSING_CREDENTIAL",
      message: "need_bcrypt_or_plaintext",
    };
  }

  const matches = await prisma.user.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      emailVerified: true,
    },
    take: 3,
  });

  if (matches.length > 1) {
    await prisma.ssoAuditEvent.create({
      data: {
        action: "MIGRATION_SKIPPED_AMBIGUOUS",
        product: input.sourceProduct,
        metadata: { emailDomain: email.split("@")[1] ?? null },
      },
    });
    return { ok: false, code: "AMBIGUOUS", message: "multiple_canonical_same_email" };
  }

  let centralUserId: string;
  let outcome:
    | "CREATED_CANONICAL"
    | "LINKED_EXISTING"
    | "ALREADY_LINKED"
    | "HASH_COPIED_TO_EXISTING";

  if (matches.length === 1) {
    const existing = matches[0]!;
    centralUserId = existing.id;
    if (!existing.passwordHash && (bcryptHash || plaintext)) {
      const hash = bcryptHash ?? (await hashPlaintext(plaintext!));
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: hash },
      });
      outcome = "HASH_COPIED_TO_EXISTING";
    } else {
      outcome = "LINKED_EXISTING";
    }
  } else {
    const hash = bcryptHash ?? (await hashPlaintext(plaintext!));
    const name =
      (input.displayName && input.displayName.trim().slice(0, 120)) ||
      email.split("@")[0] ||
      "HomeCheff";
    const created = await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        name,
        // Proven by legacy credential; leave emailVerified null until stronger signal
        emailVerified: null,
      },
      select: { id: true },
    });
    centralUserId = created.id;
    outcome = "CREATED_CANONICAL";
    await prisma.ssoAuditEvent.create({
      data: {
        action: "PRODUCT_IDENTITY_PROMOTED",
        product: input.sourceProduct,
        centralUserId,
        metadata: {
          sourceUserIdPrefix: input.sourceUserId.slice(0, 8),
          passwordMigration: bcryptHash ? "reuse_bcrypt_hash" : "rehash_from_verified_plaintext",
          migrationVersion: 1,
        },
      },
    });
  }

  await prisma.authIdentityLink.upsert({
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

  await prisma.ssoAuditEvent.create({
    data: {
      action:
        outcome === "CREATED_CANONICAL"
          ? "PRODUCT_IDENTITY_PROMOTED"
          : "PRODUCT_IDENTITY_LINKED",
      product: input.sourceProduct,
      centralUserId,
      metadata: {
        outcome,
        sourceUserIdPrefix: input.sourceUserId.slice(0, 8),
        migrationVersion: 1,
      },
    },
  });

  const redeemTicket = issueLegacyMigrateTicket({
    centralUserId,
    sourceProduct: input.sourceProduct,
    sourceUserId: input.sourceUserId,
    email,
    returnProduct: input.returnProduct,
    returnTo: input.returnTo,
  });

  return { ok: true, outcome, centralUserId, redeemTicket };
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
      metadata: { migrationVersion: 1 },
    },
  });
  return true;
}
