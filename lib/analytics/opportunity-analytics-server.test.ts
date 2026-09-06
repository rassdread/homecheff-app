import assert from 'node:assert/strict';

const CLIENT_TO_CANONICAL: Record<string, string> = {
  opportunity_hub_view: 'OPPORTUNITY_HUB_VIEW',
  opportunity_card_click: 'OPPORTUNITY_CARD_CLICK',
  opportunity_share_intent: 'OPPORTUNITY_SHARE_INTENT',
  opportunity_share_link_copied: 'OPPORTUNITY_SHARE_LINK_COPIED',
  opportunity_share_native_opened: 'OPPORTUNITY_SHARE_NATIVE_OPENED',
  opportunity_share_link_created: 'OPPORTUNITY_SHARE_LINK_CREATED',
};

function normalizeOpportunityEventType(raw: string): string {
  const t = raw.trim();
  return CLIENT_TO_CANONICAL[t] ?? t;
}

assert.equal(normalizeOpportunityEventType('opportunity_hub_view'), 'OPPORTUNITY_HUB_VIEW');
assert.equal(normalizeOpportunityEventType('OPPORTUNITY_SHARE_INTENT'), 'OPPORTUNITY_SHARE_INTENT');

console.log('opportunity-analytics-server.test.ts: ok');
