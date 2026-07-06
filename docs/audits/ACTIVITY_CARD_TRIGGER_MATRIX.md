# Activity Card Trigger Matrix

**Phase:** 3A  
**Source:** `ACTIVITY_CARD_TRIGGER_MATRIX` + `TRIGGER_SIGNAL_SOURCES`

---

## Trigger signals

| Trigger ID | Signal | Data source |
|------------|--------|-------------|
| `logged_in` | Session present | next-auth |
| `no_listings` | productCount === 0 | ProfileV2Stats |
| `has_listings` | productCount > 0 | ProfileV2Stats |
| `no_reviews_received` | product reviewCount === 0 | DiscoveryTrustContract |
| `profile_incomplete` | completeness &lt; 100% | computeCompletenessItems |
| `no_profile_photo` | !profileImage | User |
| `no_location` | !city && !place && !coords | User |
| `has_location` | geo present | User |
| `favorites_without_conversations` | favorites > 0, no chats | Favorite + Conversation |
| `completed_deal_without_review` | completed order, no review | Order + ProductReview |
| `pending_review_request` | unanswered review | ProductReview |
| `nearby_requests_available` | REQUEST in radius | Feed pool |
| `no_fans` | follower count === 0 | Follow |
| `no_accepted_values` | !acceptedSpecializations | SellerProfile |
| `no_inspiration_posts` | dishCount === 0 | ProfileV2Stats |
| `no_stripe_connected` | !stripeConnectAccountId | User |
| `has_seller_role` | sellerRoles.length > 0 | User |
| `is_seller` | SellerProfile exists | SellerProfile |
| `has_delivery_profile` | DeliveryProfile exists | DeliveryProfile |
| `no_delivery_profile` | !DeliveryProfile | DeliveryProfile |

**Forbidden:** HCP points, view counts, blended ratings.

---

## Card → required triggers

| Card ID | Category | Required triggers |
|---------|----------|-------------------|
| `share_qr_code` | social | logged_in, has_profile_photo |
| `start_conversation` | social | logged_in, favorites_without_conversations |
| `become_a_fan` | social | logged_in, no_fans |
| `invite_someone` | social | logged_in |
| `ask_for_review` | trust | logged_in, is_seller, has_listings, no_reviews_received |
| `leave_review_after_deal` | trust | logged_in, completed_deal_without_review |
| `respond_to_review` | trust | logged_in, is_seller, pending_review_request |
| `publish_first_offer` | marketplace | logged_in, has_seller_role, no_listings |
| `create_first_workshop` | marketplace | logged_in, has_seller_role, has_listings |
| `respond_to_request` | marketplace | logged_in, nearby_requests_available |
| `add_listing_media` | marketplace | logged_in, is_seller, has_listings |
| `request_delivery` | delivery | logged_in, has_listings |
| `offer_delivery` | delivery | logged_in, no_delivery_profile |
| `complete_delivery_profile` | delivery | logged_in, has_delivery_profile |
| `publish_inspiration` | community | logged_in, no_inspiration_posts |
| `engage_with_neighbor` | community | logged_in, has_location |
| `complete_profile` | profile | logged_in, profile_incomplete |
| `add_profile_photo` | profile | logged_in, no_profile_photo |
| `configure_accepted_values` | profile | logged_in, is_seller, no_accepted_values |
| `add_workspace_photos` | profile | logged_in, has_seller_role |
| `connect_stripe` | profile | logged_in, is_seller, no_stripe_connected |
| `set_location` | local | logged_in, no_location |
| `explore_nearby_requests` | local | logged_in, has_location, nearby_requests_available |
| `invite_nearby` | local | logged_in, has_location |

---

## Priority resolution

When multiple cards eligible, `selectEligibleActivityCards` sorts:

1. `critical` → `high` → `normal` → `low`
2. Stable tie-break by card id

Anti-spam cooldowns apply **after** priority sort (no bypass).
