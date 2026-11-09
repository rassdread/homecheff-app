/**
 * Admin bulk mail — simulated provider only. Does not call Resend.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { accessDecision, encodeCapabilityGrants } from "../admin/admin-capabilities";
import { resolveAdminRouteCapabilities } from "../admin/admin-route-capabilities";
import {
  attemptFromTransactionalResult,
  collectAdminBulkAttempts,
  interpretBulkSendResponse,
  reportAdminBulkSend,
} from "./admin-bulk-delivery";
import {
  __resetTransactionalEmailIdempotencyForTests,
  __setTransactionalEmailTransportForTests,
  sendTransactionalEmail,
} from "./idempotent-send";
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
  assert.match(route, /if \(!mappedGuard\.ok\) return mappedGuard\.response/);
  assert.match(route, /user\?\.role !== 'ADMIN' && user\?\.role !== 'SUPERADMIN'/);
  assert.match(route, /evaluateAdminEmailBlast/);
  assert.match(route, /confirmEmailBlast/);
  assert.match(route, /prisma\.notification\.create/);
  assert.match(route, /allowDuringP2Pause:\s*true/);
  assert.match(route, /route:\s*'admin\/send-bulk-message'/);
  assert.equal(route.split("allowDuringP2Pause").length - 1, 1);
  const guardAt = route.indexOf("if (!mappedGuard.ok) return mappedGuard.response");
  const noticeAt = route.indexOf("prisma.notification.create");
  const sendAt = route.indexOf("await sendTransactionalEmail");
  assert.ok(guardAt >= 0 && guardAt < noticeAt && noticeAt < sendAt);
  assert.match(route, /reportAdminBulkSend/);
  assert.doesNotMatch(route, /success:\s*true,\s*\n\s*notificationsSent/);

  const requirements = resolveAdminRouteCapabilities("/api/admin/send-bulk-message", "POST");
  assert.deepEqual(requirements, ["GLOBAL.USERS.EDIT"]);
  assert.equal(
    accessDecision({
      role: "USER",
      adminRoles: [],
      permissions: null,
      capability: "GLOBAL.USERS.EDIT",
    }).allow,
    false
  );
  assert.equal(
    accessDecision({
      role: "ADMIN",
      adminRoles: encodeCapabilityGrants(["GROWTH.CAMPAIGNS.MANAGE"]),
      permissions: null,
      capability: "GLOBAL.USERS.EDIT",
    }).allow,
    false
  );
  assert.equal(
    accessDecision({
      role: "ADMIN",
      adminRoles: null,
      permissions: { canEditUsers: false },
      capability: "GLOBAL.USERS.EDIT",
    }).allow,
    false
  );
  assert.equal(
    accessDecision({
      role: "ADMIN",
      adminRoles: encodeCapabilityGrants(["GLOBAL.USERS.EDIT"]),
      permissions: null,
      capability: "GLOBAL.USERS.EDIT",
    }).allow,
    true
  );
  ok("users without the selected-user capability cannot start this send");

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
  assert.match(ui, /Bericht sturen \(\{selectedUsers\.length\}\)/);
  assert.match(ui, /Naar 1 geselecteerde gebruiker/);
  assert.match(ui, /Naar \$\{selectedUsers\.length\} geselecteerde gebruikers/);
  assert.match(ui, /width: 16, height: 16, maxWidth: 16/);
  ok("send handler shows the server result and always clears Verzenden");

  assert.match(route, /allowDuringP2Pause:\s*true/);
  const broadcast = readFileSync(
    resolve(process.cwd(), "app/api/admin/notifications/send/route.ts"),
    "utf8"
  );
  const single = readFileSync(
    resolve(process.cwd(), "app/api/admin/send-message/route.ts"),
    "utf8"
  );
  assert.doesNotMatch(broadcast, /allowDuringP2Pause/);
  assert.doesNotMatch(single, /allowDuringP2Pause/);
  const blast = readFileSync(
    resolve(process.cwd(), "lib/email/admin-blast-guard.ts"),
    "utf8"
  );
  assert.match(blast, /ADMIN_EMAIL_SOFT_MAX = 50/);
  assert.match(blast, /ADMIN_EMAIL_HARD_MAX_DEFAULT = 500/);
  ok("only the selected-user route may bypass the P2 pause");

  const saved = {
    EMAIL_PAUSE_P2: process.env.EMAIL_PAUSE_P2,
    EMAIL_FORCE_TEST_MODE: process.env.EMAIL_FORCE_TEST_MODE,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
  };
  const offered: string[] = [];
  __resetTransactionalEmailIdempotencyForTests();
  __setTransactionalEmailTransportForTests(async ({ to }) => {
    offered.push(to[0]);
    if (to[0].startsWith("refuse")) {
      return { data: null, error: { message: "simulated rejection" } };
    }
    return { data: { id: `sim_${offered.length}` }, error: null };
  });
  try {
    delete process.env.EMAIL_FORCE_TEST_MODE;
    process.env.EMAIL_PAUSE_P2 = "true";
    process.env.VERCEL_ENV = "production";
    process.env.RESEND_API_KEY = "re_simulated_not_a_real_key";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    const paused = await sendTransactionalEmail({
      to: "welcome@example.com",
      from: "HomeCheff <no-reply@homecheff.eu>",
      subject: "Welkom",
      html: "<p>welkom</p>",
      eventType: "welcome",
      priority: EMAIL_PRIORITY.P2,
      route: "sendWelcomeEmail",
    });
    assert.equal(paused.status, "suppressed");
    if (paused.status === "suppressed") assert.equal(paused.reason, "p2_paused");
    assert.deepEqual(offered, []);

    const broadcastPaused = await sendTransactionalEmail({
      to: "broadcast@example.com",
      from: "HomeCheff <no-reply@homecheff.eu>",
      subject: "Iedereen",
      html: "<p>broadcast</p>",
      eventType: "admin_broadcast",
      priority: EMAIL_PRIORITY.P2,
      route: "admin/notifications/send",
      allowDuringP2Pause: true,
    });
    assert.equal(broadcastPaused.status, "suppressed");
    if (broadcastPaused.status === "suppressed") {
      assert.equal(broadcastPaused.reason, "p2_paused");
    }
    assert.deepEqual(offered, []);
    ok("ordinary P2 mail and the broadcast stay paused");

    const accepted = await sendTransactionalEmail({
      to: "selected@example.com",
      from: "HomeCheff <no-reply@homecheff.eu>",
      subject: "testende",
      html: "<p>testmail</p>",
      eventType: "admin_bulk_message",
      priority: EMAIL_PRIORITY.P2,
      route: "admin/send-bulk-message",
      allowDuringP2Pause: true,
      idempotencyKey: "admin-bulk:pause-exception:accepted",
    });
    assert.equal(accepted.status, "sent");
    assert.deepEqual(offered, ["selected@example.com"]);
    const acceptedReport = reportAdminBulkSend({
      emailRequested: true,
      notificationsSent: 1,
      attempts: [attemptFromTransactionalResult(accepted)],
    });
    const acceptedForm = interpretBulkSendResponse(
      acceptedReport.httpStatus,
      acceptedReport
    );
    assert.equal(acceptedForm.tone, "success");
    assert.match(acceptedForm.message, /1 van 1/);
    ok("selected-user mail reaches the simulated provider and the form shows acceptance");

    const refused = await sendTransactionalEmail({
      to: "refuse@example.com",
      from: "HomeCheff <no-reply@homecheff.eu>",
      subject: "testende",
      html: "<p>testmail</p>",
      eventType: "admin_bulk_message",
      priority: EMAIL_PRIORITY.P2,
      route: "admin/send-bulk-message",
      allowDuringP2Pause: true,
      idempotencyKey: "admin-bulk:pause-exception:refused",
    });
    assert.equal(refused.status, "failed");
    assert.deepEqual(offered, ["selected@example.com", "refuse@example.com"]);
    const refusedReport = reportAdminBulkSend({
      emailRequested: true,
      notificationsSent: 1,
      attempts: [attemptFromTransactionalResult(refused)],
    });
    const refusedForm = interpretBulkSendResponse(refusedReport.httpStatus, refusedReport);
    assert.equal(refusedForm.tone, "error");
    assert.match(refusedForm.message, /geweigerd/);
    assert.doesNotMatch(refusedForm.message, /aangeboden aan de e-mailprovider voor/);
    ok("a provider rejection stays an error in the form");

    const second = await sendTransactionalEmail({
      to: "second@example.com",
      from: "HomeCheff <no-reply@homecheff.eu>",
      subject: "testende",
      html: "<p>testmail</p>",
      eventType: "admin_bulk_message",
      priority: EMAIL_PRIORITY.P2,
      route: "admin/send-bulk-message",
      allowDuringP2Pause: true,
      idempotencyKey: "admin-bulk:pause-exception:second",
    });
    const partialForm = interpretBulkSendResponse(
      200,
      reportAdminBulkSend({
        emailRequested: true,
        notificationsSent: 2,
        attempts: [
          attemptFromTransactionalResult(second),
          attemptFromTransactionalResult(refused),
        ],
      })
    );
    assert.equal(partialForm.tone, "partial");
    assert.match(partialForm.message, /Gedeeltelijk gelukt: 1 van 2/);
    assert.match(partialForm.message, /1 geweigerd/);
    ok("a mix of acceptance and rejection is partial success");
  } finally {
    __setTransactionalEmailTransportForTests(null);
    __resetTransactionalEmailIdempotencyForTests();
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  console.log("\nAdmin bulk delivery tests: PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
