#!/usr/bin/env npx tsx
/**
 * Phase 5E-D exchange proposal conversion polish validation.
 * Run: npx tsx scripts/validate-marketplace-exchange-proposal-conversion.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { pickDisplaySignalLabelKeys } from '../lib/marketplace/exchange-suggestions/exchange-suggestion-signal-display';
import { buildDesiredExchangesForDetail } from '../lib/marketplace/detail/detail-value-exchange-block';
import {
  buildMessagesWithProposalOpenUrl,
  PROPOSAL_OPEN_QUERY_PARAM,
} from '../lib/proposals/proposal-deep-link';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed += 1;
  } else {
    console.log(`  ✗ FAIL: ${label}`);
    failed += 1;
  }
}

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

console.log('=== Marketplace Exchange Proposal Conversion (Phase 5E-D) ===\n');

console.log('Proposal deep-link');
assert(
  buildMessagesWithProposalOpenUrl('abc').includes(`${PROPOSAL_OPEN_QUERY_PARAM}=1`),
  'buildMessagesWithProposalOpenUrl includes openProposal=1',
);
assert(
  buildMessagesWithProposalOpenUrl('abc').includes('conversation=abc'),
  'buildMessagesWithProposalOpenUrl includes conversation id',
);

const startChat = readRepoFile('components/chat/StartChatButton.tsx');
assert(startChat.includes('openProposalAfterStart'), 'StartChatButton supports openProposalAfterStart');
assert(startChat.includes('buildMessagesWithProposalOpenUrl'), 'StartChatButton uses proposal deep-link URL');

const proposalAction = readRepoFile('components/product/detail/ProductSaleProposalAction.tsx');
assert(proposalAction.includes('openProposalAfterStart'), 'ProductSaleProposalAction enables proposal deep-link');

const chatBox = readRepoFile('components/chat/ChatBox.tsx');
assert(chatBox.includes('initialOpenProposal'), 'ChatBox accepts initialOpenProposal');
assert(chatBox.includes('setShowCreateProposal(true)'), 'ChatBox opens CreateProposalSheet');

const messagesPage = readRepoFile('app/messages/page.tsx');
assert(messagesPage.includes('initialOpenProposal'), 'messages page passes initialOpenProposal');
assert(messagesPage.includes('parseOpenProposalFromSearchParams'), 'messages page parses openProposal param');

console.log('\nMobile suggestion CTA parity');
const mobileModule = readRepoFile(
  'components/marketplace/exchange-suggestions/ExchangeSuggestionsMobileModule.tsx',
);
assert(
  mobileModule.includes('ExchangeSuggestionCardView'),
  'mobile module uses ExchangeSuggestionCardView (desktop parity)',
);
assert(!mobileModule.includes('Bekijk ruilmogelijkheid'), 'mobile module no longer listing-only CTA band');

const suggestionCard = readRepoFile(
  'components/marketplace/exchange-suggestions/ExchangeSuggestionCard.tsx',
);
assert(suggestionCard.includes('pickDisplaySignalLabelKeys'), 'suggestion card shows signal chips');
assert(suggestionCard.includes('start_conversation'), 'suggestion card retains start_conversation CTA');
assert(
  suggestionCard.includes('StartChatButton') && suggestionCard.includes('counterpartyListingId'),
  'suggestion start_conversation uses product-bound StartChatButton',
);
assert(!suggestionCard.includes('messages?user='), 'suggestion no longer uses broken messages?user link');

console.log('\nPhase 5E-E mobile sticky + context');
const stickyCta = readRepoFile('components/product/detail/ProductSaleStickyCta.tsx');
assert(stickyCta.includes('StartChatButton'), 'sticky CTA uses StartChatButton for proposal-first');
assert(stickyCta.includes('openProposalAfterStart'), 'sticky CTA opens proposal deep-link');
assert(!stickyCta.includes("scrollToCta('commerce-proposal-cta')"), 'sticky no longer scrolls to proposal button');
assert(stickyCta.includes('skipModal'), 'sticky skips chat modal');

assert(startChat.includes('skipModal'), 'StartChatButton supports skipModal');
assert(startChat.includes('buildMessagesConversationUrl'), 'StartChatButton uses conversation URL helper');

console.log('\nMatch transparency');
const labels = pickDisplaySignalLabelKeys(
  ['STRONG_CATEGORY_OVERLAP', 'EXACT_DESIRED_MATCH'],
  2,
);
assert(labels.length === 2, 'pickDisplaySignalLabelKeys returns max 2');
assert(
  labels[0] === 'marketplace.exchange.signals.exactDesiredMatch',
  'higher-priority signal first',
);

console.log('\nDesired exchange rendering');
const desired = buildDesiredExchangesForDetail({
  listingIntent: 'REQUEST',
  marketplaceCategory: 'GROW',
  specializations: ['grow.herbs'],
  listingTitle: 'Fresh herbs wanted',
});
assert(desired.length === 1, 'buildDesiredExchangesForDetail maps REQUEST specializations');

const valueSection = readRepoFile('components/product/detail/ProductValueExchangeSection.tsx');
assert(valueSection.includes('buildDesiredExchangesForDetail'), 'ProductValueExchangeSection builds desired');
assert(valueSection.includes('barter.seeks'), 'ProductValueExchangeSection renders seeks heading');

console.log('\nMONEY listing copy alignment');
const secondaryContact = readRepoFile('components/product/detail/ProductSaleSecondaryContact.tsx');
assert(
  secondaryContact.includes('commercePathContact'),
  'MONEY secondary contact uses commercePathContact (no barter copy)',
);
assert(
  !secondaryContact.includes('commercePathChat'),
  'MONEY secondary contact removed commercePathChat',
);

const nl = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/i18n/nl.json'), 'utf8'),
) as Record<string, unknown>;
const hint = String(
  (nl.marketplace as Record<string, unknown>)?.exchangeSuggestions &&
    ((nl.marketplace as Record<string, Record<string, unknown>>).exchangeSuggestions.hint as string),
);
assert(!hint.includes('discovery-ranking'), 'NL hint has no discovery-ranking');

console.log('\nProposal form copy');
const createSheet = readRepoFile('components/chat/proposals/CreateProposalSheet.tsx');
assert(
  createSheet.includes('offeredInReturnHeading'),
  'CreateProposalSheet uses offered-in-return heading for value picker',
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}
