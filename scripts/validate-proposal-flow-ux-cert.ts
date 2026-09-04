#!/usr/bin/env npx tsx
/**
 * Static + unit certification gates for proposal UX repair (mobile CTA,
 * listing title lock, view-item vs view-proposal, snapshot integrity,
 * buyer-private CONCEPT draft vs explicit send).
 */
import fs from 'fs';
import path from 'path';
import assert from 'node:assert/strict';
import { buildProposalSummary } from '../lib/proposals/proposal-settlement';
import { EMPTY_PROPOSAL_FORM } from '../lib/proposals/proposal-form-types';
import { isMeaningfulProposalDraft } from '../lib/proposals/proposal-draft-storage';

const root = process.cwd();
function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

console.log('=== Proposal flow UX certification ===\n');

const sheet = read('components/chat/proposals/CreateProposalSheet.tsx');
assert.match(sheet, /safe-area-inset-bottom/, 'sticky footer safe-area');
assert.match(sheet, /preventImplicitEnterSubmit/, 'no Enter auto-submit');
assert.match(sheet, /saveProposalDraft/, 'close persists buyer-private draft');
assert.match(sheet, /clearProposalDraft/, 'explicit send clears draft');
assert.match(sheet, /lockListingTitle/, 'listing title locked in sheet');
assert.match(sheet, /Idempotency-Key/, 'client idempotency header');
assert.match(sheet, /data-hc-proposal-submit/, 'explicit submit CTA marker');
assert.match(sheet, /data-hc-proposal-sticky-cta/, 'sticky CTA region');
assert.match(sheet, /z-\[80\]/, 'sheet above bottom nav z-65');
assert.match(sheet, /visualViewport/, 'keyboard-aware sticky CTA');
assert.match(sheet, /data-hc-proposal-submit-blocked-reason/, 'disabled reason visible');
assert.match(sheet, /92dvh|90dvh/, 'dvh-aware sheet height');

const draftCard = read('components/chat/proposals/ProposalDraftCard.tsx');
assert.match(draftCard, /data-hc-proposal-draft-card/, 'concept card marker');
assert.match(draftCard, /data-hc-proposal-draft-private/, 'draft marked private');
assert.match(draftCard, /proposal\.actions\.editDraft/, 'Voorstel bewerken');
assert.match(draftCard, /proposal\.status\.concept/, 'CONCEPT status');
assert.match(draftCard, /proposal\.card\.notSentYet/, 'Nog niet verstuurd');

const chatBox = read('components/chat/ChatBox.tsx');
assert.match(chatBox, /ProposalDraftCard/, 'ChatBox hosts private draft card');
assert.match(chatBox, /onDraftChanged/, 'draft refresh wired');
assert.match(chatBox, /CreateProposalSheet/, 'production sheet host');

const fields = read('components/chat/proposals/ProposalFieldsSection.tsx');
assert.match(fields, /titleLocked/, 'title lock branch');
assert.match(fields, /proposal\.fields\.messageLabel/, 'separate message field');

const card = read('components/chat/proposals/ProposalCard.tsx');
assert.match(card, /proposal\.actions\.viewItem/, 'card Bekijk item');
assert.match(card, /proposal\.actions\.viewProposal/, 'card Bekijk voorstel');
assert.match(card, /proposal\.card\.aboutListing/, 'card clarifies listing identity');
assert.match(card, /proposal\.status\.sent/, 'sent status for creator pending');
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

assert.equal(isMeaningfulProposalDraft(EMPTY_PROPOSAL_FORM), false);
assert.equal(
  isMeaningfulProposalDraft({
    ...EMPTY_PROPOSAL_FORM,
    amountEuros: '12,50',
  }),
  true,
);

const nl = JSON.parse(read('public/i18n/nl.json'));
const en = JSON.parse(read('public/i18n/en.json'));
assert.equal(nl.proposal.actions.send, 'Voorstel versturen');
assert.equal(nl.proposal.actions.viewItem, 'Bekijk item');
assert.equal(nl.proposal.actions.viewProposal, 'Bekijk voorstel');
assert.equal(nl.proposal.actions.editDraft, 'Voorstel bewerken');
assert.equal(nl.proposal.actions.accept, 'Voorstel accepteren');
assert.equal(nl.proposal.actions.reject, 'Voorstel afwijzen');
assert.equal(nl.proposal.actions.counter, 'Tegenvoorstel');
assert.equal(nl.proposal.status.concept, 'Concept');
assert.equal(nl.proposal.status.sent, 'Verstuurd');
assert.equal(nl.proposal.card.notSentYet, 'Nog niet verstuurd');
assert.equal(nl.proposal.errors.moneyAmountRequired, 'Vul eerst een bedrag in.');
assert.equal(
  nl.proposal.productBinding.paymentPathRequired,
  'Kies eerst een betaalmethode.',
);
assert.equal(nl.chat.context.viewItem, 'Bekijk item');
assert.equal(en.proposal.actions.viewItem, 'View item');
assert.equal(en.chat.context.viewItem, 'View item');
assert.equal(en.proposal.actions.editDraft, 'Edit proposal');

console.log('All proposal UX certification checks passed.');
