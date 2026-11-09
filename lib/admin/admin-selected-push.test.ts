/**
 * Selected-user push. The sender is a local stand-in and does not call Firebase.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  __setSelectedUserPushForTests,
  sendSelectedUserPush,
} from "./admin-selected-push";
import {
  interpretBulkSendResponse,
  reportAdminBulkSend,
} from "../email/admin-bulk-delivery";

function ok(msg: string) {
  console.log("  ✓", msg);
}

const token = "f".repeat(40);
const other = "a".repeat(40);

async function sendCase(
  tokens: Array<{ token: string }>,
  send: ((token: string) => Promise<void>) | null
) {
  const calls: string[] = [];
  __setSelectedUserPushForTests({
    tokens,
    send: send
      ? async (value) => {
          calls.push(value);
          await send(value);
        }
      : null,
  });
  const push = await sendSelectedUserPush({
    userIds: ["user-1"],
    title: "testins",
    body: "Een vrije testtekst",
    broadcastId: "broadcast-1",
  });
  return { push, calls };
}

async function main() {
  const none = await sendCase([{ token: "short" }], async () => undefined);
  assert.equal(none.push.status, "no_device");
  assert.deepEqual(none.calls, []);
  const noneForm = interpretBulkSendResponse(
    200,
    reportAdminBulkSend({
      emailRequested: false,
      notificationsSent: 1,
      attempts: [],
      push: none.push,
    })
  );
  assert.equal(noneForm.tone, "partial");
  assert.match(noneForm.lines.join("\n"), /In-app: melding opgeslagen voor 1 gebruiker/);
  assert.match(noneForm.lines.join("\n"), /Push: geen geschikt apparaat geregistreerd/);
  assert.match(noneForm.lines.join("\n"), /E-mail: niet verstuurd/);
  ok("no suitable device is distinct and does not call the push service");

  const offered = await sendCase([{ token }, { token: other }], async () => undefined);
  assert.equal(offered.push.status, "offered");
  assert.deepEqual(offered.calls, [token, other]);
  const offeredReport = reportAdminBulkSend({
    emailRequested: false,
    notificationsSent: 1,
    attempts: [],
    push: offered.push,
  });
  const offeredForm = interpretBulkSendResponse(offeredReport.httpStatus, offeredReport);
  assert.equal(offeredForm.tone, "success");
  assert.match(offeredForm.message, /aangeboden aan de pushdienst voor 2 apparaten/);
  ok("two devices are offered to the simulated push service");

  const refused = await sendCase([{ token }], async () => {
    throw new Error("simulated rejection");
  });
  assert.equal(refused.push.status, "failed");
  assert.deepEqual(refused.calls, [token]);
  const refusedForm = interpretBulkSendResponse(
    502,
    reportAdminBulkSend({
      emailRequested: false,
      notificationsSent: 1,
      attempts: [],
      push: refused.push,
    })
  );
  assert.equal(refusedForm.tone, "error");
  assert.match(refusedForm.message, /Push: mislukt/);
  ok("a rejected push stays a failure");

  let remaining = 1;
  const mixed = await sendCase([{ token }, { token: other }], async () => {
    remaining -= 1;
    if (remaining < 0) throw new Error("simulated rejection");
  });
  assert.equal(mixed.push.status, "partial");
  const mixedForm = interpretBulkSendResponse(
    200,
    reportAdminBulkSend({
      emailRequested: false,
      notificationsSent: 1,
      attempts: [],
      push: mixed.push,
    })
  );
  assert.equal(mixedForm.tone, "partial");
  assert.match(mixedForm.message, /1 van 2 apparaten aangeboden/);
  ok("one accepted and one rejected push is partial");

  const both = reportAdminBulkSend({
    emailRequested: true,
    notificationsSent: 1,
    attempts: [{ status: "sent" }],
    push: { requested: true, status: "offered", tokens: 1, offered: 1, failed: 0 },
  });
  const bothForm = interpretBulkSendResponse(both.httpStatus, both);
  assert.equal(bothForm.tone, "success");
  assert.match(bothForm.message, /E-mail: aangeboden aan de e-mailprovider voor 1 van 1/);
  assert.match(bothForm.message, /Push: aangeboden aan de pushdienst voor 1 apparaat/);
  ok("email and push can both be reported as offered");

  const unavailable = await sendCase([{ token }], null);
  assert.equal(unavailable.push.status, "failed");
  assert.deepEqual(unavailable.calls, []);
  ok("a missing push service is a failure, not a missing device");

  const route = readFileSync(
    resolve(process.cwd(), "app/api/admin/send-bulk-message/route.ts"),
    "utf8"
  );
  assert.match(route, /sendSelectedUserPush/);
  assert.match(route, /const sendPush = type === 'push' \|\| type === 'both'/);
  assert.match(route, /renderAdminBulkMessage/);
  assert.match(route, /allowDuringP2Pause:\s*true/);
  assert.match(route, /requireMappedAdminCapability/);
  assert.match(route, /evaluateAdminEmailBlast/);
  assert.doesNotMatch(route, /buttonLabel/);
  assert.doesNotMatch(route, /bezorgpartner/);
  const ui = readFileSync(
    resolve(process.cwd(), "components/admin/UserManagement.tsx"),
    "utf8"
  );
  assert.match(ui, /bulkFeedback\.lines\?\.length \? bulkFeedback\.lines/);
  ok("the selected-user route calls push and still sends the form email");

  console.log("\nSelected-user push tests: PASS");
}

main()
  .finally(() => __setSelectedUserPushForTests(null))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
