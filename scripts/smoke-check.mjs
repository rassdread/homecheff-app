#!/usr/bin/env node
/**
 * Pre-commit / Riedel smoke checks: schema, env presence, DB ping, critical routes (build-time).
 * Geen echte browser-E2E (inlog/stripe checkout/upload) — die blijven handmatig of CI met secrets.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
process.chdir(root);

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

loadEnvLocal();

const errors = [];
const ok = (msg) => console.log(`\x1b[32m✓\x1b[0m ${msg}`);
const fail = (msg) => {
  console.log(`\x1b[31m✗\x1b[0m ${msg}`);
  errors.push(msg);
};

console.log("\n\x1b[36mHomeCheff smoke-check\x1b[0m (schema, env, DB, route files)\n");

// 1) Prisma schema
try {
  execSync("npx prisma validate", { stdio: "inherit", cwd: root });
  ok("prisma validate");
} catch {
  fail("prisma validate");
}

// 2) Auth / Stripe / upload — alleen aanwezigheid (geen waarden)
const required = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
];
const recommended = [
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "BLOB_READ_WRITE_TOKEN",
  "RESEND_API_KEY",
];
for (const k of required) {
  if (process.env[k] && String(process.env[k]).length > 0) ok(`env ${k} gezet`);
  else fail(`env ${k} ontbreekt of leeg`);
}
for (const k of recommended) {
  if (process.env[k] && String(process.env[k]).length > 0) ok(`env ${k} gezet (aanbevolen)`);
  else console.log(`\x1b[33m○\x1b[0m env ${k} ontbreekt — upload/stripe/e-mail in prod kan falen`);
}

// 3) DB ping
if (process.env.DATABASE_URL) {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    ok("database bereikbaar (SELECT 1)");
  } catch (e) {
    fail(`database ping: ${e?.message || e}`);
  }
}

// 4) Kritieke app-routes bestaan (statisch)
const routes = [
  "app/api/auth/[...nextauth]/route.ts",
  "app/api/auth/native/google/route.ts",
  "app/api/register/route.ts",
  "app/api/checkout/session/route.ts",
  "app/api/stripe/webhook/route.ts",
  "app/api/upload/route.ts",
  "app/api/upload/video-token/route.ts",
  "app/login/page.tsx",
  "app/register/page.tsx",
];
for (const rel of routes) {
  const abs = resolve(root, rel);
  if (existsSync(abs)) ok(`route file ${rel}`);
  else fail(`ontbreekt: ${rel}`);
}

// 5) next build al gedraaid? — alleen hint
if (existsSync(resolve(root, ".next/BUILD_ID"))) {
  ok(".next/BUILD_ID bestaat (recent build?)");
} else {
  console.log("\x1b[33m○\x1b[0m Geen .next/BUILD_ID — voer npm run build uit voor volledige check");
}

console.log("\n" + "─".repeat(60));
if (errors.length) {
  console.log(`\x1b[31m${errors.length} fout(en)\x1b[0m — fix env/schema/DB voordat je pusht.\n`);
  process.exit(1);
}
console.log(
  "\x1b[32mSmoke-check geslaagd.\x1b[0m Handmatig nog testen: inloggen, registreren, checkout (testkaart), foto- en video-upload in UI.\n"
);
process.exit(0);
