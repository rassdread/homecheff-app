import type { GuidanceHit } from '../guidance/types';
import type { PersonalRouteCard } from './types';
import { cardFamilyOf, hitTiming } from './prioritize';
import { PERSONAL_ROUTE_COPY } from './copy';
import type { CardFamily } from './types';

function friendlyCta(hit: GuidanceHit): GuidanceHit['rule']['cta'] {
  if (cardFamilyOf(hit.rule.id) !== 'reporting' || !hit.rule.cta) return hit.rule.cta ?? null;
  return { ...hit.rule.cta, label: PERSONAL_ROUTE_COPY.dac7Cta };
}

function friendlyBody(hit: GuidanceHit): { title: string; body: string } {
  const family = cardFamilyOf(hit.rule.id);
  if (family === 'reporting') {
    return { title: PERSONAL_ROUTE_COPY.dac7Title, body: PERSONAL_ROUTE_COPY.dac7Body };
  }
  if (hit.rule.id.includes('vat.entrepreneurship_review')) {
    return { title: PERSONAL_ROUTE_COPY.vatReviewTitle, body: hit.rule.shortText };
  }
  if (hit.rule.id.includes('vat.registration_exceeded') || hit.rule.id.includes('vat.registration_possible')) {
    return { title: PERSONAL_ROUTE_COPY.growthVat, body: hit.rule.shortText };
  }
  if (hit.rule.id.includes('nvwa.once_per_year')) {
    return { title: PERSONAL_ROUTE_COPY.nvwaOnceTitle, body: hit.rule.shortText };
  }
  if (hit.rule.id.includes('nvwa.few_times_non_business')) {
    return { title: PERSONAL_ROUTE_COPY.nvwaFewTimesTitle, body: hit.rule.shortText };
  }
  if (hit.rule.id.includes('nvwa.review')) {
    return { title: PERSONAL_ROUTE_COPY.nvwaReviewTitle, body: hit.rule.shortText };
  }
  if (hit.rule.id.includes('nvwa.registration_required')) {
    return { title: PERSONAL_ROUTE_COPY.nvwaRequiredTitle, body: hit.rule.shortText };
  }
  if (family === 'optimization' || hit.rule.id.includes('.kor.')) {
    return { title: PERSONAL_ROUTE_COPY.korTitle, body: hit.rule.shortText };
  }
  if (hit.rule.id.includes('ww.wait_permission')) {
    return {
      title: 'Wacht op toestemming van UWV',
      body: 'Zolang UWV nog geen toestemming heeft, wacht je met starten. Daarna kun je verder.',
    };
  }
  if (hit.rule.id.includes('ww.discuss_before_start')) {
    return {
      title: 'Bespreek je plan met UWV',
      body: 'Dat is de ene stap die je nu eerst doet. Daarna kun je verder met verkopen.',
    };
  }
  if (hit.rule.id.includes('bijstand.discuss_municipality')) {
    return {
      title: 'Bespreek dit met je gemeente',
      body: 'Je gemeente bepaalt de regels voor bijverdienen vanuit de bijstand. Dat is de ene stap die je nu eerst doet.',
    };
  }
  if (hit.rule.id.includes('bijstand.bbz_review')) {
    return {
      title: 'Extra hulp bij starten beoordeelt de gemeente',
      body: hit.rule.shortText,
    };
  }
  if (hit.rule.id.includes('bijstand.local_policy')) {
    return {
      title: 'Vraag de regels na bij jouw gemeente',
      body: hit.rule.shortText,
    };
  }
  if (hit.rule.id.includes('kvk.incidental') || hit.rule.id.includes('kvk.insufficient')) {
    return { title: PERSONAL_ROUTE_COPY.kvkLaterTitle, body: PERSONAL_ROUTE_COPY.kvkLaterBody };
  }
  if (family === 'business_registration' || hit.rule.id.includes('.kvk.')) {
    return {
      title: hit.rule.shortTitle.replace(/\bKVK\b/, 'Kamer van Koophandel (KVK)'),
      body: hit.rule.shortText.replace(/\bKVK\b/, 'Kamer van Koophandel (KVK)'),
    };
  }
  return { title: hit.rule.shortTitle, body: hit.rule.shortText };
}

