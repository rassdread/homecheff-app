/** Short-landscape (844x390) guest menu probe: Menu opens, Inloggen/Aanmelden + language reachable. Env: U (base URL), OUT. */
import { chromium } from 'playwright';
const base = process.env.U;
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 844, height: 390 } });
await c.addCookies([{ name: 'homecheff-language', value: 'nl', domain: new URL(base).hostname, path: '/' }]);
const p = await c.newPage();
await p.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 });
await p.waitForTimeout(4000);
const menu = p.locator('button[aria-label="Menu"]:visible').first();
const menuVisible = await menu.isVisible().catch(() => false);
if (menuVisible) await menu.click();
await p.waitForTimeout(1200);
const login = await p.locator('a[href="/login"]:visible').count();
const register = await p.locator('a[href="/register"]:visible').count();
const lang = await p.locator('button[aria-label*="aal"]:visible, button[aria-label*="anguage"]:visible').count();
await p.screenshot({ path: (process.env.OUT || '/tmp') + '/landscape-844x390-menu.png' });
console.log(JSON.stringify({ menuVisible, loginLinksVisible: login, registerLinksVisible: register, languageControlsVisible: lang }));
await b.close();
