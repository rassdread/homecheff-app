import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { buildAffiliateCommissionCatalog } from '@/lib/affiliate/commission-catalog';
import {
  DEFAULT_SCENARIO_LEVEL,
  GOAL_TARGETS_EUR,
  assumptionsFor,
  assumptionsWithoutAddOns,
  canonicalScenarioRates,
  commissionForCustomerCount,
  compareScenarioLevels,
  quoteIncomeGoal,
  starterOnlyCustomersForGoal,
} from '@/lib/affiliate/goal-scenarios';
import { growthStarterShareCents } from '@/lib/affiliate/portfolio-scenario';
import { NETWORK_CAPABILITY } from '@/lib/affiliate/network-capability';
import { calculatorFocusForFit } from '@/lib/affiliate/network-fit';

const root = '/Users/sergioarrias/HomeCheffProjects/homecheff-app';

function assertReaches(targetEur: number, level: 'conservative' | 'mixed' | 'ambitious') {
  const assumptions = assumptionsFor(level, 'multi');
  const quote = quoteIncomeGoal({ targetEur, assumptions });
  const parts =
    quote.partCents.growth +
    quote.partCents.studio +
    quote.partCents.studioTopUp +
    quote.partCents.marketplacePlans +
    quote.partCents.orders +
    quote.partCents.deliveries;
  assert.equal(assumptions.includeNetwork, false);
  assert.equal(quote.networkCents, 0);
  assert.equal(quote.reachable, true);
  assert.equal(parts, quote.ownCents);
  assert.equal(quote.calculatedCents, quote.ownCents);
  assert.equal(quote.deltaCents, quote.calculatedCents - targetEur * 100);
  assert.ok(quote.calculatedCents >= targetEur * 100);
  assert.ok(quote.ownCustomers > 0);
  assert.ok(commissionForCustomerCount(quote.ownCustomers - 1, assumptions) < targetEur * 100);
  const without = quoteIncomeGoal({
    targetEur,
    assumptions: assumptionsWithoutAddOns(assumptions),
  });
  assert.ok(without.ownCustomers > quote.ownCustomers);
  return quote;
}

