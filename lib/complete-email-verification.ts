import { logEmailSendFailure } from "@/lib/email-log";
import { tryNormalizeEmail } from "@/lib/auth/normalize-email";
import {
  canonicalizeVerificationCredential,
  isSixDigitVerificationCode,
} from "@/lib/verification";
import { verificationUserMessage } from "@/lib/verification-user-messages";
import {
  assertVerificationAttemptAllowed,
  clearVerificationFailures,
  recordVerificationFailure,
} from "@/lib/verification-attempt-limit";

export type VerifiedUserPayload = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: Date | null;
};

export type VerificationFailureCode =
  | "MISSING"
  | "INVALID"
  | "EXPIRED"
  | "RATE_LIMITED"
  | "EMAIL_REQUIRED"
  | "SERVER";

export type CompleteEmailVerificationResult =
  | {
      ok: true;
      message: string;
      code: "VERIFIED" | "ALREADY_VERIFIED";
      user: VerifiedUserPayload;
      welcomeSent: boolean;
    }
  | {
      ok: false;
      error: string;
      code: VerificationFailureCode;
      status: number;
      retryAfterSec?: number;
    };

export type VerificationUserRecord = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  emailVerified: Date | null;
  emailVerificationToken: string | null;
  emailVerificationCode: string | null;
  emailVerificationExpires: Date | null;
  accountDeletedAt: Date | null;
};

export interface VerificationStore {
  findByEmail(email: string): Promise<VerificationUserRecord | null>;
  findByToken(token: string): Promise<VerificationUserRecord | null>;
  claim(id: string, credential: string, now: Date): Promise<number>;
  reload(id: string): Promise<VerificationUserRecord | null>;
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  username: true,
  emailVerified: true,
  emailVerificationToken: true,
  emailVerificationCode: true,
  emailVerificationExpires: true,
  accountDeletedAt: true,
} as const;

function fail(
  code: Exclude<VerificationFailureCode, "SERVER">,
  status: number,
  retryAfterSec?: number,
): CompleteEmailVerificationResult {
  return {
    ok: false,
    code,
    status,
    error: verificationUserMessage(code, "nl", {
      seconds: retryAfterSec,
    }),
    ...(retryAfterSec ? { retryAfterSec } : {}),
  };
}

function successPayload(
  user: VerificationUserRecord,
  code: "VERIFIED" | "ALREADY_VERIFIED",
  welcomeSent: boolean,
): CompleteEmailVerificationResult {
  return {
    ok: true,
    code,
    message: verificationUserMessage(code === "VERIFIED" ? "VERIFIED" : "ALREADY_VERIFIED", "nl"),
    welcomeSent,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
    },
  };
}

function credentialMatches(user: VerificationUserRecord, credential: string): boolean {
  return user.emailVerificationToken === credential || user.emailVerificationCode === credential;
}

function isExpired(user: VerificationUserRecord, now: Date): boolean {
  return !user.emailVerificationExpires || user.emailVerificationExpires.getTime() <= now.getTime();
}

/**
 * Validates a magic-link token or a 6-digit code bound to the submitted email.
 * A code never activates a different account. The claim is a single conditional update.
 */
