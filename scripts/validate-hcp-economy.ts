#!/usr/bin/env npx tsx
/**
 * Phase 3K HCP Economy validation.
 * Run: npx tsx scripts/validate-hcp-economy.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  HCP_REWARD_CATEGORIES,
  HCP_REWARD_ACTIONS,
  FORBIDDEN_HCP_EFFECTS,
  CATEGORY_LIMIT_DEFAULTS,
  FORBIDDEN_HCP_GAMING_PATTERNS,
  passesAntiGaming,
  validateHcpRewardContract,
  evaluateHcpRewardEligibility,
  suppressDuplicateHcpRewards,
  isInHcpRewardCooldown,
  exceedsDailyCap,
  hcpNeverAffectsDiscovery,
  validateRecognitionTypes,
  hcpRecognitionDoesNotAffectTrust,
  listActivationHcpRewards,
  listOpportunityHcpRewards,
  resolveActivationHcpReward,
  resolveOpportunityHcpReward,
  resolveHcpEconomy,
  buildHcpSidebarIntegrationPlan,
  allHcpEconomyContracts,
  OPPORTUNITY_HCP_REWARD_REGISTRY,
} from '../lib/hcp/economy';
import { OPPORTUNITY_TYPES } from '../lib/discovery/opportunities';

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

console.log('=== HCP Economy Validation (Phase 3K) ===\n');

console.log('Categories & actions');
assert(HCP_REWARD_CATEGORIES.length === 7, 'seven reward categories');
assert(HCP_REWARD_ACTIONS.length === 12, 'twelve reward actions');
assert(
  HCP_REWARD_ACTIONS.includes('COMMUNITY_HELPER_COMPLETION'),
  'community helper action defined',
);

console.log('\nContracts');
const all = allHcpEconomyContracts();
assert(all.length >= 13, 'activation + opportunity contracts');
for (const c of all) {
  const check = validateHcpRewardContract(c);
  assert(check.valid, `${c.id} contract valid`);
  assert(c.titleKey.startsWith('hcp.economy.'), `${c.id} i18n prefix`);
  assert(validateRecognitionTypes(c.recognition).valid, `${c.id} recognition valid`);
}

console.log('\nOpportunity registry');
for (const type of OPPORTUNITY_TYPES) {
  assert(OPPORTUNITY_HCP_REWARD_REGISTRY[type] !== undefined, `hcp reward for ${type}`);
}

console.log('\nReward limits');
for (const cat of HCP_REWARD_CATEGORIES) {
  const limits = CATEGORY_LIMIT_DEFAULTS[cat];
  assert(limits.dailyCap >= 1, `${cat} daily cap`);
  assert(limits.weeklyCap >= limits.dailyCap, `${cat} weekly >= daily`);
  assert(limits.cooldownHours >= 1, `${cat} cooldown`);
}

console.log('\nAnti-gaming');
for (const pattern of FORBIDDEN_HCP_GAMING_PATTERNS) {
  assert(pattern.length > 0, `gaming pattern ${pattern}`);
}
const selfRef = passesAntiGaming({
  userId: 'u1',
  action: 'INVITE_BUSINESS',
  sourceId: 'src1',
  inviteeUserId: 'u1',
});
assert(!selfRef.safe, 'self referral blocked');

const workshopLoop = passesAntiGaming({
  userId: 'u2',
  action: 'HOST_WORKSHOP',
  sourceId: 'ws1',
  workshopRepeatCount: 4,
});
assert(!workshopLoop.safe, 'fake workshop loop blocked');

const inviteSpam = passesAntiGaming({
  userId: 'u3',
  action: 'INVITE_SPORTS_CLUB',
  sourceId: 'club1',
  invitationCount24h: 10,
});
assert(!inviteSpam.safe, 'invitation spam blocked');

console.log('\nCooldowns & caps');
const contract = listOpportunityHcpRewards()[0]!;
const ledgerKey = 'opportunity:PARTNER';
const now = Date.now();
assert(
  isInHcpRewardCooldown(
    ledgerKey,
    {
      [ledgerKey]: {
        lastAwardedAt: new Date(now).toISOString(),
        dailyCount: 1,
        weeklyCount: 1,
        dayKey: new Date(now).toISOString().slice(0, 10),
        weekKey: new Date(now).toISOString().slice(0, 10),
      },
    },
    contract.limits,
    now,
  ),
  'cooldown active after award',
);
assert(
  exceedsDailyCap(
    ledgerKey,
    'PARTNER',
    {
      [ledgerKey]: {
        lastAwardedAt: null,
        dailyCount: 99,
        weeklyCount: 1,
        dayKey: new Date(now).toISOString().slice(0, 10),
        weekKey: new Date(now).toISOString().slice(0, 10),
      },
    },
    now,
  ),
  'daily cap enforced',
);

console.log('\nDuplicate suppression');
const duped = suppressDuplicateHcpRewards([
  { id: 'a', action: 'BECOME_PARTNER', category: 'PARTNER' },
  { id: 'b', action: 'BECOME_PARTNER', category: 'PARTNER' },
  { id: 'c', action: 'HELP_NEIGHBOR', category: 'HELPER' },
]);
assert(duped.length === 2, 'duplicate action suppressed');

console.log('\nResolvers');
const activationReward = resolveActivationHcpReward({
  activationId: 'PN01',
  category: 'PRACTICAL_NEIGHBORHOOD',
  userId: 'user-hcp-1',
});
assert(activationReward !== null, 'activation hcp reward resolves');

const oppReward = resolveOpportunityHcpReward({
  opportunityType: 'PARTNER',
  userId: 'user-hcp-1',
});
assert(oppReward !== null, 'opportunity hcp reward resolves');

const economy = resolveHcpEconomy({
  userId: 'user-hcp-1',
  loggedIn: true,
  activation: { id: 'PN01', category: 'PRACTICAL_NEIGHBORHOOD' },
  opportunityType: 'AMBASSADOR',
});
assert(economy.eligibleRewards.length >= 1, 'economy resolver returns rewards');

const guest = resolveHcpEconomy({ userId: 'guest', loggedIn: false });
assert(guest.eligibleRewards.length === 0, 'guest gets no hcp rewards');

console.log('\nSidebar integration');
const sidebar = buildHcpSidebarIntegrationPlan({
  userId: 'user-hcp-1',
  completedActivationCount: 2,
  completedOpportunityCount: 1,
  currentStreak: 3,
  pendingOpportunityType: 'COURIER',
});
assert(sidebar.recommendedAction !== null, 'recommended action present');
assert(sidebar.nextMilestone !== null, 'next milestone present');
assert(sidebar.progressPercent >= 0, 'progress percent');

console.log('\nForbidden effects');
assert(hcpNeverAffectsDiscovery(), 'hcp never affects discovery');
assert(hcpRecognitionDoesNotAffectTrust(), 'recognition does not affect trust');
for (const effect of FORBIDDEN_HCP_EFFECTS) {
  assert(!JSON.stringify(all).includes(effect), `contracts exclude ${effect}`);
}

console.log('\nEligibility');
const blocked = evaluateHcpRewardEligibility(
  contract,
  ledgerKey,
  {
    [ledgerKey]: {
      lastAwardedAt: new Date(now).toISOString(),
      dailyCount: 1,
      weeklyCount: 1,
      dayKey: new Date(now).toISOString().slice(0, 10),
      weekKey: new Date(now).toISOString().slice(0, 10),
    },
  },
  {
    userId: 'u1',
    action: contract.action,
    sourceId: 'PARTNER',
    isVerifiedCompletion: true,
  },
  now,
);
assert(!blocked.eligible, 'cooldown blocks eligibility');

console.log('\nLib files');
for (const file of [
  'hcp-reward-contract.ts',
  'hcp-reward-rules.ts',
  'hcp-activation-rewards.ts',
  'hcp-opportunity-rewards.ts',
  'hcp-recognition.ts',
  'hcp-sidebar-integration.ts',
  'resolve-hcp-economy.ts',
  'index.ts',
]) {
  assert(fs.existsSync(path.join(process.cwd(), 'lib/hcp/economy', file)), `lib ${file}`);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
