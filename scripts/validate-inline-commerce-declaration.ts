/**
 * Inline LEGAL-1 commerce declaration in consumer info.
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
assert.match(api, /getSellerCommerceContextForUserId/);
assert.doesNotMatch(api, /sellerId.*body|body\.sellerId/);

const disclosure = read('components/legal/ConsumerCommerceDisclosure.tsx');
assert.match(disclosure, /allowInlineDeclaration/);
assert.match(disclosure, /\/api\/seller\/commerce-declaration/);
assert.match(disclosure, /PRIVATE_OCCASIONAL/);
assert.match(disclosure, /SELF_DECLARED_PROFESSIONAL/);
assert.match(disclosure, /data-hc-inline-commerce-declaration/);
assert.match(disclosure, /window\.confirm/);

const card = read('components/chat/proposals/ProposalCard.tsx');
assert.match(card, /viewerIsSeller/);
assert.match(card, /allowInlineDeclaration/);
assert.match(card, /applyDeclaredCommerce/);
assert.match(card, /canAct.*reject|runAction\("reject"\)/);

const settings = read('components/settings/SellerCommerceDeclarationSettings.tsx');
assert.match(settings, /\/api\/seller\/commerce-declaration/);

const nl = read('public/i18n/nl.json');
assert.match(nl, /"heading": "Geef eenmalig aan hoe je dit aanbiedt"/);
assert.match(nl, /"private": "Als particulier"/);
assert.match(nl, /"professional": "Als professioneel \/ bedrijf"/);

const en = read('public/i18n/en.json');
assert.match(en, /"private": "As a private individual"/);

// No new trader flags
assert.doesNotMatch(disclosure, /isTrader|isProfessional\b|isPrivate\b/);

console.log('validate-inline-commerce-declaration: OK');
