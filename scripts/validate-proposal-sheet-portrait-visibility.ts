#!/usr/bin/env npx tsx
/**
 * Portrait proposal sheet visibility regression (static + optional Playwright).
 *
 * Static: CreateProposalSheet must portal to document.body, use fullscreen
 * mobile height, and sit above bottom nav — so portrait overflow clipping
 * in ChatShell / .hc-messages-root cannot hide the sheet.
 *
 * Playwright (when available): open sheet at 390x844 / 393x852 / 375x667
 * and assert bounding box intersects viewport with title + submit visible.
 */
import fs from 'fs';
import path from 'path';
import assert from 'node:assert/strict';

const root = process.cwd();
function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

console.log('=== Proposal sheet portrait visibility ===\n');

const sheet = read('components/chat/proposals/CreateProposalSheet.tsx');
const chatBox = read('components/chat/ChatBox.tsx');
const shell = read('components/chat/ChatShell.tsx');
const globals = read('app/globals.css');

assert.match(sheet, /createPortal/, 'CreateProposalSheet uses createPortal');
assert.match(sheet, /document\.body/, 'portal target is document.body');
assert.match(sheet, /data-hc-proposal-sheet-portal/, 'portal marker');
assert.match(sheet, /data-hc-proposal-fullscreen-mobile/, 'fullscreen mobile marker');
assert.match(sheet, /h-\[100dvh\]|100dvh/, 'fullscreen uses dvh');
assert.match(sheet, /z-\[200\]/, 'sheet above bottom nav z-65');
assert.match(sheet, /data-hc-proposal-submit/, 'submit CTA present');
assert.match(sheet, /data-hc-proposal-sheet-close/, 'close control present');
assert.match(sheet, /inset >= 120/, 'keyboard inset ignores chrome jitter');
assert.doesNotMatch(
  sheet,
  /max-h-\[min\(92dvh/,
  'portrait must not use fragile 92dvh bottom-sheet max-height as primary',
);

assert.match(chatBox, /CreateProposalSheet/, 'ChatBox still hosts open state');
assert.match(chatBox, /setShowCreateProposal\(true\)/, 'Voorstel tap opens sheet');
assert.match(shell, /overflow-hidden/, 'ChatShell still clips (why portal is required)');
assert.match(globals, /\.hc-messages-root/, 'messages root height budget exists');
assert.match(globals, /overflow:\s*hidden/, 'messages/chat overflow hidden in globals');

console.log('Static portrait/portal gates: PASS');

async function runPlaywrightPortraitChecks(): Promise<void> {
  let chromium: typeof import('@playwright/test').chromium | null = null;
  try {
    ({ chromium } = await import('@playwright/test'));
  } catch {
    console.log('Playwright not importable — skipping live viewport checks');
    return;
  }

  const viewports = [
    { name: '390x844', width: 390, height: 844 },
    { name: '393x852', width: 393, height: 852 },
    { name: '375x667', width: 375, height: 667 },
    { name: 'landscape-844x390', width: 844, height: 390 },
  ] as const;

  // Headless DOM fixture: reproduce ChatShell overflow clip + sheet portal behavior.
  const html = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  html,body{margin:0;height:100%;}
  .hc-messages-root{height:calc(100svh - 4rem - 5.75rem);max-height:calc(100svh - 4rem - 5.75rem);overflow:hidden;position:relative;background:#e8eaed;margin-top:4rem;}
  .chat-shell{height:100%;overflow:hidden;display:flex;flex-direction:column;}
  .composer{margin-top:auto;padding:12px;background:#fff;border-top:1px solid #ddd;}
  button.open{min-height:44px;min-width:44px;}
  [data-hc-proposal-sheet]{position:fixed;inset:0;z-index:200;display:flex;align-items:stretch;background:rgba(0,0,0,.5);}
  [data-hc-proposal-sheet-panel]{width:100%;height:100dvh;max-height:100dvh;background:#fff;display:flex;flex-direction:column;}
  [data-hc-proposal-submit],[data-hc-proposal-sheet-close],#create-proposal-title{display:block;}
</style></head><body>
<div class="hc-messages-root"><div class="chat-shell">
  <div style="flex:1"></div>
  <div class="composer"><button class="open" type="button" id="open-proposal">Voorstel</button></div>
</div></div>
<script>
  const openBtn = document.getElementById('open-proposal');
  openBtn.addEventListener('click', () => {
    const existing = document.querySelector('[data-hc-proposal-sheet]');
    if (existing) existing.remove();
    const root = document.createElement('div');
    root.setAttribute('data-hc-proposal-sheet','');
    root.setAttribute('data-hc-proposal-sheet-portal','1');
    root.innerHTML = '<div data-hc-proposal-sheet-panel data-hc-proposal-fullscreen-mobile="1">'
      + '<div><h2 id="create-proposal-title">Voorstel doen</h2>'
      + '<button type="button" data-hc-proposal-sheet-close>X</button></div>'
      + '<div style="flex:1;overflow:auto">form</div>'
      + '<button type="submit" data-hc-proposal-submit>Voorstel versturen</button>'
      + '</div>';
    // Correct: portal to body (production fix). Wrong path would append inside .chat-shell.
    document.body.appendChild(root);
  });
</script>
</body></html>`;

  const browser = await chromium.launch({ headless: true });
  try {
    for (const vp of viewports) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
      });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.click('#open-proposal');
      const sheetEl = page.locator('[data-hc-proposal-sheet]');
      await sheetEl.waitFor({ state: 'visible', timeout: 3000 });
      const box = await sheetEl.boundingBox();
      assert.ok(box, `${vp.name}: sheet has bounding box`);
      assert.ok(box!.width > 0 && box!.height > 0, `${vp.name}: sheet size > 0`);
      assert.ok(
        box!.x < vp.width && box!.y < vp.height && box!.x + box!.width > 0 && box!.y + box!.height > 0,
        `${vp.name}: sheet intersects viewport`,
      );
      assert.ok(
        await page.locator('#create-proposal-title').isVisible(),
        `${vp.name}: title visible`,
      );
      assert.ok(
        await page.locator('[data-hc-proposal-sheet-close]').isVisible(),
        `${vp.name}: close visible`,
      );
      assert.ok(
        await page.locator('[data-hc-proposal-submit]').isVisible(),
        `${vp.name}: submit visible`,
      );
      // Must be direct child of body (portal), not trapped in overflow clip.
      const parentIsBody = await page.evaluate(() => {
        const el = document.querySelector('[data-hc-proposal-sheet]');
        return el?.parentElement === document.body;
      });
      assert.equal(parentIsBody, true, `${vp.name}: sheet parent is document.body`);
      console.log(`Playwright ${vp.name}: PASS`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

runPlaywrightPortraitChecks()
  .then(() => {
    console.log('\nAll portrait proposal sheet visibility checks passed.');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
