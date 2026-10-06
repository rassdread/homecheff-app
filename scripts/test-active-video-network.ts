import assert from "node:assert/strict";
import { chooseActiveVideo, visibleActivationThreshold } from "../lib/feed/active-video-selection";
import { videoProxyRangePlan } from "../lib/video-proxy-range";

const card = (
  id: string,
  ratio: number,
  centerDistancePx: number,
  elementHeight = 280,
  viewportHeight = 800,
) => ({ id, ratio, centerDistancePx, elementHeight, viewportHeight });

const higher = chooseActiveVideo(
  [card("a", 0.8, 200), card("b", 0.62, 40)],
  null,
);
assert.equal(higher, "a", "highest visible ratio wins");

const closer = chooseActiveVideo(
  [card("a", 0.7, 220), card("b", 0.66, 30)],
  null,
);
assert.equal(closer, "b", "near-equal ratios pick the tile closer to center");

const held = chooseActiveVideo(
  [card("a", 0.55, 100), card("b", 0.5, 40)],
  "a",
);
assert.equal(held, "a", "current winner stays through small flicker below 60%");

const released = chooseActiveVideo(
  [card("a", 0.3, 100), card("b", 0.7, 40)],
  "a",
);
assert.equal(released, "b", "a winner below the release line yields");

const challenger = chooseActiveVideo(
  [card("a", 0.62, 80), card("b", 0.78, 200)],
  "a",
);
assert.equal(challenger, "b", "a clearly more visible tile takes over");

const tie = chooseActiveVideo(
  [card("a", 0.7, 100), card("b", 0.7, 104)],
  "a",
);
assert.equal(tie, "a", "a remaining tie keeps the previous winner");

const flickerOff = chooseActiveVideo([card("a", 0.59, 10)], null);
assert.equal(flickerOff, null, "59% does not start a video");
const flickerOn = chooseActiveVideo([card("a", 0.61, 10)], null);
assert.equal(flickerOn, "a", "61% can start a video");
const flickerHold = chooseActiveVideo([card("a", 0.59, 10)], "a");
assert.equal(flickerHold, "a", "a live video is not dropped by a 59% flicker");

const ten = Array.from({ length: 10 }, (_, index) =>
  card(`v${index}`, index === 4 ? 0.84 : 0.22, Math.abs(index - 4) * 40),
);
assert.equal(chooseActiveVideo(ten, null), "v4", "ten visible cards still produce one winner");

const none = chooseActiveVideo([card("a", 0.2, 10), card("b", 0.4, 10)], null);
assert.equal(none, null, "tiles below the activation line attach nothing");

assert.equal(visibleActivationThreshold(280, 800), 0.6);
assert.ok(visibleActivationThreshold(2000, 700) < 0.6, "a card taller than the viewport uses a reachable threshold");
assert.ok(visibleActivationThreshold(2000, 700) >= 0.35);

const tall = chooseActiveVideo(
  [card("tall", 0.4, 20, 2000, 700)],
  null,
);
assert.equal(tall, "tall", "a tall card can still win when most of the viewport shows it");

const iphone = videoProxyRangePlan("bytes=0-1", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)");
assert.equal(iphone.forwardRange, true);
assert.equal(iphone.forceBuffer, false, "a Range request is not rewritten into a full-file buffer");

const safariPlain = videoProxyRangePlan(null, "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)");
assert.equal(safariPlain.forwardRange, false);
assert.equal(safariPlain.forceBuffer, true, "Safari without Range keeps the existing full-body playback path");

const chrome = videoProxyRangePlan("bytes=0-1023", "Mozilla/5.0 Chrome/120.0.0.0");
assert.equal(chrome.forwardRange, true);
assert.equal(chrome.forceBuffer, false);

console.log("active-video-network: pass");