export async function completeEmailVerificationAgainstStore(
  store: VerificationStore,
  rawCredential: string,
  options?: {
    email?: string | null;
    ip?: string | null;
    now?: Date;
    onClaimed?: (user: VerificationUserRecord) => Promise<void>;
  },
): Promise<CompleteEmailVerificationResult> {
  const credential = canonicalizeVerificationCredential(rawCredential);
  const now = options?.now ?? new Date();
  if (!credential) return fail("MISSING", 400);

  const email = tryNormalizeEmail(options?.email);
  const attempt = { email, ip: options?.ip ?? null, now: now.getTime() };
  const gate = assertVerificationAttemptAllowed(attempt);
  if (!gate.ok) return fail("RATE_LIMITED", 429, gate.retryAfterSec);

  if (isSixDigitVerificationCode(credential) && !email) {
    return fail("EMAIL_REQUIRED", 400);
  }

  const user = isSixDigitVerificationCode(credential)
    ? await store.findByEmail(email as string)
    : await store.findByToken(credential);

  if (!user || user.accountDeletedAt) {
    recordVerificationFailure(attempt);
    return fail("INVALID", 400);
  }

  if (email && user.email.trim().toLowerCase() !== email) {
    recordVerificationFailure(attempt);
    return fail("INVALID", 400);
  }

  if (user.emailVerified && !credentialMatches(user, credential)) {
    return successPayload(user, "ALREADY_VERIFIED", false);
  }

  if (!credentialMatches(user, credential)) {
    recordVerificationFailure(attempt);
    return fail("INVALID", 400);
  }

  if (isExpired(user, now)) {
    return fail("EXPIRED", 400);
  }

  const claimed = await store.claim(user.id, credential, now);
  const updated = (await store.reload(user.id)) ?? user;

  if (claimed > 0) {
    clearVerificationFailures(updated.email);
    let welcomeSent = false;
    if (options?.onClaimed) {
      try {
        await options.onClaimed({ ...updated, emailVerified: updated.emailVerified ?? now });
        welcomeSent = true;
      } catch (emailError) {
        logEmailSendFailure("welcome_after_verify", emailError, {
          recipientEmail: updated.email,
        });
      }
    }
    return successPayload(
      { ...updated, emailVerified: updated.emailVerified ?? now },
      "VERIFIED",
      welcomeSent,
    );
  }

  if (updated.emailVerified) {
    clearVerificationFailures(updated.email);
    return successPayload(updated, "ALREADY_VERIFIED", false);
  }

  recordVerificationFailure(attempt);
  return fail("INVALID", 400);
}

async function prismaStore(): Promise<VerificationStore> {
  const { prisma } = await import("@/lib/prisma");
  const { findUserByCanonicalEmail } = await import("@/lib/auth/find-user-by-email");
  return {
    async findByEmail(email) {
      return findUserByCanonicalEmail(prisma, email, { select: userSelect });
    },
    async findByToken(token) {
      return prisma.user.findFirst({
        where: { emailVerificationToken: token },
        select: userSelect,
      });
    },
    async claim(id, credential, now) {
      const result = await prisma.user.updateMany({
        where: {
          id,
          emailVerificationExpires: { gt: now },
          OR: [{ emailVerificationToken: credential }, { emailVerificationCode: credential }],
        },
        data: {
          emailVerified: now,
          emailVerificationToken: null,
          emailVerificationCode: null,
          emailVerificationExpires: null,
        },
      });
      return result.count;
    },
    async reload(id) {
      return prisma.user.findUnique({ where: { id }, select: userSelect });
    },
  };
}

export function verificationHttpBody(result: CompleteEmailVerificationResult): {
  status: number;
  body: Record<string, unknown>;
} {
  if (!result.ok) {
    return {
      status: result.status,
      body: {
        success: false,
        error: result.error,
        code: result.code,
        ...(result.retryAfterSec ? { retryAfterSec: result.retryAfterSec } : {}),
      },
    };
  }
  return {
    status: 200,
    body: {
      success: true,
      code: result.code,
      message: result.message,
      user: result.user,
    },
  };
}

export async function completeEmailVerificationWithToken(
  token: string,
  options?: { email?: string | null; ip?: string | null },
): Promise<CompleteEmailVerificationResult> {
  try {
    const { sendWelcomeEmail } = await import("@/lib/email");
    return await completeEmailVerificationAgainstStore(await prismaStore(), token, {
      email: options?.email,
      ip: options?.ip,
      onClaimed: async (user) => {
        await sendWelcomeEmail({
          email: user.email,
          name: user.name || user.username || "Gebruiker",
          userId: user.id,
        });
      },
    });
  } catch (e) {
    console.error("completeEmailVerificationWithToken:", e instanceof Error ? e.name : "error");
    return {
      ok: false,
      code: "SERVER",
      status: 500,
      error: "Er is een fout opgetreden bij het verifiëren van je e-mailadres",
    };
  }
}
