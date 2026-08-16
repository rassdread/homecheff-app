/**
 * SP.2D-C7 — cold-init / middleware slim regressions for SSO TTFB.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { HOMECHEFF_SEO_PAGE_DEFS } from "../lib/seo/homecheffSeoPages.data";
import { EN_SEO_PAGE_SLUGS, NL_SEO_PAGE_SLUGS } from "../lib/seo/homecheffSeoPageSlugs";
import { isKnownHomecheffRootPath } from "../lib/seo/known-root-path-segments";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function ok(msg: string) {
  console.log("  ✓", msg);
}

function main() {
  const mw = readFileSync(resolve(root, "middleware.ts"), "utf8");
  assert.doesNotMatch(mw, /from ['\"]next-auth\/jwt['\"]/);
  assert.match(mw, /import\(['\"]next-auth\/jwt['\"]\)/);
  assert.match(mw, /from ['\"]@\/lib\/security-headers['\"]/);
  assert.doesNotMatch(mw, /from ['\"]@\/lib\/security['\"]/);
  assert.match(mw, /pathname\.startsWith\(['\"]\/auth\/sso\//);
  ok("middleware: dynamic getToken; security-headers; SSO fast-path");

  const known = readFileSync(resolve(root, "lib/seo/known-root-path-segments.ts"), "utf8");
  assert.match(known, /homecheffSeoPageSlugs/);
  assert.doesNotMatch(known, /homecheffSeoPages\.data/);
  ok("LEGAL-0 known-root does not import SEO page copy");

  const nlFromDefs = HOMECHEFF_SEO_PAGE_DEFS.map((p) => p.nlSlug);
  const enFromDefs = HOMECHEFF_SEO_PAGE_DEFS.map((p) => p.enSlug);
  assert.deepEqual([...NL_SEO_PAGE_SLUGS], nlFromDefs);
  assert.deepEqual([...EN_SEO_PAGE_SLUGS], enFromDefs);
  ok("SEO slug lists stay in sync with page defs");

  assert.equal(isKnownHomecheffRootPath("/auth/sso/start"), true);
  assert.equal(isKnownHomecheffRootPath("/this-slug-does-not-exist-legal0-xyz"), false);
  ok("LEGAL-0 path checks still work");

  const start = readFileSync(resolve(root, "app/auth/sso/start/route.ts"), "utf8");
  assert.match(start, /import\(\"@\/lib\/identity\/sso\/authorize\"\)/);
  assert.doesNotMatch(start, /^import \{ issueSsoAuthorizationCode \}/m);
  ok("SSO start dynamically imports authorize (Prisma deferred)");

  console.log("\nSP.2D-C7 cold-init tests: PASS");
}

main();
