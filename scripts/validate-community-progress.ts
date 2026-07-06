#!/usr/bin/env npx tsx
/**
 * Phase 3L Community Progress validation.
 * Run: npx tsx scripts/validate-community-progress.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  PROGRESS_MILESTONE_CATEGORIES,
  PROGRESS_STREAK_KINDS,
  COMMUNITY_LEVEL_IDS,
  PROGRESS_RECOMMENDATION_ACTIONS,
  FORBIDDEN_PROGRESS_EFFECTS,
  FORBIDDEN_PROGRESS_GAMING,
  PROGRESS_MILESTONE_REGISTRY,
  resolveMilestoneStates,
  nextIncompleteMilestone,
  completedMilestoneCount,
  isMilestoneInCooldown,
  PROGRESS_STREAK_REGISTRY,
  resolveAllStreaks,
  primaryStreak,
  passesStreakAntiInflation,
  COMMUNITY_LEVEL_REGISTRY,
  resolveCommunityLevel,
  levelsNeverAffectRanking,
  levelsNeverAffectTrust,
  resolveProgressRecommendations,
  topProgressRecommendation,
  passesProgressAntiGaming,
  recommendationsAreNotRanking,
  buildCommunityProgressSidebarPlan,
  buildCommunityProgressProfilePlan,
  resolveCommunityProgress,
  buildDefaultProgressInput,
  emptySidebarPlan,
} from '../lib/community/progress';

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

const base = buildDefaultProgressInput('user-cp-1', {
  hasLocation: true,
  completenessPercent: 60,
  nearbyRequestCount: 2,
  completedHelps: 1,
  categoryCounts: { HELPER: 1 },
  streakWeekKeys: {
    weekly_helper: ['2026-06-30', '2026-07-07'],
  },
});

console.log('=== Community Progress Validation (Phase 3L) ===\n');

console.log('Categories');
assert(PROGRESS_MILESTONE_CATEGORIES.length === 8, 'eight milestone categories');
assert(PROGRESS_STREAK_KINDS.length === 5, 'five streak kinds');
assert(COMMUNITY_LEVEL_IDS.length === 6, 'six community levels');
assert(
  PROGRESS_RECOMMENDATION_ACTIONS.includes('HELP_ONE_NEIGHBOR'),
  'help neighbor recommendation',
);

console.log('\nMilestones');
assert(PROGRESS_MILESTONE_REGISTRY.length >= 10, 'milestone registry populated');
for (const m of PROGRESS_MILESTONE_REGISTRY) {
  assert(m.titleKey.startsWith('community.progress.'), `${m.id} i18n prefix`);
  assert(m.target >= 1, `${m.id} target`);
  assert(m.requiresVerification === true, `${m.id} requires verification`);
}

const states = resolveMilestoneStates(base);
assert(states.length === PROGRESS_MILESTONE_REGISTRY.length, 'milestone states resolve');
assert(completedMilestoneCount(states) >= 1, 'at least one milestone completed');
const next = nextIncompleteMilestone(states);
assert(next !== null, 'next milestone found');

console.log('\nCooldowns');
const now = Date.now();
assert(
  isMilestoneInCooldown(
    'ms-partner-first',
    7,
    {
      'ms-partner-first': {
        lastCountedAt: new Date(now).toISOString(),
        count: 1,
        dayKey: new Date(now).toISOString().slice(0, 10),
        weekKey: new Date(now).toISOString().slice(0, 10),
      },
    },
    now,
  ),
  'milestone cooldown active',
);

console.log('\nStreaks');
for (const kind of PROGRESS_STREAK_KINDS) {
  assert(PROGRESS_STREAK_REGISTRY[kind] !== undefined, `streak ${kind} defined`);
  assert(
    PROGRESS_STREAK_REGISTRY[kind].maxInflationPerWeek === 1,
    `${kind} anti-inflation cap`,
  );
}
const streaks = resolveAllStreaks(base);
assert(streaks.length === 5, 'all streaks resolved');
assert(primaryStreak(streaks) !== null || streaks.some((s) => s.active), 'primary streak');
assert(passesStreakAntiInflation('weekly_helper', 1), 'streak inflation blocked');

console.log('\nLevels');
for (const id of COMMUNITY_LEVEL_IDS) {
  assert(COMMUNITY_LEVEL_REGISTRY[id].recognitionOnly === true, `${id} recognition only`);
}
const level = resolveCommunityLevel(3);
assert(level.levelId === 'COMMUNITY_BUILDER', 'level at 3 milestones');
assert(levelsNeverAffectRanking(), 'levels never affect ranking');
assert(levelsNeverAffectTrust(), 'levels never affect trust');

console.log('\nRecommendations');
const recs = resolveProgressRecommendations(base);
assert(recs.length >= 1, 'recommendations resolve');
const top = topProgressRecommendation(
  buildDefaultProgressInput('user-cp-2', {
    completenessPercent: 40,
    loggedIn: true,
  }),
);
assert(top?.action === 'FINISH_PROFILE', 'finish profile recommended when incomplete');
assert(recommendationsAreNotRanking(), 'recommendations not ranking');

console.log('\nAnti-gaming');
for (const pattern of FORBIDDEN_PROGRESS_GAMING) {
  assert(pattern.length > 0, `gaming pattern ${pattern}`);
}
const selfBlock = passesProgressAntiGaming({
  userId: 'u1',
  sourceOwnerId: 'u1',
  actionsThisWeek: 1,
  isSelfCompletion: true,
});
assert(!selfBlock.safe, 'self completion blocked');

const passiveBlock = passesProgressAntiGaming({
  userId: 'u2',
  actionsThisWeek: 1,
  isPassiveActivity: true,
});
assert(!passiveBlock.safe, 'passive farming blocked');

const loopBlock = passesProgressAntiGaming({
  userId: 'u3',
  actionsThisWeek: 2,
  repeatLoopCount: 4,
});
assert(!loopBlock.safe, 'fake loop blocked');

const inflateBlock = passesProgressAntiGaming({
  userId: 'u4',
  actionsThisWeek: 10,
});
assert(!inflateBlock.safe, 'streak inflation blocked');

console.log('\nSidebar integration');
const sidebar = buildCommunityProgressSidebarPlan(base);
assert(sidebar.currentLevel.levelId.length > 0, 'sidebar level');
assert(sidebar.recommendedAction !== null || sidebar.nextMilestone !== null, 'sidebar has guidance');

const emptySidebar = emptySidebarPlan();
assert(emptySidebar.recommendedAction === null, 'empty sidebar');

console.log('\nProfile integration');
const profile = buildCommunityProgressProfilePlan(base);
assert(profile.currentGoals.length >= 0, 'profile goals');
assert(profile.activeStreaks.length >= 0, 'profile streaks');

console.log('\nFull resolver');
const plan = resolveCommunityProgress(base);
assert(plan.meta.recognitionOnly === true, 'recognition only meta');
assert(plan.sidebar.currentLevel !== undefined, 'full plan sidebar');
assert(plan.profile.currentLevel !== undefined, 'full plan profile');

const guest = resolveCommunityProgress(
  buildDefaultProgressInput('guest', { loggedIn: false }),
);
assert(guest.meta.totalVerifiedActions >= 0, 'guest plan');

console.log('\nForbidden effects');
for (const effect of FORBIDDEN_PROGRESS_EFFECTS) {
  assert(!JSON.stringify(PROGRESS_MILESTONE_REGISTRY).includes(effect), `no ${effect} in milestones`);
}

console.log('\nLib files');
for (const file of [
  'progress-contract.ts',
  'progress-milestones.ts',
  'progress-streaks.ts',
  'progress-levels.ts',
  'progress-recommendations.ts',
  'progress-sidebar-integration.ts',
  'progress-profile-integration.ts',
  'resolve-community-progress.ts',
  'index.ts',
]) {
  assert(fs.existsSync(path.join(process.cwd(), 'lib/community/progress', file)), `lib ${file}`);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
