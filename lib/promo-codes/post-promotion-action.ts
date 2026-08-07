/**
 * Post-promotion subscription behaviour (Prisma-free).
 * CONTINUE = resume list price / paid billing after promo.
 * END = entitlement/subscription ends; no further charge.
 */

export const POST_PROMOTION_ACTIONS = ['CONTINUE', 'END'] as const;
export type PostPromotionAction = (typeof POST_PROMOTION_ACTIONS)[number];

export const DEFAULT_POST_PROMOTION_ACTION: PostPromotionAction = 'CONTINUE';

export function parsePostPromotionAction(raw: unknown): {
  ok: true;
  value: PostPromotionAction;
} | { ok: false; error: string } {
  if (raw === undefined || raw === null || raw === '') {
    return { ok: true, value: DEFAULT_POST_PROMOTION_ACTION };
  }
  const v = String(raw).trim().toUpperCase();
  if (v === 'CONTINUE' || v === 'END') {
    return { ok: true, value: v };
  }
  return {
    ok: false,
    error: 'postPromotionAction must be CONTINUE or END',
  };
}

export function normalizePostPromotionAction(
  raw: unknown,
): PostPromotionAction {
  const parsed = parsePostPromotionAction(raw);
  return parsed.ok ? parsed.value : DEFAULT_POST_PROMOTION_ACTION;
}

/** UI / quote helpers — NL + EN short lines. */
export function postPromotionBehaviourCopy(params: {
  action: PostPromotionAction;
  basePriceCents: number;
  discountDurationCycles: number | null;
  locale?: 'nl' | 'en';
}): { afterLabelNl: string; afterLabelEn: string; resumesAtListPrice: boolean; endsAutomatically: boolean } {
  const action = normalizePostPromotionAction(params.action);
  const euros = `€${(params.basePriceCents / 100).toFixed(
    params.basePriceCents % 100 === 0 ? 0 : 2,
  )}`;
  if (action === 'END') {
    return {
      afterLabelNl:
        'Abonnement eindigt automatisch na de promotieperiode. Geen betaling daarna.',
      afterLabelEn:
        'Subscription ends automatically after the promotional period. No payment afterwards.',
      resumesAtListPrice: false,
      endsAutomatically: true,
    };
  }
  return {
    afterLabelNl: `Daarna: ${euros} / maand tot je opzegt.`,
    afterLabelEn: `After that: ${euros} / month until cancelled.`,
    resumesAtListPrice: params.discountDurationCycles != null,
    endsAutomatically: false,
  };
}
