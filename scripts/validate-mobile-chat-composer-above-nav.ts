#!/usr/bin/env npx tsx
/**
 * Mobile chat composer must sit fully above the HomeCheff bottom navigation.
 *
 * Static gates + Playwright geometry checks (Android portrait + landscape +
 * iPhone-ish safe-area + desktop).
 */
import fs from 'fs';
import path from 'path';
import assert from 'node:assert/strict';

const root = process.cwd();
function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

console.log('=== Mobile chat composer above bottom nav ===\n');

const globals = read('app/globals.css');
const chatBox = read('components/chat/ChatBox.tsx');
const chrome = read('components/AppPageChrome.tsx');
const bottomNav = read('components/navigation/BottomNavigation.tsx');
const threadPage = read('app/messages/[conversationId]/page.tsx');
const inset = read('lib/layout/bottomNavInset.ts');

assert.match(globals, /--hc-bottom-nav-offset/, 'SSOT CSS var --hc-bottom-nav-offset');
assert.match(globals, /--hc-bottom-nav-height/, 'SSOT CSS var --hc-bottom-nav-height');
assert.match(
  globals,
  /\.hc-messages-root\s*\{[^}]*var\(--hc-bottom-nav-offset\)/s,
  'messages-root height uses --hc-bottom-nav-offset',
);
assert.doesNotMatch(
  globals,
  /\.hc-messages-root\s*\{[^}]*100svh - 4rem - 5\.75rem/s,
  'messages-root must not use bare 5.75rem without safe-area SSOT',
);
assert.match(
  globals,
  /hc-native-chat-composer-native[\s\S]*?padding-bottom:\s*0\.375rem/,
  'native composer must not re-add safe-area (nav owns it)',
);
assert.match(chrome, /--hc-bottom-nav-offset/, 'AppPageChrome uses SSOT offset');
assert.match(chrome, /messagesOwnInset/, 'messages route skips chrome double-pad');
assert.match(chatBox, /data-hc-chat-composer/, 'composer marker');
assert.match(chatBox, /hc-native-chat-composer/, 'composer class');
assert.doesNotMatch(
  chatBox,
  /pb-\[max\(0\.25rem,env\(safe-area-inset-bottom/,
  'web composer must not double-count safe-area under bottom nav',
);
assert.match(bottomNav, /data-hc-bottom-nav/, 'bottom nav marker');
assert.match(bottomNav, /fixed inset-x-0 bottom-0/, 'bottom nav is fixed');
assert.match(threadPage, /hc-messages-root/, 'thread page uses messages root');
assert.match(threadPage, /ChatBox/, 'thread page hosts ChatBox');
assert.match(inset, /--hc-bottom-nav-offset/, 'bottomNavInset mirrors SSOT');

console.log('Static layout gates: PASS');

async function runGeometryChecks(): Promise<void> {
  let chromium: typeof import('@playwright/test').chromium | null = null;
  try {
    ({ chromium } = await import('@playwright/test'));
  } catch {
    console.log('Playwright not importable — skipping geometry checks');
    return;
  }

  const html = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<style>
  :root {
    --hc-top-nav-height: 4rem;
    --hc-bottom-nav-height: 5.75rem;
    --hc-bottom-nav-offset: calc(var(--hc-bottom-nav-height) + env(safe-area-inset-bottom, 0px));
  }
  html, body { margin: 0; height: 100%; overflow: hidden; }
  .top { height: var(--hc-top-nav-height); background: #fff; border-bottom: 1px solid #ddd; }
  .hc-messages-root {
    height: calc(100svh - var(--hc-top-nav-height) - var(--hc-bottom-nav-offset));
    max-height: calc(100svh - var(--hc-top-nav-height) - var(--hc-bottom-nav-offset));
    display: flex; flex-direction: column; overflow: hidden; background: #eef1f4;
  }
  .msgs { flex: 1; min-height: 0; overflow: auto; padding: 8px; }
  [data-hc-chat-composer] {
    flex-shrink: 0; border-top: 1px solid #ddd; background: #fff;
    padding: 10px 12px; display: flex; gap: 8px; align-items: flex-end;
  }
  [data-hc-chat-composer] input {
    flex: 1; min-height: 44px; border-radius: 999px; border: 1px solid #ccc; padding: 8px 14px;
  }
  [data-hc-chat-composer] button { min-height: 44px; min-width: 44px; }
  [data-hc-bottom-nav] {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 65;
    height: var(--hc-bottom-nav-offset);
    background: #fff; border-top: 1px solid #ccc;
    display: flex; align-items: center; justify-content: space-around;
    padding-bottom: env(safe-area-inset-bottom, 0px); box-sizing: border-box;
  }
</style></head><body>
  <div class="top">Nav</div>
  <div class="hc-messages-root">
    <div class="msgs"><div id="last-msg">Last message card</div></div>
    <form data-hc-chat-composer>
      <button type="button" id="attach">+</button>
      <input id="composer-input" placeholder="Typ een bericht…" />
      <button type="submit" id="send">Send</button>
    </form>
  </div>
  <nav data-hc-bottom-nav>
    <span>Ontdekken</span><span>Dashboard</span><span>+</span>
    <span>Berichten</span><span>Reputatie</span><span>Profile</span>
  </nav>
</body></html>`;

  const cases = [
    { name: 'android-portrait-390x844', width: 390, height: 844 },
    { name: 'android-portrait-412x915', width: 412, height: 915 },
    { name: 'iphone-portrait-390x844', width: 390, height: 844 },
    { name: 'mobile-landscape-844x390', width: 844, height: 390 },
    { name: 'desktop-1280x800', width: 1280, height: 800 },
  ] as const;

  const browser = await chromium.launch({ headless: true });
  try {
    for (const vp of cases) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
      });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const result = await page.evaluate(() => {
        const composer = document.querySelector('[data-hc-chat-composer]') as HTMLElement;
        const nav = document.querySelector('[data-hc-bottom-nav]') as HTMLElement;
        const input = document.querySelector('#composer-input') as HTMLElement;
        const send = document.querySelector('#send') as HTMLElement;
        const attach = document.querySelector('#attach') as HTMLElement;
        const last = document.querySelector('#last-msg') as HTMLElement;
        const c = composer.getBoundingClientRect();
        const n = nav.getBoundingClientRect();
        const i = input.getBoundingClientRect();
        const s = send.getBoundingClientRect();
        const a = attach.getBoundingClientRect();
        return {
          composerBottom: c.bottom,
          composerTop: c.top,
          composerHeight: c.height,
          navTop: n.top,
          inputVisible: i.height > 0 && i.bottom <= n.top + 0.5,
          sendVisible: s.height > 0 && s.bottom <= n.top + 0.5,
          attachVisible: a.height > 0 && a.bottom <= n.top + 0.5,
          composerFullyAboveNav: c.bottom <= n.top + 1,
          gap: n.top - c.bottom,
          lastBottom: last.getBoundingClientRect().bottom,
        };
      });

      assert.ok(result.composerHeight > 40, `${vp.name}: composer has real height`);
      assert.equal(
        result.composerFullyAboveNav,
        true,
        `${vp.name}: composer bottom (${result.composerBottom}) must be <= nav top (${result.navTop})`,
      );
      assert.equal(result.inputVisible, true, `${vp.name}: input fully above nav`);
      assert.equal(result.sendVisible, true, `${vp.name}: send fully above nav`);
      assert.equal(result.attachVisible, true, `${vp.name}: attach fully above nav`);
      assert.ok(result.gap >= -1, `${vp.name}: no overlap (gap=${result.gap})`);

      // Keyboard open simulation: shrink visual layout height (Android chrome).
      if (vp.name.startsWith('android-portrait')) {
        await page.setViewportSize({
          width: vp.width,
          height: Math.round(vp.height * 0.55),
        });
        const kb = await page.evaluate(() => {
          const composer = document.querySelector('[data-hc-chat-composer]') as HTMLElement;
          const nav = document.querySelector('[data-hc-bottom-nav]') as HTMLElement;
          const input = document.querySelector('#composer-input') as HTMLElement;
          const c = composer.getBoundingClientRect();
          const n = nav.getBoundingClientRect();
          const i = input.getBoundingClientRect();
          return {
            composerFullyAboveNav: c.bottom <= n.top + 1,
            inputVisible: i.height > 0 && i.bottom <= n.top + 0.5,
          };
        });
        assert.equal(kb.composerFullyAboveNav, true, `${vp.name}+keyboard: composer above nav`);
        assert.equal(kb.inputVisible, true, `${vp.name}+keyboard: input visible`);
      }

      console.log(`Geometry ${vp.name}: PASS (gap=${result.gap.toFixed(1)}px)`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

runGeometryChecks()
  .then(() => {
    console.log('\nAll mobile chat composer layout checks passed.');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
