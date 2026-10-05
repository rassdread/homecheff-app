/**
 * Smallest HomeCheff measurement funnel.
 * Database rows are the business totals. Browser events are consent-gated signals.
 * This module does not emit events.
 */

export const CANONICAL_FUNNEL = [
  {
    stage: 'visitor',
    definition: 'Someone opened HomeCheff.',
    sourceOfTruth: 'GA4 page_view after analytics consent. The URL is reduced to the path plus campaign UTMs.',
    measurableNow: true,
    historical: false,
    limitation: 'Visitors who refuse analytics cookies are not in GA4. The database does not store anonymous visits.',
  },
  {
    stage: 'discovery',
    definition: 'They started using the marketplace, not merely loaded a page.',
    sourceOfTruth: 'No dedicated discovery event. A feed page view is not treated as discovery.',
    measurableNow: false,
    historical: false,
    limitation: 'Search text is intentionally not sent to Google or Meta.',
  },
  {
    stage: 'intent',
    definition: 'They submitted a proposal. Saving, following, or opening a form is not this stage.',
    sourceOfTruth: 'AnalyticsEvent buyer_interaction, plus the Proposal table.',
    measurableNow: true,
    historical: true,
    limitation: 'Historical proposals exist. The analytics event exists only from the day it was wired.',
  },
  {
    stage: 'registration',
    definition: 'A new account was created. A later login is not a registration.',
    sourceOfTruth: 'User row. GA4 sign_up and Meta CompleteRegistration only when the account was just created.',
    measurableNow: true,
    historical: true,
    limitation: 'Meta and GA4 miss people who registered without the matching consent. The user table does not.',
  },
  {
    stage: 'activation',
    definition: 'First meaningful action for a capability: save or paid order (buyer), first quality published product (seller), first published service, affiliate seat with a usable link, or completed delivery setup.',
    sourceOfTruth: 'User.acquisitionActivatedAt and sellerActivatedAt, AnalyticsEvent service_provider_activated and affiliate_activated, DeliveryProfile completion.',
    measurableNow: true,
    historical: true,
    limitation: 'The first activation kind stored on the user is buyer or seller and is never overwritten. Service, affiliate, and delivery are separate records. Opening Workspace or choosing a role is not activation.',
  },
  {
    stage: 'transaction_start',
    definition: 'A proposal was created. A message or a contact click is not a transaction.',
    sourceOfTruth: 'Proposal table and AnalyticsEvent buyer_interaction.',
    measurableNow: true,
    historical: true,
    limitation: 'Accepted agreements and community orders are a later stage, stored on those tables, not a separate ads event.',
  },
  {
    stage: 'value',
    definition: 'Stripe recorded a paid amount above zero. A free or unpaid order is not a purchase.',
    sourceOfTruth: 'Order and Stripe payment status. AnalyticsEvent purchase. Meta Purchase is a count only, after marketing consent.',
    measurableNow: true,
    historical: true,
    limitation: 'Meta does not receive the amount. HC-only exchanges are transaction_completed, not purchase.',
  },
  {
    stage: 'return',
    definition: 'A buyer who already had a paid order completes another one.',
    sourceOfTruth: 'AnalyticsEvent buyer_repeat_transaction and later qualifying orders.',
    measurableNow: true,
    historical: true,
    limitation: 'A later visit with no new paid order is not counted. There is no cohort warehouse.',
  },
] as const;

export type CanonicalFunnelStage = (typeof CANONICAL_FUNNEL)[number]['stage'];
