#!/usr/bin/env npx tsx
/**
 * Phase 5G-B deal commitment & payment trust copy validation.
 * Run: npx tsx scripts/validate-marketplace-deal-commitment.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

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

console.log('=== Marketplace Deal Commitment & Payment Trust (Phase 5G-B) ===\n');

const proposalCard = readRepoFile('components/chat/proposals/ProposalCard.tsx');
assert(
  proposalCard.includes('DEAL_COMMITMENT_I18N.acceptLabel'),
  'ProposalCard uses commitment accept label',
);
assert(
  proposalCard.includes('commitmentAccepted'),
  'ProposalCard tracks commitment checkbox state',
);
assert(
  proposalCard.includes('commitmentAccepted: true'),
  'ProposalCard sends commitmentAccepted on accept',
);
assert(
  proposalCard.includes('DEAL_COMMITMENT_I18N.directRisk'),
  'ProposalCard shows direct-contact risk before accept',
);

const createSheet = readRepoFile('components/chat/proposals/CreateProposalSheet.tsx');
assert(
  createSheet.includes('DEAL_COMMITMENT_I18N.homecheffHint'),
  'CreateProposalSheet shows HomeCheff security hint',
);
assert(
  createSheet.includes('PROPOSAL_I18N.payment.homecheffRecommended'),
  'CreateProposalSheet shows recommended badge',
);
assert(
  createSheet.includes('HOMECHEFF_CHECKOUT') && createSheet.includes('.sort('),
  'CreateProposalSheet sorts HomeCheff payment first',
);

const dealCard = readRepoFile('components/chat/proposals/DealCard.tsx');
assert(
  dealCard.includes("paymentPath === 'DIRECT_CONTACT'"),
  'DealCard shows direct-contact risk after accept',
);
assert(
  dealCard.includes('DEAL_COMMITMENT_I18N.homecheffHint'),
  'DealCard shows HomeCheff hint when checkout required',
);

const acceptRoute = readRepoFile('app/api/proposals/[proposalId]/accept/route.ts');
assert(
  acceptRoute.includes('commitmentAccepted'),
  'Accept API parses commitmentAccepted from body',
);

const proposalService = readRepoFile('lib/proposals/proposal-service.ts');
assert(
  proposalService.includes('commitmentAccepted !== true'),
  'ProposalService rejects accept without commitment',
);
assert(
  proposalService.includes('commitmentAcceptedAt'),
  'ProposalService stores commitmentAcceptedAt in agreement snapshot',
);
assert(
  proposalService.includes('commitmentAcceptedById'),
  'ProposalService stores commitmentAcceptedById in agreement snapshot',
);

const settlement = readRepoFile('lib/proposals/proposal-settlement.ts');
assert(
  settlement.includes('commitmentAcceptedAt'),
  'AgreementSummarySnapshot includes commitment fields',
);

const i18nKeys = readRepoFile('lib/proposals/proposal-i18n-keys.ts');
assert(
  i18nKeys.includes('DEAL_COMMITMENT_I18N'),
  'DEAL_COMMITMENT_I18N registry exported',
);
assert(
  i18nKeys.includes('commitmentRequired'),
  'commitmentRequired error key registered',
);

const nl = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/i18n/nl.json'), 'utf8'),
) as Record<string, unknown>;
const en = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/i18n/en.json'), 'utf8'),
) as Record<string, unknown>;

function dig(obj: Record<string, unknown>, pathKeys: string[]): unknown {
  let cur: unknown = obj;
  for (const k of pathKeys) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

for (const [locale, data] of [
  ['nl', nl],
  ['en', en],
] as const) {
  assert(
    typeof dig(data, ['deal', 'commitment', 'acceptLabel']) === 'string',
    `${locale}: deal.commitment.acceptLabel`,
  );
  assert(
    typeof dig(data, ['deal', 'commitment', 'homecheffHint']) === 'string',
    `${locale}: deal.commitment.homecheffHint`,
  );
  assert(
    typeof dig(data, ['deal', 'commitment', 'directRisk']) === 'string',
    `${locale}: deal.commitment.directRisk`,
  );
  assert(
    typeof dig(data, ['proposal', 'payment', 'homecheffRecommended']) === 'string',
    `${locale}: proposal.payment.homecheffRecommended`,
  );
  assert(
    typeof dig(data, ['proposal', 'errors', 'commitmentRequired']) === 'string',
    `${locale}: proposal.errors.commitmentRequired`,
  );
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
