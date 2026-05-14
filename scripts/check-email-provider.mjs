#!/usr/bin/env node
/**
 * Safe e-mail provider check (no secrets printed).
 * Loads .env.local like other repo scripts (KEY=value, quoted values).
 *
 * Usage:
 *   node scripts/check-email-provider.mjs           # status only
 *   node scripts/check-email-provider.mjs --send  # send test mail (requires vars)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const SEND = process.argv.includes("--send");

function loadEnvLocal() {
  const p = resolve(root, ".env.local");
  if (!existsSync(p)) return { loaded: false };
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
  return { loaded: true };
}

const envInfo = loadEnvLocal();

const SIMPLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFrom(from) {
  const f = String(from || "").trim();
  if (!f) return { ok: false, reason: "empty" };
  const m = f.match(/^(.+)<([^>]+)>\s*$/);
  const addr = m ? m[2].trim() : f;
  if (!SIMPLE_EMAIL.test(addr)) return { ok: false, reason: "invalid_address" };
  return { ok: true };
}

function mask(s) {
  if (!s) return "(empty)";
  if (s.length <= 8) return `${s.length} chars`;
  return `${s.slice(0, 4)}…${s.slice(-2)} (${s.length} chars)`;
}

const hasKey = Boolean(process.env.RESEND_API_KEY?.trim());
const rawFrom =
  process.env.FROM_EMAIL?.trim() ||
  process.env.RESEND_FROM?.trim() ||
  "HomeCheff <noreply@homecheff.eu>";
const fromOk = validateFrom(rawFrom);

const status = {
  envLocalLoaded: envInfo.loaded,
  RESEND_API_KEY: hasKey ? "present" : "missing",
  fromSource: process.env.FROM_EMAIL?.trim()
    ? "FROM_EMAIL"
    : process.env.RESEND_FROM?.trim()
      ? "RESEND_FROM"
      : "default",
  fromHeaderValid: fromOk.ok,
  fromValidationReason: fromOk.ok ? undefined : fromOk.reason,
  fromPreviewDomain: (() => {
    const m = String(rawFrom).match(/@([^>\s]+)/);
    return m ? m[1] : "(no @ in from)";
  })(),
  apiKeyPreview: hasKey ? mask(process.env.RESEND_API_KEY.trim()) : "—",
};

console.log(JSON.stringify({ ok: true, check: "email_provider", status }, null, 2));

if (!SEND) {
  process.exit(hasKey && fromOk.ok ? 0 : 1);
}

if (!hasKey) {
  console.error("Cannot --send: RESEND_API_KEY missing.");
  process.exit(1);
}
if (!fromOk.ok) {
  console.error("Cannot --send: FROM header invalid.");
  process.exit(1);
}

const { Resend } = await import("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const to = process.env.CHECK_EMAIL_TO?.trim();
if (!to || !SIMPLE_EMAIL.test(to)) {
  console.error(
    "Set CHECK_EMAIL_TO in .env.local to a safe test inbox (required for --send).",
  );
  process.exit(1);
}

const { data, error } = await resend.emails.send({
  from: rawFrom,
  to: [to],
  subject: "HomeCheff provider check",
  text: "This is a test message from scripts/check-email-provider.mjs",
});

if (error) {
  console.error(
    JSON.stringify({
      ok: false,
      send: "failed",
      errorName: error.name,
      errorMessage: String(error.message || error).slice(0, 200),
    }),
  );
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, send: "queued", id: data?.id }, null, 2));
process.exit(0);
