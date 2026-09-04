#!/usr/bin/env npx tsx
/**
 * Static + unit certification gates for proposal UX repair (mobile CTA,
 * listing title lock, view-item vs view-proposal, snapshot integrity).
 */
import fs from 'fs';
import path from 'path';
import assert from 'node:assert/strict';
import { buildProposalSummary } from '../lib/proposals/proposal-settlement';

const root = process.cwd();
function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

console.log('=== Proposal flow UX certification ===\n');

const sheet = read('components/chat/proposals/CreateProposalSheet.tsx');
assert.match(sheet, /safe-area-inset-bottom/, 'sticky footer safe-area');
assert.match(sheet, /preventImplicitEnterSubmit/, 'no Enter auto-submit');
assert.match(sheet, /discardConfirm/, 'close ≠ send');
assert.match(sheet, /lockListingTitle/, 'listing title locked in sheet');
assert.match(sheet, /Idempotency-Key/, 'client idempotency header');
assert.match(sheet, /data-hc-proposal-submit/, 'explicit submit CTA marker');
assert.match(sheet, /max-h-\[min\(90dvh,90vh\)\]/, 'dvh-aware sheet height');

const fields = read('components/chat/proposals/ProposalFieldsSection.tsx');
assert.match(fields, /titleLocked/, 'title lock branch');
assert.match(fields, /proposal\.fields\.messageLabel/, 'separate message field');

const card = read('components/chat/proposals/ProposalCard.tsx');
assert.match(card, /proposal\.actions\.viewItem/, 'card Bekijk item');
assert.match(card, /proposal\.card\.aboutListing/, 'card clarifies listing identity');
assert.doesNotMatch(
  card,
  /Bekijk aanbod/,
  'proposal card must not use Bekijk aanbod for proposal CTA',
);

const header = read('components/chat/ConversationContextHeader.tsx');
assert.match(header, /chat\.context\.viewItem/, 'header Bekijk item');
assert.doesNotMatch(header, /'Bekijk aanbod'/, 'header not labeled Bekijk aanbod');

const service = read('lib/proposals/proposal-service.ts');
assert.match(
  service,
  /Product-bound proposals always use the listing title/,
  'server forces listing title',
);
assert.match(service, /listingTitle: productCtx\?\.title/, 'snapshot listingTitle');
assert.match(service, /listingImageUrl: productCtx\?\.imageUrl/, 'snapshot listingImageUrl');
assert.match(service, /listingPriceCents: productCtx\?\.priceCents/, 'snapshot listingPriceCents');
assert.match(service, /fields\.resolvedTitle/, 'persists resolvedTitle');

const snap = buildProposalSummary({
  settlementMode: 'MONEY',
  amountCents: 1250,
  title: 'Verse appels',
  productId: 'p1',
  listingTitle: 'Verse appels',
  listingImageUrl: 'https://example.com/a.jpg',
  listingPriceCents: 1500,
});
assert.equal(snap.listingTitle, 'Verse appels');
assert.equal(snap.listingPriceCents, 1500);
assert.equal(snap.amountCents, 1250);
assert.notEqual(snap.amountCents, snap.listingPriceCents);

const nl = JSON.parse(read('public/i18n/nl.json'));
const en = JSON.parse(read('public/i18n/en.json'));
assert.equal(nl.proposal.actions.send, 'Voorstel versturen');
assert.equal(nl.proposal.actions.viewItem, 'Bekijk item');
assert.equal(nl.proposal.actions.viewProposal, 'Bekijk voorstel');
assert.equal(nl.proposal.actions.accept, 'Voorstel accepteren');
assert.equal(nl.proposal.actions.reject, 'Voorstel afwijzen');
assert.equal(nl.proposal.actions.counter, 'Tegenvoorstel');
assert.equal(nl.chat.context.viewItem, 'Bekijk item');
assert.equal(en.proposal.actions.viewItem, 'View item');
assert.equal(en.chat.context.viewItem, 'View item');

console.log('All proposal UX certification checks passed.');