function toCard(hit: GuidanceHit, primary: boolean): PersonalRouteCard {
  const family = cardFamilyOf(hit.rule.id);
  const text = friendlyBody(hit);
  return {
    id: hit.rule.id,
    family,
    timing: hitTiming(hit),
    severity: hit.rule.severity,
    title: text.title,
    body: text.body,
    sourceRuleIds: [hit.rule.id],
    cta: friendlyCta(hit),
    officialSource: hit.rule.officialSource,
    officialSourceUrl: hit.rule.officialSourceUrl,
    primary,
  };
}

const MERGE_NOW: ReadonlySet<CardFamily> = new Set([
  'food_safety',
  'business_registration',
]);

function groupingFamily(family: CardFamily, ruleId: string): CardFamily {
  if (family === 'food_allergen' && ruleId.includes('food.allergens')) {
    return 'food_safety';
  }
  return family;
}

function mergeGroup(hits: GuidanceHit[], family: CardFamily, primary: boolean): PersonalRouteCard {
  const first = hits[0];
  if (!first) {
    throw new Error('mergeGroup requires hits');
  }
  if (family === 'food_safety') {
    const nvwa = hits.some((h) => h.rule.id.includes('nvwa.registration_required'));
    return {
      id: 'personal.food.safety_combined',
      family,
      timing: 'NOW',
      severity: hits.some((h) => h.rule.severity === 'ACTION') ? 'ACTION' : first.rule.severity,
      title: PERSONAL_ROUTE_COPY.foodCombinedTitle,
      body: nvwa
        ? `${PERSONAL_ROUTE_COPY.foodCombinedBody} ${PERSONAL_ROUTE_COPY.foodRegistrationExtra}`
        : PERSONAL_ROUTE_COPY.foodCombinedBody,
      sourceRuleIds: hits.map((h) => h.rule.id),
      cta: nvwa ? (hits.find((h) => h.rule.id.includes('nvwa.registration_required'))?.rule.cta ?? first.rule.cta ?? null) : null,
      officialSource: nvwa ? first.rule.officialSource : null,
      officialSourceUrl: nvwa ? first.rule.officialSourceUrl : null,
      primary,
    };
  }
  if (family === 'business_registration') {
    const grown = hits.some(
      (h) =>
        h.rule.id.includes('vat.registration_exceeded') ||
        h.rule.id.includes('nvwa.registration_required'),
    );
    const titles = hits.map((h) => h.rule.shortText);
    return {
      id: 'personal.business.combined',
      family,
      timing: 'NOW',
      severity: hits.some((h) => h.rule.severity === 'ACTION') ? 'ACTION' : first.rule.severity,
      title: grown ? PERSONAL_ROUTE_COPY.growthBusiness : first.rule.shortTitle,
      body: titles[0] ?? first.rule.shortText,
      sourceRuleIds: hits.map((h) => h.rule.id),
      cta: first.rule.cta ?? null,
      officialSource: first.rule.officialSource,
      officialSourceUrl: first.rule.officialSourceUrl,
      primary,
    };
  }
  return toCard(first, primary);
}

/**
 * Combine related NOW hits. Never drop source ids — extras go to restDetails.
 */
export function deduplicateNowHits(hits: readonly GuidanceHit[]): PersonalRouteCard[] {
  const now = hits.filter((h) => hitTiming(h) === 'NOW');
  const skipped = now.filter((h) => {
    const f = cardFamilyOf(h.rule.id);
    return f === 'start' || f === 'tracking';
  });
  void skipped;
  const usable = now.filter((h) => {
    const f = cardFamilyOf(h.rule.id);
    return f !== 'start' && f !== 'tracking';
  });

  const grouped = new Map<CardFamily, GuidanceHit[]>();
  for (const hit of usable) {
    const family = groupingFamily(cardFamilyOf(hit.rule.id), hit.rule.id);
    const list = grouped.get(family) ?? [];
    list.push(hit);
    grouped.set(family, list);
  }

  const cards: PersonalRouteCard[] = [];
  for (const [family, group] of grouped) {
    if (MERGE_NOW.has(family) && group.length > 1) {
      cards.push(mergeGroup(group, family, true));
    } else {
      for (const hit of group) {
        cards.push(toCard(hit, true));
      }
    }
  }
  return cards;
}

export function hitsToTimedCards(
  hits: readonly GuidanceHit[],
  timing: 'SOON' | 'LATER',
): PersonalRouteCard[] {
  return hits.filter((h) => hitTiming(h) === timing).map((h) => toCard(h, false));
}
