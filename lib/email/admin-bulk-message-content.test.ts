/**
 * Admin letter content only. Does not send mail.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderAdminBulkMessage } from "./admin-bulk-message-content";

function ok(msg: string) {
  console.log("  ✓", msg);
}

const letter = renderAdminBulkMessage({
  recipientName: "Sanne",
  message: "Hoi,\n\nDit is een vrije tekst.\nMet een regeleinde.\n\nTweede alinea.",
});

assert.equal(letter.html.includes("Hallo"), false);
assert.equal(letter.text.includes("Hallo"), false);
assert.equal(letter.html.includes("admin team"), false);
assert.match(letter.html, /Hoi,/);
assert.match(letter.html, /Dit is een vrije tekst\.<br>Met een regeleinde\./);
assert.match(letter.html, /Tweede alinea\./);
assert.match(letter.html, /https:\/\/homecheff\.eu\/icon\.png/);
assert.match(letter.html, /mailto:support@homecheff\.eu/);
assert.match(letter.text, /^Hoi,\n\nDit is een vrije tekst\./);
assert.match(letter.text, /support@homecheff\.eu/);
ok("a written Hoi stays the only greeting and line breaks remain");

const other = renderAdminBulkMessage({
  recipientName: "Sanne",
  message: "Een andere vrije tekst.",
});
assert.match(other.html, /Hallo Sanne,/);
assert.match(other.html, /Een andere vrije tekst\./);
assert.equal(other.html.includes("Dit is een vrije tekst"), false);
assert.equal(letter.html.includes("Een andere vrije tekst"), false);
ok("each send uses the text it is given");

const unsafe = renderAdminBulkMessage({
  recipientName: "Sanne",
  message: "Hallo,\n\n<script>alert(1)</script>",
});
assert.equal(unsafe.html.includes("<script>"), false);
assert.equal(unsafe.html.split("Hallo").length - 1, 1);
ok("a written Hallo stays the only greeting and markup is escaped");

const route = readFileSync(
  resolve(process.cwd(), "app/api/admin/send-bulk-message/route.ts"),
  "utf8"
);
const content = readFileSync(
  resolve(process.cwd(), "lib/email/admin-bulk-message-content.ts"),
  "utf8"
);
assert.match(route, /renderAdminBulkMessage\(\{\s*recipientName: u\.name \|\| '',\s*message,/);
assert.match(route, /subject: subject \|\| 'Bericht van HomeCheff Admin'/);
assert.match(route, /html: rendered\.html/);
assert.match(route, /text: rendered\.text/);
assert.match(route, /allowDuringP2Pause:\s*true/);
assert.match(route, /requireMappedAdminCapability/);
assert.doesNotMatch(route, /HomeCheff admin team/);
assert.doesNotMatch(route, /bezorgpartner/);
assert.doesNotMatch(content, /bezorgpartner/);
ok("the send route formats the form text and keeps the selected-user pause exception");

const ui = readFileSync(
  resolve(process.cwd(), "components/admin/UserManagement.tsx"),
  "utf8"
);
assert.match(ui, /value=\{bulkMessageData\.subject\}/);
assert.match(ui, /subject: e\.target\.value/);
assert.match(ui, /value=\{bulkMessageData\.message\}/);
assert.match(ui, /message: e\.target\.value/);
assert.match(ui, /subject: bulkMessageData\.subject/);
assert.match(ui, /message: bulkMessageData\.message/);
assert.match(ui, /message: ''/);
assert.doesNotMatch(ui, /readOnly/);
ok("subject and message stay editable and are sent from the form");

console.log("\nAdmin letter content tests: PASS");
