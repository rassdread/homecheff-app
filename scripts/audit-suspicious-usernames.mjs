#!/usr/bin/env node
/**
 * Read-only audit: list users whose public username looks like a password / test secret.
 * Does NOT print password hashes or raw passwords. Does NOT modify data.
 *
 * Usage: node scripts/audit-suspicious-usernames.mjs
 * Requires: DATABASE_URL (loads .env.local like smoke-check)
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function loadEnvLocal() {
  const p = resolve(root, ".env.local");
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function maskEmail(email) {
  const s = String(email || "");
  const at = s.indexOf("@");
  if (at <= 1) return "***";
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  const vis = local.slice(0, 2);
  return `${vis}***@${domain}`;
}

/** Heuristic: e.g. Test1234 — manual review only (min 3 trailing digits). */
function looksSuspiciousUsername(u) {
  if (!u || typeof u !== "string") return false;
  const t = u.trim();
  if (t.length < 6 || t.length > 24) return false;
  if (/^temp_/i.test(t)) return false;
  if (/^[A-Z][a-z]{1,12}\d{3,}$/.test(t)) return true;
  if (/^(test|password|admin|welcome|qwerty|letmein)[_-]?\d{0,8}$/i.test(t)) return true;
  return false;
}

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set — cannot run audit.");
  process.exit(1);
}

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

try {
  const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const users = await prisma.user.findMany({
    where: {
      username: { not: null },
      createdAt: { gte: since },
    },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const flagged = users.filter((u) => u.username && looksSuspiciousUsername(u.username));

  console.log(`Audited ${users.length} recent users with non-null username (last ~180d, cap 5000).`);
  console.log(`Flagged (heuristic): ${flagged.length}\n`);

  for (const u of flagged) {
    console.log(
      [
        `id=${u.id}`,
        `email=${maskEmail(u.email)}`,
        `username=${u.username}`,
        `createdAt=${u.createdAt.toISOString()}`,
      ].join(" | ")
    );
  }

  if (!flagged.length) {
    console.log("No rows matched heuristics. Adjust script patterns if needed.");
  }
} finally {
  await prisma.$disconnect();
}
