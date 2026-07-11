#!/usr/bin/env npx tsx
/**
 * Phase 13T — Product Truth & Trust P0 guard.
 *
 * Run: npx tsx scripts/validate-product-truth-trust-phase13t.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { BUSINESS_DISCOVERY_RANKING_WIRED } from '../lib/business/visibility-profile';
import {
  SUSPENSION_MUTATION_ALLOWLIST,
  SUSPENSION_MUTATION_METHODS,
} from '../lib/user-suspend-middleware';

const GDPR_EXPORT_FORMAT = 'homecheff-gdpr-export';
const GDPR_EXPORT_VERSION = '1.0';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

function read(rel: string): string {
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

const BLOCKED_COPY = [
  /full data portability/i,
  /volledige data-export wordt nog uitgerold/i,
  /Higher discovery priority/i,
  /Hogere discovery-prioriteit/i,
  /ranking boost.*live feed/i,
];

function main() {
  console.log('=== Phase 13T — Product Truth & Trust P0 ===\n');

  console.log('13T.1 Deliverables');
  assert(exists('docs/audits/PRODUCT_TRUTH_TRUST_P0_PHASE13T_AUDIT.md'), 'audit doc');
  assert(exists('docs/progress/UX_FINALIZATION_PHASE13T_PRODUCT_TRUST.md'), 'progress doc');
  assert(exists('scripts/validate-product-truth-trust-phase13t.ts'), 'validator');

  const audit = read('docs/audits/PRODUCT_TRUTH_TRUST_P0_PHASE13T_AUDIT.md');
  for (let i = 1; i <= 6; i++) {
    assert(audit.includes(`Part ${i}`), `audit includes Part ${i}`);
  }

  console.log('\n13T.2 GDPR export');
  assert(exists('lib/profile/gdpr-data-export.ts'), 'gdpr-data-export lib');
  assert(exists('lib/profile/gdpr-export-rate-limit.ts'), 'export rate limit');
  assert(exists('app/api/profile/export-data/route.ts'), 'export API route');
  const exportRoute = read('app/api/profile/export-data/route.ts');
  const deleteUi = read('components/profile/DeleteAccount.tsx');
  const gdprLib = read('lib/profile/gdpr-data-export.ts');
  assert(exportRoute.includes('buildGdprDataExport'), 'export route builds payload');
  assert(exportRoute.includes('logGdprExportAudit'), 'export route audit logs');
  assert(exportRoute.includes('checkGdprExportRateLimit'), 'export route rate limits');
  assert(deleteUi.includes('/api/profile/export-data'), 'DeleteAccount calls export API');
  assert(deleteUi.includes('await response.blob()'), 'DeleteAccount downloads export blob');
  assert(GDPR_EXPORT_FORMAT === 'homecheff-gdpr-export', 'export format constant');
  assert(GDPR_EXPORT_VERSION === '1.0', 'export version constant');
  assert(gdprLib.includes('homecheff-gdpr-export'), 'gdpr lib format id');

  console.log('\n13T.3 Suspension enforcement');
  assert(exists('lib/user-suspend-middleware.ts'), 'suspend middleware SSOT');
  assert(exists('lib/api/user-mutation-guard.ts'), 'user mutation guard');
  const middleware = read('middleware.ts');
  assert(middleware.includes('shouldBlockSuspendedMutation'), 'middleware blocks suspended mutations');
  assert(middleware.includes('getToken'), 'middleware reads JWT for suspension');
  const auth = read('lib/auth.ts');
  assert(auth.includes('minimalToken.suspended'), 'JWT carries suspended flag');
  assert(auth.includes('isSuspended'), 'session exposes isSuspended');
  assert(SUSPENSION_MUTATION_METHODS.has('POST'), 'POST is mutation method');
  assert(SUSPENSION_MUTATION_ALLOWLIST.length >= 1, 'mutation allowlist documented');
  assert(read('app/api/checkout/route.ts').includes('assertNotSuspended'), 'checkout defense in depth');
  assert(exists('app/api/internal/user-suspended/route.ts'), 'internal suspension DB check');

  console.log('\n13T.4 Business DNA truth (Option B)');
  assert(BUSINESS_DISCOVERY_RANKING_WIRED === false, 'discovery ranking not wired flag');
  const dnaPreview = read('lib/business/dna-preview.ts');
  assert(!dnaPreview.includes('profile.rankingBoost * 200'), 'visibility score excludes ranking boost');
  assert(!dnaPreview.includes('business.dna.delta.discoveryPriority'), 'no discovery priority delta');
  const nl = read('public/i18n/nl.json');
  const en = read('public/i18n/en.json');
  assert(nl.includes('geen gegarandeerde feed-ranking'), 'NL sell compare honest');
  assert(en.includes('no guaranteed feed ranking'), 'EN sell compare honest');

  console.log('\n13T.5 Copy honesty');
  for (const re of BLOCKED_COPY) {
    assert(!re.test(nl), `NL no blocked claim: ${re}`);
    assert(!re.test(en), `EN no blocked claim: ${re}`);
  }
  assert(nl.includes('accountSuspension'), 'NL suspension notice i18n');
  assert(en.includes('accountSuspension'), 'EN suspension notice i18n');
  assert(exists('components/profile/SuspensionNotice.tsx'), 'SuspensionNotice component');

  console.log('\n13T.6 Security surface');
  assert(exportRoute.includes('Unauthorized'), 'export requires auth');
  assert(exportRoute.includes('accountDeletedAt'), 'export blocks deleted accounts');
  assert(gdprLib.includes('passwordHash'), 'export documents omitted secrets');
  assert(gdprLib.includes('omissions'), 'export documents omissions');

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main();
