#!/usr/bin/env node
/**
 * Read-only: groups users by normalized email (trim + lower) and prints duplicate groups.
 * Does not modify data. Masks local-part of email in output.
 */
import { readFileSync, existsSync } from "node:fs";
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

function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

function maskEmail(email) {
  const n = normalizeEmail(email);
  const at = n.indexOf("@");
  if (at <= 0) return "***";
  const local = n.slice(0, at);
  const domain = n.slice(at + 1);
  const show = local.length <= 2 ? "*" : local.slice(0, 2);
  return `${show}…@${domain}`;
}

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL ontbreekt (.env.local of omgeving).");
  process.exit(1);
}

const { PrismaClient } = await import("@prisma/client");

const prisma = new PrismaClient();

try {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      _count: {
        select: {
          Account: true,
          Listing: true,
          Message: true,
          Favorite: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const groups = new Map();
  for (const u of users) {
    const key = normalizeEmail(u.email);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(u);
  }

  const dups = [...groups.entries()].filter(([, arr]) => arr.length > 1);
  if (dups.length === 0) {
    console.log("Geen dubbele (genormaliseerde) e-mailadressen gevonden.");
    process.exit(0);
  }

  console.log(`Gevonden: ${dups.length} genormaliseerde e-mail(s) met meerdere accounts.\n`);

  for (const [norm, arr] of dups) {
    console.log("---");
    console.log(`Normalized: ${norm}`);
    for (const u of arr) {
      console.log(
        `  id=${u.id}  masked=${maskEmail(u.email)}  username=${u.username ?? "(null)"}  createdAt=${u.createdAt.toISOString()}  accounts=${u._count.Account}  listings=${u._count.Listing}  messages=${u._count.Message}  favorites=${u._count.Favorite}`,
      );
    }
    const sorted = [...arr].sort(
      (a, b) =>
        b._count.Listing +
        b._count.Message +
        b._count.Favorite -
        (a._count.Listing + a._count.Message + a._count.Favorite),
    );
    const primary = sorted[0];
    const secondary = sorted.slice(1);
    console.log(
      `  Suggestie (handmatig): primary candidate id=${primary.id} (hoogste activiteit-som); review secundair: ${secondary.map((s) => s.id).join(", ")}`,
    );
  }
} finally {
  await prisma.$disconnect();
}
