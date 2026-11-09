import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { resolveAdminEmailAction } from "./admin-bulk-message-content";
import {
  COURIER_EMAIL_ACTIONS,
  courierEmailActionUrl,
  deliveryDashboardLoginPath,
} from "./courier-email-actions";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("courier email destinations", () => {
  it("offers one working HomeCheff page per courier action and no Stripe session link", () => {
    const presets = COURIER_EMAIL_ACTIONS.filter(
      (action) => action.id !== "none" && action.id !== "custom",
    );
    assert.deepEqual(
      presets.map((action) => action.choiceLabel),
      [
        "Naar mijn bezorgomgeving",
        "Stripe Connect instellen of hervatten",
        "Bezorggegevens aanvullen",
        "Bezorgovereenkomst bekijken",
      ],
    );
    const paths = presets.map((action) => action.path);
    assert.equal(new Set(paths).size, paths.length);
    for (const action of presets) {
      const url = courierEmailActionUrl(action.path);
      const resolved = resolveAdminEmailAction(action.buttonLabel, url);
      assert.equal(resolved.ok, true);
      if (resolved.ok && resolved.action) {
        assert.equal(resolved.action.url.startsWith("https://homecheff.eu/"), true);
        assert.equal(resolved.action.url.includes("stripe.com"), false);
        assert.equal(resolved.action.label, action.buttonLabel);
      }
    }
    const none = COURIER_EMAIL_ACTIONS.find((action) => action.id === "none");
    assert.equal(resolveAdminEmailAction(none?.buttonLabel, none?.path).ok, true);
  });

  it("keeps the Stripe section when the courier has to log in first", () => {
    assert.equal(deliveryDashboardLoginPath("stripe"), "/delivery/dashboard?onderdeel=stripe");
    assert.equal(deliveryDashboardLoginPath(["stripe"]), "/delivery/dashboard?onderdeel=stripe");
    assert.equal(deliveryDashboardLoginPath("overeenkomst"), "/delivery/dashboard");
    assert.equal(deliveryDashboardLoginPath(undefined), "/delivery/dashboard");

    const dashboard = read("app/delivery/dashboard/page.tsx");
    assert.match(dashboard, /deliveryDashboardLoginPath/);
    assert.match(dashboard, /encodeURIComponent\(returnPath\)/);

    const home = read("app/delivery/page.tsx");
    assert.match(home, /callbackUrl=\/delivery/);
    assert.match(home, /redirect\('\/delivery\/dashboard'\)/);

    const settings = read("app/delivery/settings/page.tsx");
    assert.match(settings, /callbackUrl=\/delivery\/settings/);

    const agreement = read("app/delivery/overeenkomst/page.tsx");
    assert.match(agreement, /callbackUrl=\$\{encodeURIComponent\('\/delivery\/overeenkomst'\)\}/);
    const agreementView = read("components/delivery/DeliveryAgreementView.tsx");
    assert.match(agreementView, /deliverySignup\.legalModalTitle/);

    const client = read("components/delivery/DeliveryDashboard.tsx");
    assert.match(client, /onderdeel=stripe|get\('onderdeel'\)/);
    assert.match(client, /connect-payout-banner/);
  });

  it("shows the choice list for email and both, and keeps the letter text editable", () => {
    const ui = read("components/admin/UserManagement.tsx");
    assert.match(ui, /Waar wil je de ontvanger naartoe sturen\?/);
    assert.match(ui, /Deze knop komt in de mail/);
    assert.match(ui, /Zo ziet de mail er op mobiel uit/);
    assert.match(ui, /choice === 'custom'/);
    assert.match(ui, /value=\{bulkMessageData\.subject\}/);
    assert.match(ui, /value=\{bulkMessageData\.message\}/);
    assert.doesNotMatch(ui, /readOnly/);
    assert.doesNotMatch(ui, /connect\.stripe\.com/);
  });
});
