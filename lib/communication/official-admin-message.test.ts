import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { pathFromPushNotificationData } from "@/lib/native/pushDeepLink";
import {
  pushRouteForToken,
} from "@/lib/admin/admin-selected-push";
import {
  buildOfficialAdminCopy,
  createOfficialAdminCopies,
  officialCopiesArePrivate,
  readOfficialConversation,
} from "./official-admin-message";

const action = {
  label: "Naar mijn bezorgomgeving",
  url: "https://homecheff.eu/delivery",
};

describe("official admin inbox copies", () => {
  it("gives each selected person a private Team HomeCheff message with the same destination", async () => {
    const written: string[][] = [];
    let n = 0;
    const copies = await createOfficialAdminCopies(
      {
        adminUserId: "admin-1",
        recipientIds: ["user-a", "user-b", "user-a"],
        subject: "Je bezorgomgeving",
        message: "Dit is de volledige tekst voor alleen jou.",
        action,
        broadcastId: "broadcast-1",
      },
      async (copy) => {
        written.push(copy.participantUserIds);
      },
      () => `copy-${++n}-abcdef`
    );

    assert.equal(copies.length, 2);
    assert.equal(officialCopiesArePrivate(copies), true);
    assert.deepEqual(written, [["user-a"], ["user-b"]]);
    assert.equal(copies[0].text, "Dit is de volledige tekst voor alleen jou.");
    assert.equal(copies[0].metadata.action?.url, action.url);
    assert.equal(copies[0].metadata.repliesDisabled, true);
    assert.equal(copies[0].pushRoute, `/messages/${copies[0].conversationId}/`);
    assert.notEqual(copies[0].conversationId, copies[1].conversationId);
    assert.equal(
      pathFromPushNotificationData({
        type: "chat",
        route: copies[0].pushRoute,
        conversationId: copies[0].conversationId,
      }),
      copies[0].pushRoute
    );
    assert.equal(
      pushRouteForToken({ userId: "user-a" }, { "user-a": copies[0].pushRoute }),
      copies[0].pushRoute
    );
    assert.equal(pushRouteForToken({ userId: "user-b" }), "/notifications/");
  });

  it("keeps the subject, full text and button, and leaves ordinary chats replyable", () => {
    const copy = buildOfficialAdminCopy({
      recipientId: "user-a",
      adminUserId: "admin-1",
      subject: "Onderwerp",
      message: "Hele brief.",
      action,
      broadcastId: "broadcast-1",
      conversationId: "conv-official-1",
      participantId: "part-1",
      messageId: "msg-1",
    });
    const view = readOfficialConversation(copy.metadata);
    assert.equal(view?.senderLabel, "Team HomeCheff");
    assert.equal(view?.badge, "Officieel");
    assert.equal(view?.subject, "Onderwerp");
    assert.equal(
      readOfficialConversation({
        senderLabel: "Team HomeCheff",
        badge: "Officieel",
        subject: "Onderwerp",
        repliesDisabled: true,
        action,
      })?.subject,
      "Onderwerp"
    );
    assert.equal(view?.action?.label, action.label);
    assert.equal(readOfficialConversation({ official: false }) , null);

    const chat = readFileSync(resolve(process.cwd(), "components/chat/ChatBox.tsx"), "utf8");
    assert.match(chat, /Je kunt hier nog niet op antwoorden/);
    assert.match(chat, /data-hc-chat-composer=""/);
    assert.match(chat, /data-hc-official-letter/);
    assert.match(chat, /data-hc-official-logo/);
    assert.match(chat, /whitespace-pre-wrap/);
    assert.match(chat, /canonicalLogoPath\('square'\)/);
    assert.match(chat, /data-hc-official-action/);
    const thread = readFileSync(
      resolve(process.cwd(), "app/messages/[conversationId]/page.tsx"),
      "utf8"
    );
    const inbox = readFileSync(resolve(process.cwd(), "app/messages/page.tsx"), "utf8");
    const push = readFileSync(
      resolve(process.cwd(), "components/native/NativeAppUxFoundation.tsx"),
      "utf8"
    );
    assert.match(thread, /official=\{conversation\.official \?\? null\}/);
    assert.match(inbox, /official=\{selectedConversation\.official \?\? null\}/);
    assert.match(push, /router\.replace\(path\)/);
    assert.match(chat, /href=\{official\.action\.url\}/);
    assert.match(chat, /official \? null : <ConversationContextHeader/);
    assert.match(chat, /!official && messages\.length === 0/);
    assert.match(chat, /official \? official\.senderLabel : getDisplayName\(otherParticipant\)/);
    const list = readFileSync(
      resolve(process.cwd(), "components/chat/ConversationsList.tsx"),
      "utf8"
    );
    assert.match(list, /conversation\.official\.badge/);
    assert.match(list, /if \(c\.official\)/);
    assert.match(list, /canonicalLogoPath\('square'\)/);
    const route = readFileSync(
      resolve(process.cwd(), "app/api/admin/send-bulk-message/route.ts"),
      "utf8"
    );
    assert.match(route, /createOfficialAdminCopies/);
    assert.match(route, /action: action\.action/);
    assert.match(route, /routeByUserId/);
    const reply = readFileSync(
      resolve(process.cwd(), "app/api/conversations/[conversationId]/messages/route.ts"),
      "utf8"
    );
    assert.match(reply, /officialRepliesAreDisabled/);
  });
});
