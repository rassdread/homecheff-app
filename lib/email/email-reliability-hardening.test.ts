/**
 * Email reliability hardening — unit/contract tests (no live Resend).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextRequest } from "next/server";

function ok(msg: string) {
  console.log("  ✓", msg);
}

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

async function main() {
  // --- Cron auth ---
  {
    const { authorizeCronRequest } = await import("./cron-auth");
    const prev = process.env.CRON_SECRET;
    const prevNode = process.env.NODE_ENV;

    process.env.CRON_SECRET = "test-cron-secret";
    (process.env as { NODE_ENV?: string }).NODE_ENV = "production";

    const missing = new NextRequest("https://example.com/api/cron/send-notifications", {
      method: "GET",
    });
    assert.equal(authorizeCronRequest(missing), false);
    ok("CRON missing secret → rejected");

    const wrong = new NextRequest("https://example.com/api/cron/send-notifications", {
      method: "GET",
      headers: { authorization: "Bearer wrong" },
    });
    assert.equal(authorizeCronRequest(wrong), false);
    ok("CRON incorrect secret → rejected");

    const good = new NextRequest("https://example.com/api/cron/send-notifications", {
      method: "GET",
      headers: { authorization: "Bearer test-cron-secret" },
    });
    assert.equal(authorizeCronRequest(good), true);
    ok("CRON correct secret → accepted");

    const queryLeak = new NextRequest(
      "https://example.com/api/cron/send-notifications?secret=test-cron-secret",
      { method: "GET" }
    );
    assert.equal(authorizeCronRequest(queryLeak), false);
    ok("CRON query-string secret does not authorize");

    if (prev === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prev;
    if (prevNode === undefined) delete (process.env as { NODE_ENV?: string }).NODE_ENV;
    else (process.env as { NODE_ENV?: string }).NODE_ENV = prevNode;

    const cronRoute = read("app/api/cron/send-notifications/route.ts");
    assert.match(cronRoute, /authorizeCronRequest/);
    assert.match(cronRoute, /status: 401/);
    ok("send-notifications route uses cron auth");

    const shiftCron = read("app/api/cron/schedule-shift-notifications/route.ts");
    assert.match(shiftCron, /authorizeCronRequest/);
    ok("schedule-shift-notifications also protected");
  }

  // --- Env isolation ---
  {
    const mod = await import("./env-policy");
    const snap: Record<string, string | undefined> = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      RESEND_PREVIEW_API_KEY: process.env.RESEND_PREVIEW_API_KEY,
      RESEND_ALLOW_PREVIEW_SEND: process.env.RESEND_ALLOW_PREVIEW_SEND,
      RESEND_ALLOW_DEV_SEND: process.env.RESEND_ALLOW_DEV_SEND,
      EMAIL_FORCE_TEST_MODE: process.env.EMAIL_FORCE_TEST_MODE,
    };

    process.env.EMAIL_FORCE_TEST_MODE = "1";
    process.env.RESEND_API_KEY = "re_prod_fake";
    assert.equal(mod.resolveEmailSendPolicy().allow, false);
    ok("test environment suppresses real mail");
    delete process.env.EMAIL_FORCE_TEST_MODE;

    process.env.VERCEL_ENV = "preview";
    (process.env as { NODE_ENV?: string }).NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_prod_fake";
    delete process.env.RESEND_PREVIEW_API_KEY;
    delete process.env.RESEND_ALLOW_PREVIEW_SEND;
    const previewBlock = mod.resolveEmailSendPolicy();
    assert.equal(previewBlock.allow, false);
    ok("Preview cannot silently send via Production key");

    process.env.RESEND_ALLOW_PREVIEW_SEND = "1";
    process.env.RESEND_PREVIEW_API_KEY = "re_prod_fake";
    assert.equal(mod.resolveEmailSendPolicy().allow, false);
    ok("Preview blocked when preview key equals production key");

    process.env.RESEND_PREVIEW_API_KEY = "re_preview_dedicated";
    assert.equal(mod.resolveEmailSendPolicy().allow, true);
    assert.equal(mod.resolveResendApiKeyForSend(), "re_preview_dedicated");
    ok("Preview allowed only with dedicated key");

    process.env.VERCEL_ENV = "production";
    delete process.env.RESEND_PREVIEW_API_KEY;
    delete process.env.RESEND_ALLOW_PREVIEW_SEND;
    process.env.RESEND_API_KEY = "re_prod_fake";
    assert.equal(mod.resolveEmailSendPolicy().allow, true);
    ok("Production allows transactional key");

    for (const [k, v] of Object.entries(snap)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }

  // --- Admin blast ---
  {
    const {
      evaluateAdminEmailBlast,
      claimAdminBroadcastIdempotencyKey,
      __resetAdminBroadcastIdempotencyForTests,
      ADMIN_EMAIL_HARD_MAX_DEFAULT,
    } = await import("./admin-blast-guard");

    __resetAdminBroadcastIdempotencyForTests();

    const small = evaluateAdminEmailBlast({
      sendEmail: true,
      emailRecipientCount: 10,
      targetType: "sellers",
    });
    assert.equal(small.ok, true);
    ok("small audience does not require confirm");

    const needsConfirm = evaluateAdminEmailBlast({
      sendEmail: true,
      emailRecipientCount: 120,
      targetType: "all",
      confirmEmailBlast: false,
    });
    assert.equal(needsConfirm.ok, false);
    if (!needsConfirm.ok) assert.equal(needsConfirm.code, "CONFIRM_REQUIRED");
    ok("large audience requires explicit confirm");

    const withConfirmNoKey = evaluateAdminEmailBlast({
      sendEmail: true,
      emailRecipientCount: 120,
      targetType: "all",
      confirmEmailBlast: true,
    });
    assert.equal(withConfirmNoKey.ok, false);
    if (!withConfirmNoKey.ok) assert.equal(withConfirmNoKey.code, "MISSING_IDEMPOTENCY");
    ok("large audience requires idempotency key");

    const hard = evaluateAdminEmailBlast({
      sendEmail: true,
      emailRecipientCount: ADMIN_EMAIL_HARD_MAX_DEFAULT + 1,
      targetType: "all",
      confirmEmailBlast: true,
      idempotencyKey: "k1",
    });
    assert.equal(hard.ok, false);
    if (!hard.ok) assert.equal(hard.code, "HARD_LIMIT");
    ok("hard per-operation limit blocks oversized blast");

    assert.equal(claimAdminBroadcastIdempotencyKey("blast-1"), true);
    assert.equal(claimAdminBroadcastIdempotencyKey("blast-1"), false);
    ok("accidental double-submit blocked by broadcast idempotency");
  }

  // --- Idempotent send (local de-dupe + P2 pause) ---
  {
    process.env.EMAIL_FORCE_TEST_MODE = "1";
    const {
      sendTransactionalEmail,
      __resetTransactionalEmailIdempotencyForTests,
    } = await import("./idempotent-send");
    const { EMAIL_PRIORITY } = await import("./priority");

    __resetTransactionalEmailIdempotencyForTests();

    const a = await sendTransactionalEmail({
      to: "a@example.com",
      subject: "t",
      html: "<p>x</p>",
      eventType: "order_paid",
      priority: EMAIL_PRIORITY.P0,
      idempotencyKey: "order-paid:o1:u1",
    });
    assert.equal(a.status, "suppressed");
    ok("test mode: no real mail for Stripe-like event");

    delete process.env.EMAIL_FORCE_TEST_MODE;
    process.env.VERCEL_ENV = "production";
    (process.env as { NODE_ENV?: string }).NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test_not_used_if_paused";
    process.env.EMAIL_PAUSE_P2 = "1";

    const p2 = await sendTransactionalEmail({
      to: "b@example.com",
      subject: "welcome",
      html: "<p>x</p>",
      eventType: "welcome",
      priority: EMAIL_PRIORITY.P2,
      idempotencyKey: "welcome:u1",
    });
    assert.equal(p2.status, "suppressed");
    assert.equal(p2.suppressed && "reason" in p2 ? p2.reason : "", "p2_paused");
    ok("EMAIL_PAUSE_P2 suppresses P2 without blocking architecture for P0");

    delete process.env.EMAIL_PAUSE_P2;
    delete process.env.VERCEL_ENV;
    delete process.env.RESEND_API_KEY;
    process.env.EMAIL_FORCE_TEST_MODE = "1";
  }

  // --- Source contracts: intentional resend + verify + contact ---
  {
    const emailLib = read("lib/email.ts");
    assert.match(emailLib, /intentionalResend:\s*true/);
    assert.match(emailLib, /password-reset:/);
    assert.match(emailLib, /email-verification:/);
    assert.match(emailLib, /welcome:/);
    ok("intentional resend paths preserved with distinct keys");

    const verify = read("lib/complete-email-verification.ts");
    assert.match(verify, /updateMany/);
    assert.match(verify, /claimed\.count\s*>\s*0/);
    assert.match(verify, /sendWelcomeEmail/);
    ok("verify welcome only on atomic claim");

    const contact = read("app/api/contact/route.ts");
    assert.match(contact, /contact_support/);
    assert.match(contact, /contact_confirmation/);
    assert.match(contact, /sendTransactionalEmail/);
    ok("contact still sends support + confirmation (2 emails)");

    const adminSend = read("app/api/admin/notifications/send/route.ts");
    assert.match(adminSend, /evaluateAdminEmailBlast/);
    assert.match(adminSend, /dryRun/);
    assert.match(adminSend, /confirmEmailBlast/);
    ok("admin notifications route guarded");

    const notif = read("lib/notifications/notification-service.ts");
    assert.match(notif, /order-paid:/);
    assert.match(notif, /payment-received:/);
    assert.match(notif, /sendTransactionalEmail/);
    ok("Stripe/order paid notifications carry idempotency keys");
  }

  console.log("\nEmail reliability hardening tests: PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
