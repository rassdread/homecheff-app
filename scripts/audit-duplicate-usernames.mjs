#!/usr/bin/env node
/**
 * Read-only: groups users by normalized username (trim + lower) when username is set.
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

function normUser(u) {
  if (typeof u !== "string" || !u.trim()) return null;
  return u.trim().toLowerCase();
}

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL ontbreekt.");
  process.exit(1);
}

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

try {
  const users = await prisma.user.findMany({
    where: { username: { not: null } },
    select: { id: true, username: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const groups = new Map();
  for (const u of users) {
    const key = normUser(u.username);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(u);
  }

  const dups = [...groups.entries()].filter(([, arr]) => arr.length > 1);
  if (dups.length === 0) {
    console.log("Geen dubbele (case-insensitive) gebruikersnamen gevonden.");
    process.exit(0);
  }

  console.log(`Gevonden: ${dups.length} gebruikersnaam-groep(en) met meerdere accounts.\n`);
  for (const [key, arr] of dups) {
    console.log("---");
    console.log(`Normalized username: ${key}`);
    for (const u of arr) {
      const mask =
        typeof u.email === "string" && u.email.includes("@")
          ? `${u.email.slice(0, 2)}…@${u.email.split("@")[1]}`
          : "(geen)";
      console.log(
        `  id=${u.id}  username=${u.username}  maskedEmail=${mask}  createdAt=${u.createdAt.toISOString()}`,
      );
    }
  }
} finally {
  await prisma.$disconnect();
}
