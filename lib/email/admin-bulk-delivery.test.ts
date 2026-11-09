/**
 * Admin bulk mail — simulated provider only. Does not call Resend.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  collectAdminBulkAttempts,
  interpretBulkSendResponse,
  reportAdminBulkSend,
} from "./admin-bulk-delivery";
import { sendTransactionalEmail } from "./idempotent-send";
import { EMAIL_PRIORITY } from "./priority";

function ok(msg: string) {
  console.log("  ✓", msg);
}

async function main() {
  const calls: string[] = [];
  const mixed = await collectAdminBulkAttempts(
    [{ email: "one@example.com" }, { email: "two@example.com" }, { email: null }],
    async (email) => {
      calls.push(email);
      if (email.startsWith("one")) return { status: "sent" };
      return { status: "suppressed", reason: "p2_paused" };
    }
  );
  assert.deepEqual(calls, ["one@example.com", "two@example.com"]);
  const partial = reportAdminBulkSend({
    emailRequested: true,
    notificationsSent: 3,
    attempts: mixed,
  });
  assert.equal(partial.success, false);
  assert.equal(partial.outcome, "partial");
  assert.equal(partial.emailsSent, 1);
  assert.equal(partial.emailsSuppressed, 1);
  assert.match(partial.message, /Gedeeltelijk gelukt/);
  assert.match(partial.message, /EMAIL_PAUSE_P2/);
  assert.equal(interpretBulkSendResponse(partial.httpStatus, partial).tone, "partial");
  ok("simulated provider: partial send is not reported as success");

  const allSentAttempts = await collectAdminBulkAttempts(
    [{ email: "a@example.com" }],
    async () => ({ status: "sent" })
  );
  const sent = reportAdminBulkSend({
    emailRequested: true,
    notificationsSent: 1,
    attempts: allSentAttempts,
  });
  assert.equal(sent.success, true);
  assert.equal(sent.outcome, "sent");
  assert.equal(sent.httpStatus, 200);
  assert.match(sent.message, /aangeboden aan de e-mailprovider voor 1 van 1/);
  assert.equal(interpretBulkSendResponse(200, sent).tone, "success");
  ok("simulated provider: full acceptance is the only success");

  const suppressed = reportAdminBulkSend({
    emailRequested: true,
    notificationsSent: 14,
    attempts: Array.from({ length: 14 }, () => ({
      status: "suppressed" as const,
      reason: "p2_paused",
    })),
  });
  assert.equal(suppressed.success, false);
  assert.equal(suppressed.outcome, "failed");
  assert.equal(suppressed.httpStatus, 502);
  assert.match(suppressed.message, /Geen e-mail aangeboden/);
  assert.equal(interpretBulkSendResponse(502, suppressed).tone, "error");
  ok("simulated provider: zero accepted mails stay a failure for 14 recipients");

  const misleading = interpretBulkSendResponse(200, {
    success: true,
    emailsSent: 0,
    notificationsSent: 1,
    message: "Bericht succesvol verzonden naar 1 gebruikers",
  });
  assert.equal(misleading.tone, "error");
  assert.doesNotMatch(misleading.message, /succesvol|aangeboden aan de e-mailprovider/i);
  assert.notEqual(misleading.message.trim(), "");
  ok("HTTP 200 with success and zero sends is not a success message");

  const gate = interpretBulkSendResponse(400, {
    error: "Te veel e-mailontvangers (600). Maximum per actie is 500.",
    code: "HARD_LIMIT",
  });
  assert.equal(gate.tone, "error");
  assert.match(gate.message, /Te veel e-mailontvangers/);
  ok("server error text is shown when there is no success payload");

  const emptyBody = interpretBulkSendResponse(200, {});
  assert.equal(emptyBody.tone, "error");
  assert.notEqual(emptyBody.message.trim(), "");
  ok("empty server body stays a readable error");

  const previous = {
    EMAIL_FORCE_TEST_MODE: process.env.EMAIL_FORCE_TEST_MODE,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
  };
  process.env.EMAIL_FORCE_TEST_MODE = "1";
  process.env.RESEND_API_KEY = "re_test_must_not_send";
  delete process.env.VERCEL_ENV;
  const live = await sendTransactionalEmail({
    to: "founder@example.com",
    subject: "testende",
    html: "<p>testmail</p>",
    eventType: "admin_bulk_message",
    priority: EMAIL_PRIORITY.P2,
    route: "admin/send-bulk-message",
    idempotencyKey: "admin-bulk:test:1",
  });
  assert.equal(live.status, "suppressed");
  const fromPolicy = reportAdminBulkSend({
    emailRequested: true,
    notificationsSent: 1,
    attempts: [{ status: "suppressed", reason: live.reason }],
  });
  assert.equal(fromPolicy.success, false);
  assert.match(fromPolicy.message, /niet aangeboden|onderdrukt/);
  ok("test-mode policy suppresses before Resend and is not a success");

  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  const route = readFileSync(
    resolve(process.cwd(), "app/api/admin/send-bulk-message/route.ts"),
    "utf8"
  );
  assert.match(route, /requireMappedAdminCapability/);
  assert.match(route, /reportAdminBulkSend/);
  assert.doesNotMatch(route, /success:\s*true,\s*\n\s*notificationsSent/);
  const ui = readFileSync(
    resolve(process.cwd(), "components/admin/UserManagement.tsx"),
    "utf8"
  );
  const handler = ui.slice(
    ui.indexOf("const handleBulkMessage"),
    ui.indexOf("const openBulkMessageModal")
  );
  assert.match(handler, /interpretBulkSendResponse/);
  assert.match(handler, /setIsSendingBulkMessage\(false\)/);
  assert.doesNotMatch(handler, /alert\(/);
  ok("send handler shows the server result and always clears Verzenden");

  console.log("\nAdmin bulk delivery tests: PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
