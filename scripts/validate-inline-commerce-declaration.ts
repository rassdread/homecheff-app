/**
 * Inline LEGAL-1 commerce declaration UX (labels + confirm + cache).
 * Run: npx tsx scripts/validate-inline-commerce-declaration.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8');

const api = read('app/api/seller/commerce-declaration/route.ts');
assert.match(api, /export async function PUT/);
assert.match(api, /applyCommerceDeclarationUpdate/);
assert.doesNotMatch(api, /sellerId.*body|body\.sellerId/);

const disclosure = read('components/legal/ConsumerCommerceDisclosure.tsx');
assert.match(disclosure, /allowInlineDeclaration/);
assert.match(disclosure, /\/api\/seller\/commerce-declaration/);
assert.match(disclosure, /PRIVATE_OCCASIONAL/);
assert.match(disclosure, /SELF_DECLARED_PROFESSIONAL/);
assert.match(disclosure, /data-hc-inline-commerce-declaration/);
assert.match(disclosure, /tOr\(/);
assert.match(disclosure, /Als particulier/);
assert.match(disclosure, /Als professioneel \/ bedrijf/);
assert.match(disclosure, /Hoe bied je aan op HomeCheff\?/);
assert.match(disclosure, /data-hc-inline-commerce-confirm/);
assert.match(disclosure, /Bevestigen/);
assert.match(disclosure, /Annuleren/);
assert.match(disclosure, /Opslaan…/);
assert.doesNotMatch(disclosure, /window\.confirm/);
assert.doesNotMatch(disclosure, /isTrader|isProfessional\b|isPrivate\b/);

const hook = read('hooks/useTranslation.ts');
assert.match(hook, /CACHE_VERSION = '2\.37'/);

const card = read('components/chat/proposals/ProposalCard.tsx');
assert.match(card, /viewerIsSeller/);
assert.match(card, /allowInlineDeclaration/);
assert.match(card, /applyDeclaredCommerce/);

const settings = read('components/settings/SellerCommerceDeclarationSettings.tsx');
assert.match(settings, /\/api\/seller\/commerce-declaration/);

const nl = JSON.parse(read('public/i18n/nl.json'));
assert.equal(nl.legal3.inlineDeclaration.heading, 'Hoe bied je aan op HomeCheff?');
assert.equal(nl.legal3.inlineDeclaration.private, 'Als particulier');
assert.equal(
  nl.legal3.inlineDeclaration.professional,
  'Als professioneel / bedrijf',
);
assert.equal(nl.legal3.inlineDeclaration.confirm, 'Bevestigen');
assert.equal(nl.legal3.inlineDeclaration.cancel, 'Annuleren');
assert.equal(nl.legal3.inlineDeclaration.saving, 'Opslaan…');

const en = JSON.parse(read('public/i18n/en.json'));
assert.equal(en.legal3.inlineDeclaration.heading, 'How do you offer on HomeCheff?');
assert.equal(en.legal3.inlineDeclaration.private, 'As a private individual');
assert.equal(en.legal3.inlineDeclaration.confirm, 'Confirm');
assert.equal(en.legal3.inlineDeclaration.cancel, 'Cancel');
assert.equal(en.legal3.inlineDeclaration.saving, 'Saving…');

console.log('validate-inline-commerce-declaration: OK');
