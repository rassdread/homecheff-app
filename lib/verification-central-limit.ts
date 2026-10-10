import { createHash, randomBytes } from "node:crypto";
import {
  assertVerificationAttemptAllowed,
  clearVerificationFailures,
  recordVerificationFailure,
} from "@/lib/verification-attempt-limit";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 8;
const MAX_PER_IP = 30;
const COOLDOWN_MS = 60_000;
const LOCK_MS = 45_000;

export type LimitToken = {
  identifier: string;
  token: string;
  expires: Date;
};

export type LimitTokenStore = {
  countUnexpired(identifier: string, now: Date): Promise<number>;
  oldestExpiry(identifier: string, now: Date): Promise<Date | null>;
  insert(row: LimitToken): Promise<"ok" | "duplicate">;
  deleteExpired(identifier: string, now: Date): Promise<void>;
  deleteIdentifier(identifier: string): Promise<void>;
  findByToken(token: string): Promise<LimitToken | null>;
  deleteToken(token: string): Promise<void>;
  upsert(row: LimitToken): Promise<void>;
};

export type VerificationAttemptInput = {
  email?: string | null;
  ip?: string | null;
  now?: number;
};

export type VerificationAttemptHooks = {
  assert(
    input: VerificationAttemptInput,
  ): Promise<{ ok: true } | { ok: false; retryAfterSec: number }>;
  recordFailure(input: VerificationAttemptInput): Promise<void>;
  clear(email: string): Promise<void>;
};

function pepper(): string {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "homecheff-verification-limit";
}

function digest(kind: string, value: string): string {
  return createHash("sha256").update(`${pepper()}|${kind}|${value}`).digest("hex").slice(0, 40);
}

function emailKey(email: string): string {
  return `hc-vrl:e:${digest("e", email)}`;
}

function ipKey(ip: string): string {
  return `hc-vrl:ip:${digest("ip", ip)}`;
}

function lockToken(email: string): string {
  return `hc-vrs-lock:${digest("lock", email)}`;
}

function coolToken(email: string): string {
  return `hc-vrs-cool:${digest("cool", email)}`;
}

function secondsUntil(expires: Date, now: number): number {
  return Math.max(1, Math.ceil((expires.getTime() - now) / 1000));
}

async function retryFor(
  store: LimitTokenStore,
  identifier: string,
  max: number,
  now: Date,
): Promise<number> {
  const count = await store.countUnexpired(identifier, now);
  if (count < max) return 0;
  const oldest = await store.oldestExpiry(identifier, now);
  if (!oldest) return 0;
  return secondsUntil(oldest, now.getTime());
}

export async function assertCentralAttempts(
  store: LimitTokenStore,
  input: VerificationAttemptInput,
  nowMs = Date.now(),
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const now = new Date(nowMs);
  const email = input.email?.trim().toLowerCase() || "";
  const ip = input.ip?.trim() || "";
  const waits = await Promise.all([
    email ? retryFor(store, emailKey(email), MAX_PER_EMAIL, now) : Promise.resolve(0),
    ip ? retryFor(store, ipKey(ip), MAX_PER_IP, now) : Promise.resolve(0),
  ]);
  const retryAfterSec = Math.max(...waits, 0);
  if (retryAfterSec > 0) return { ok: false, retryAfterSec };
  return { ok: true };
}

async function addFailure(store: LimitTokenStore, identifier: string, now: Date): Promise<void> {
  await store.deleteExpired(identifier, now);
  await store.insert({
    identifier,
    token: `hc-vrl:${randomBytes(16).toString("hex")}`,
    expires: new Date(now.getTime() + WINDOW_MS),
  });
}

export async function recordCentralFailure(
  store: LimitTokenStore,
  input: VerificationAttemptInput,
  nowMs = Date.now(),
): Promise<void> {
  const now = new Date(nowMs);
  const email = input.email?.trim().toLowerCase() || "";
  const ip = input.ip?.trim() || "";
  if (email) await addFailure(store, emailKey(email), now);
  if (ip) await addFailure(store, ipKey(ip), now);
}

export async function clearCentralEmail(store: LimitTokenStore, email: string): Promise<void> {
  const key = email.trim().toLowerCase();
  if (!key) return;
  await store.deleteIdentifier(emailKey(key));
}

