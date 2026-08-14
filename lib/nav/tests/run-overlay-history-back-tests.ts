/**
 * Overlay history-back contract seals (no browser required).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const overlay = readFileSync(
  join(root, "lib/nav/overlay-history-back.ts"),
  "utf8",
);
assert.match(overlay, /OVERLAY_BACK_STATE_KEY/);
assert.match(overlay, /pushState/);
assert.match(overlay, /replaceState/);
assert.match(overlay, /popstate/);
assert.match(overlay, /pushAndroidBackHandler/);
assert.match(
  overlay,
  /Do NOT history\.back|MUST NOT call history\.back/,
);
assert.equal(/setInterval|requestAnimationFrame/i.test(overlay), false);

const hook = readFileSync(join(root, "hooks/useOverlayHistoryBack.ts"), "utf8");
assert.match(hook, /bindOverlayHistoryBack/);

const nav = readFileSync(join(root, "components/NavBar.tsx"), "utf8");
assert.match(nav, /useOverlayHistoryBack/);
assert.match(nav, /data-wx-landscape-menu/);
assert.match(nav, /z-\[200\]/);

const search = readFileSync(
  join(root, "components/feed/FeedSearchContextBar.tsx"),
  "utf8",
);
assert.match(search, /useOverlayHistoryBack/);
assert.match(search, /feed-search-context-panel/);

const geo = readFileSync(join(root, "components/feed/GeoFeed.tsx"), "utf8");
assert.match(geo, /useOverlayHistoryBack/);
assert.match(geo, /feed-mobile-filter-sheet/);

const create = readFileSync(
  join(root, "components/create/CreateFlowContext.tsx"),
  "utf8",
);
assert.match(create, /useOverlayHistoryBack/);
assert.match(create, /create-guest-auth/);
assert.match(create, /create-roles-gate/);

const workbar = readFileSync(
  join(root, "components/adaptive-workspace/LandscapeWorkBarCommands.tsx"),
  "utf8",
);
assert.match(workbar, /ctaOfferCompact/);
assert.match(workbar, /min-h-\[44px\]/);

const css = readFileSync(join(root, "app/globals.css"), "utf8");
assert.match(css, /--hc-landscape-system-right-reserve/);
assert.match(css, /hc-wx-landscape-menu-panel/);
assert.match(css, /z-index:\s*200/);
assert.match(css, /data-wx-orientation-host/);
assert.match(css, /data-aw-slot-host="orientation"/);
assert.match(css, /pointer-events:\s*none/);
assert.match(css, /data-wx-feed-search/);

const nl = readFileSync(join(root, "public/i18n/nl.json"), "utf8");
assert.match(nl, /"ctaOfferCompact": "Aanbieden"/);

console.log("[overlay-history-back] PASS seals");