describe('affiliate income goals', () => {
  it('reads direct and MAIN amounts from the commission catalog', () => {
    const rates = canonicalScenarioRates();
    const catalog = buildAffiliateCommissionCatalog();
    const cents = (id: string) => catalog.find((row) => row.id === id);
    assert.equal(rates.growthDirect.starter, cents('growth-starter')?.affiliateCents);
    assert.equal(rates.growthDirect.pro, cents('growth-pro')?.affiliateCents);
    assert.equal(rates.growthDirect.business, cents('growth-business')?.affiliateCents);
    assert.equal(rates.growthDirect.enterprise, cents('growth-enterprise')?.affiliateCents);
    assert.equal(rates.growthDirect.starter, 1575);
    assert.equal(rates.growthDirect.pro, 2550);
    assert.equal(rates.growthDirect.business, 4950);
    assert.equal(rates.growthDirect.enterprise, 10950);
    const share = growthStarterShareCents();
    assert.equal(rates.growthMain.starter, share.mainCents);
    assert.equal(cents('growth-starter')?.networkSubCents, share.subCents);
    assert.equal(share.mainCents + share.subCents, share.directCents);
    assert.equal(rates.studioDirect.creator, cents('studio-creator')?.affiliateCents);
    assert.equal(rates.marketplaceDirect.basic, cents('marketplace-plan-basic')?.affiliateCents);
    assert.equal(rates.marketplaceMain.basic, cents('marketplace-plan-basic')?.networkMainCents);
    assert.equal(rates.orderCents, cents('marketplace-buyer')?.affiliateCents);
    assert.equal(rates.deliveryCents, cents('delivery-fee')?.affiliateCents);
    const source = readFileSync(`${root}/lib/affiliate/goal-scenarios.ts`, 'utf8');
    assert.equal(source.includes('1575'), false);
    assert.equal(source.includes('2550'), false);
  });

  it('defaults to a mixed multi-service example and keeps Starter as a comparison', () => {
    assert.equal(DEFAULT_SCENARIO_LEVEL, 'mixed');
    const mixed = assumptionsFor('mixed', 'multi');
    assert.equal(mixed.growthMixBps.starter, 4000);
    assert.ok(mixed.growthMixBps.pro > 0);
    assert.ok(mixed.growthMixBps.enterprise > 0);
    assert.equal(mixed.includeNetwork, false);
    assert.ok(mixed.studioCrossSellBps > 0 && mixed.studioCrossSellBps < 10000);
    const conservative = assumptionsFor('conservative', 'growth');
    const starter = starterOnlyCustomersForGoal(10000);
    const quote = quoteIncomeGoal({ targetEur: 10000, assumptions: conservative });
    assert.equal(quote.ownCustomers, starter);
    assert.ok(starter > quoteIncomeGoal({ targetEur: 10000, assumptions: assumptionsFor('mixed', 'multi') }).ownCustomers);
  });

  it('reconciles every public goal against the catalog mix', () => {
    for (const target of GOAL_TARGETS_EUR) {
      const compared = compareScenarioLevels(target, 'multi');
      assert.ok(compared.conservative.ownCustomers > compared.mixed.ownCustomers);
      assert.ok(compared.mixed.ownCustomers > compared.ambitious.ownCustomers);
      for (const level of ['conservative', 'mixed', 'ambitious'] as const) {
        const quote = assertReaches(target, level);
        assert.equal(quote.weightedCentsPerCustomer, quote.ownCents / quote.ownCustomers);
      }
    }
  });

  it('keeps network income out until the switch is on, and only as MAIN', () => {
    const off = quoteIncomeGoal({
      targetEur: 10000,
      assumptions: assumptionsFor('mixed', 'multi'),
    });
    const on = quoteIncomeGoal({
      targetEur: 10000,
      assumptions: assumptionsFor('mixed', 'multi', {
        includeNetwork: true,
        subAffiliates: 5,
        customersPerSub: 10,
      }),
    });
    assert.equal(off.networkCents, 0);
    assert.ok(on.networkCents > 0);
    assert.ok(on.ownCents + on.networkCents >= 1_000_000);
    assert.ok(on.ownCustomers < off.ownCustomers);
    const studio = quoteIncomeGoal({
      targetEur: 2000,
      assumptions: assumptionsFor('mixed', 'studio', {
        includeNetwork: true,
        subAffiliates: 5,
        customersPerSub: 10,
      }),
    });
    assert.equal(studio.networkCents, 0);
    assert.equal(studio.networkApplies, false);
  });

  it('removes the one-sub public claim and explains temporary Early coverage', () => {
    const note = NETWORK_CAPABILITY.publicNoteNl;
    assert.equal(/één sub-affiliate|one sub-affiliate/i.test(note), false);
    assert.match(note, /Vroege instap/);
    assert.match(note, /directe SUB-affiliates/);
    assert.match(note, /geen volgende laag/);
    assert.match(note, /nieuwe affiliates/);
    assert.match(note, /MAIN-rechten bij HomeCheff aanvragen/);
    assert.match(note, /HomeCheff beoordeelt de aanvraag/);
    assert.match(note, /Bestaande rechten binnen Vroege instap blijven gelden/);
    const page = [
      readFileSync(`${root}/components/affiliate/AffiliateBusinessStory.tsx`, 'utf8'),
      readFileSync(`${root}/components/affiliate/AffiliateCountryInterestForm.tsx`, 'utf8'),
      readFileSync(`${root}/lib/affiliate/proposition-faqs.ts`, 'utf8'),
      readFileSync(`${root}/lib/affiliate/network-capability.ts`, 'utf8'),
    ].join('\n');
    assert.equal(/één sub-affiliate|one sub-affiliate|keurt je niet goed|opent het land niet|geen goedkeuring|geen activering/i.test(page), false);
    assert.match(page, /Geef mijn interesse door/);
    assert.match(page, /HomeCheff is al actief in/);
    assert.match(note, /beoordeelt de aanvraag/);
    assert.equal(calculatorFocusForFit(['business']), 'growth');
    assert.equal(calculatorFocusForFit(['creators']), 'studio');
    assert.equal(calculatorFocusForFit(['makers']), 'marketplace');
    assert.equal(calculatorFocusForFit(['buyers']), null);
    assert.equal(calculatorFocusForFit(['mixed']), 'multi');
    assert.equal(calculatorFocusForFit(['buyers', 'business']), 'multi');
    assert.equal(calculatorFocusForFit(['partners']), null);
    const fit = readFileSync(`${root}/components/affiliate/AffiliateNetworkFit.tsx`, 'utf8');
    assert.match(fit, /Wie ken jij/);
    assert.match(fit, /Begin bij wie je al kent/);
    assert.equal(/werkt voor iedereen|Dit wordt je inkomen/i.test(fit), false);
    assert.equal(/href=.*main/i.test(fit), false);
  });
});