export async function beginCentralResend(
  store: LimitTokenStore,
  email: string,
  nowMs = Date.now(),
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const key = email.trim().toLowerCase();
  if (!key) return { ok: true };
  const now = new Date(nowMs);
  const cool = coolToken(key);
  const cooling = await store.findByToken(cool);
  if (cooling && cooling.expires.getTime() > nowMs) {
    return { ok: false, retryAfterSec: secondsUntil(cooling.expires, nowMs) };
  }
  const lock = lockToken(key);
  const placed = await placeLock(store, lock, now);
  if (!placed.ok) return placed;
  return { ok: true };
}

async function placeLock(
  store: LimitTokenStore,
  token: string,
  now: Date,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const row: LimitToken = {
    identifier: token,
    token,
    expires: new Date(now.getTime() + LOCK_MS),
  };
  const first = await store.insert(row);
  if (first === "ok") return { ok: true };
  const existing = await store.findByToken(token);
  if (existing && existing.expires.getTime() > now.getTime()) {
    return { ok: false, retryAfterSec: secondsUntil(existing.expires, now.getTime()) };
  }
  await store.deleteToken(token);
  const second = await store.insert(row);
  if (second === "ok") return { ok: true };
  return { ok: false, retryAfterSec: 5 };
}

export async function endCentralResend(store: LimitTokenStore, email: string): Promise<void> {
  const key = email.trim().toLowerCase();
  if (!key) return;
  await store.deleteToken(lockToken(key));
}

export async function markCentralResendSent(
  store: LimitTokenStore,
  email: string,
  nowMs = Date.now(),
): Promise<void> {
  const key = email.trim().toLowerCase();
  if (!key) return;
  const token = coolToken(key);
  await store.upsert({
    identifier: token,
    token,
    expires: new Date(nowMs + COOLDOWN_MS),
  });
}

async function prismaLimitStore(): Promise<LimitTokenStore> {
  const { prisma } = await import("@/lib/prisma");
  const { Prisma } = await import("@prisma/client");
  return {
    async countUnexpired(identifier, now) {
      return prisma.verificationToken.count({
        where: { identifier, expires: { gt: now } },
      });
    },
    async oldestExpiry(identifier, now) {
      const row = await prisma.verificationToken.findFirst({
        where: { identifier, expires: { gt: now } },
        orderBy: { expires: "asc" },
      });
      return row?.expires ?? null;
    },
    async insert(row) {
      try {
        await prisma.verificationToken.create({ data: row });
        return "ok";
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          return "duplicate";
        }
        throw error;
      }
    },
    async deleteExpired(identifier, now) {
      await prisma.verificationToken.deleteMany({
        where: { identifier, expires: { lt: now } },
      });
    },
    async deleteIdentifier(identifier) {
      await prisma.verificationToken.deleteMany({ where: { identifier } });
    },
    async findByToken(token) {
      return prisma.verificationToken.findUnique({ where: { token } });
    },
    async deleteToken(token) {
      await prisma.verificationToken.deleteMany({ where: { token } });
    },
    async upsert(row) {
      await prisma.verificationToken.upsert({
        where: { token: row.token },
        create: row,
        update: { identifier: row.identifier, expires: row.expires },
      });
    },
  };
}

export function durableVerificationAttempts(): VerificationAttemptHooks {
  return {
    async assert(input) {
      try {
        return await assertCentralAttempts(await prismaLimitStore(), input, input.now ?? Date.now());
      } catch {
        console.error("[verification] central attempt limit unavailable");
        return assertVerificationAttemptAllowed(input);
      }
    },
    async recordFailure(input) {
      try {
        await recordCentralFailure(await prismaLimitStore(), input, input.now ?? Date.now());
      } catch {
        console.error("[verification] central attempt record unavailable");
        recordVerificationFailure(input);
      }
    },
    async clear(email) {
      try {
        await clearCentralEmail(await prismaLimitStore(), email);
      } catch {
        console.error("[verification] central attempt clear unavailable");
        clearVerificationFailures(email);
      }
    },
  };
}

export async function beginDurableResend(
  email: string,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  return beginCentralResend(await prismaLimitStore(), email);
}

export async function endDurableResend(email: string): Promise<void> {
  await endCentralResend(await prismaLimitStore(), email);
}

export async function markDurableResendSent(email: string): Promise<void> {
  await markCentralResendSent(await prismaLimitStore(), email);
}
