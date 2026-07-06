# Activation Library — 100 Concepts

**Phase:** 3C — Architecture only  
**Last updated:** 2026-07-06  
**Format:** `{ID}` · **Name** — Real-world outcome · *Trigger hint*

---

## COMMUNITY (C01–C10)

| ID | Activation | Real-world outcome | Trigger hint |
|----|------------|-------------------|--------------|
| C01 | Welcome a new neighbour | Introduce yourself in person or via message | New user within 2 km |
| C02 | Thank someone who helped you | Send message or note after deal | Completed deal 7d ago |
| C03 | Attend a local meetup | Show up at listed community moment | Event listing nearby |
| C04 | Share food with a neighbour | Offer surplus from garden/kitchen | GROW/CREATE seller + harvest season tag |
| C05 | Join a neighbourhood swap | Participate in barter meet | Barter openness + local scope |
| C06 | Celebrate a local maker | Visit profile and leave genuine fan message | High deal count maker nearby |
| C07 | Support a community starter | Buy first item from new seller | Seller &lt; 30 days, 0 deals |
| C08 | Bring a friend to a workshop | Two tickets / buddy attendance | Workshop capacity &gt; 2 |
| C09 | Leave a tip in kind | Non-monetary thank-you (produce, help) | Post-positive review |
| C10 | Reconnect with past seller | Repeat local purchase | Prior order &gt; 90 days |

---

## LOCAL (L01–L10)

| ID | Activation | Real-world outcome | Trigger hint |
|----|------------|-------------------|--------------|
| L01 | Set your home base | Accurate pickup/discovery radius | `no_location` |
| L02 | Explore within 5 km | Walk/drive local feed intent | GPS + narrow radius |
| L03 | Pick up instead of ship | Collect item at maker | Listing pickup available |
| L04 | Visit a maker's workspace | On-site collection or tour | Workspace photos present |
| L05 | Buy from walking distance | Single-neighbourhood purchase | Distance &lt; 2 km |
| L06 | Discover your street's makers | Scan hyperlocal listings | Place name match |
| L07 | Attend farmers' market-style pickup | Scheduled local pickup window | Seller pickup slots |
| L08 | Map your local favourites | Save places you visit | 3+ favourites, no visits logged |
| L09 | Try a new postcode nearby | Expand radius once | Stale location &gt; 90d |
| L10 | Shop hyperlocal this week | Intent pledge, not feed boost | Weekly local campaign tag |

---

## SOCIAL (S01–S10)

| ID | Activation | Real-world outcome | Trigger hint |
|----|------------|-------------------|--------------|
| S01 | Share your QR code | In-person profile share | Profile photo set (3B `SHARE_QR`) |
| S02 | Start a conversation | Message before buying | Favourite without thread |
| S03 | Become a fan | Follow maker genuinely | Viewed profile 2+ times |
| S04 | Invite a friend | Personal welkom link | Logged in (3B `INVITE_FRIEND`) |
| S05 | Introduce two neighbours | Connect buyer and seller you know | Dual favourites same category |
| S06 | Share a workshop invite | Forward event to friend | Host role + upcoming workshop |
| S07 | Post inspiration offline | Show dish photo at club/school | Creator + inspiration posted |
| S08 | Message after inspiration | Ask question about recipe/technique | Inspiration saved |
| S09 | Invite family to pickup | Group pickup coordination | Large order / workshop |
| S10 | Share a help request | Amplify neighbour need ethically | Nearby REQUEST, voluntary share sheet |

---

## DISCOVERY (D01–D10)

| ID | Activation | Real-world outcome | Trigger hint |
|----|------------|-------------------|--------------|
| D01 | Meet a local maker | Visit profile + optional message | New creator in radius |
| D02 | Browse nearby requests | Find someone to help | REQUEST pool &gt; 0 |
| D03 | Find a workshop this month | Book or message host | WORKSHOP date in 30d |
| D04 | Explore a new category | Try GROW/DESIGN/etc. locally | Single-category history |
| D05 | Discover inspiration near you | Visit dish from local creator | Inspiration + distance |
| D06 | Match specialization overlap | Explore barter-compatible offer | Accepted values overlap |
| D07 | Visit a trusted maker | Profile visit → pickup | Trusted tier seller nearby |
| D08 | Find seasonal produce | Local GROW listings | Season tag + GROW |
| D09 | Explore coaching nearby | Book session | COACHING in radius |
| D10 | Open today's local board | Conscious browse, capped time UX | Morning local ritual tag |

---

## EARN (E01–E10)

| ID | Activation | Real-world outcome | Trigger hint |
|----|------------|-------------------|--------------|
| E01 | Publish first listing | First product live | No listings (3B) |
| E02 | Complete first sale | Deliver or handoff item | Listing live, 0 deals |
| E03 | Connect Stripe | Receive payment | Seller, no Stripe |
| E04 | Complete first barter | Non-cash value exchange | Barter listing + match |
| E05 | Set fair pickup price | Transparent local pricing | ON_REQUEST listing |
| E06 | Offer delivery locally | Self-delivery radius | Seller + no delivery flag |
| E07 | Earn from workshop | Host paid session | Workshop listing |
| E08 | Volunteer contribution listing | Vrijwillige bijdrage offer | VOLUNTARY price model |
| E09 | Complete courier delivery | Paid delivery leg | Courier role active |
| E10 | Repeat customer thank-you | Discount or note to repeat buyer | `repeatCustomers` &gt; 0 |

---

## PARTNER (P01–P10)

| ID | Activation | Real-world outcome | Trigger hint |
|----|------------|-------------------|--------------|
| P01 | Become courier | Onboard delivery profile | No delivery profile (3B) |
| P02 | Become workshop host | Publish KNOWLEDGE listing | Seller, no workshop |
| P03 | Become ambassador | Welkom referrals with tracking | 3+ successful invites |
| P04 | Become partner (generic) | Platform partner agreement | Application flow |
| P05 | Invite local business | Shop joins as seller | Business user role |
| P06 | Invite municipality | Civic pilot / market link | Ambassador + institution tag |
| P07 | Invite school | Students/makers program | Institution tag |
| P08 | Invite sports club | Team catering / fundraising | Club tag |
| P09 | Host partner onboarding day | In-person onboarding event | Partner ops calendar |
| P10 | Mentor a new seller | Paired support call/visit | Established seller tier |

---

## HELP (H01–H10)

| ID | Activation | Real-world outcome | Trigger hint |
|----|------------|-------------------|--------------|
| H01 | Respond to nearby request | Message or proposal on REQUEST | Nearby REQUEST (3B) |
| H02 | Help a neighbour in need | Voluntary aid, no purchase | REQUEST + HELP tag |
| H03 | Offer garden surplus | Donate/swap produce | GROW + surplus |
| H04 | Lend tools for a day | Practical help listing | PRACTICAL_SERVICE |
| H05 | Support elderly neighbour | Pickup/delivery assistance | Courier + HELP |
| H06 | Answer a beginner question | Message support | New user question thread |
| H07 | Fulfill urgent request | Needed-by date soon | `neededBy` within 48h |
| H08 | Community repair help | Fix/mend offer | repair specialization |
| H09 | Meal for someone in need | CHEFF + voluntary | REQUEST voluntary compensation |
| H10 | Post what you need | Create REQUEST listing | Buyer, never posted request |

---

## WORKSHOP (W01–W10)

| ID | Activation | Real-world outcome | Trigger hint |
|----|------------|-------------------|--------------|
| W01 | Host first workshop | Publish dated event | ADD_WORKSHOP (3B) |
| W02 | Attend a workshop | Show up on date | Workshop bookmarked |
| W03 | Bring materials list | Prepared participant | Workshop description lists materials |
| W04 | Visit workshop location | Travel to venue | `workshopLocation` set |
| W05 | Fill last seat | Join before capacity 0 | `capacityRemaining` low |
| W06 | Co-host with neighbour | Joint workshop listing | Two sellers same specialisation |
| W07 | Repeat workshop series | Schedule next date | Past workshop host |
| W08 | Kids/family workshop | Family attendance | Family-safe tag |
| W09 | Outdoor workshop | On-site nature session | onSite fulfillment |
| W10 | Online + local hybrid | Join stream then local practice | onlineSession flag |

---

## CREATOR (R01–R10)

| ID | Activation | Real-world outcome | Trigger hint |
|----|------------|-------------------|--------------|
| R01 | Complete profile | Photo, bio, roles | PROFILE_COMPLETION (3B) |
| R02 | Add profile photo | Trust via face | `no_profile_photo` |
| R03 | Verify email | Account trust | VERIFY_ACCOUNT (3B) |
| R04 | Publish first inspiration | Dish/recipe/garden post | UPLOAD_FIRST_INSPIRATION (3B) |
| R05 | Add workspace photos | Show where you create | COMPLETE_WORKSPACE (3B) |
| R06 | Configure accepted values | Barter tags | No accepted specializations |
| R07 | Add listing media | Photos/video on product | Listing without media |
| R08 | Write honest description | Clear offer text | Short description |
| R09 | Set availability date | Workshop/service date | Missing date on timed offer |
| R10 | Tell your maker story | Bio + inspiration link | Low completeness |

---

## BUSINESS (B01–B10)

| ID | Activation | Real-world outcome | Trigger hint |
|----|------------|-------------------|--------------|
| B01 | Invite corner shop | Local retailer onboard | Ambassador |
| B02 | Invite bakery/chef | Food business | CREATE category ambassador |
| B03 | Invite sports canteen | Club catering | PARTNER club tag |
| B04 | Invite school canteen | Institutional | Institution tag |
| B05 | Invite gemeente market | Civic market stall | Municipality tag |
| B06 | Invite makerspace | Shared workspace partners | DESIGN/CREATE hub |
| B07 | Invite garden association | Tuinvereniging | GROW cluster |
| B08 | Invite charity stall | Fundraising presence | Voluntary + BUSINESS |
| B09 | Local business week | Collective onboarding window | Campaign tag |
| B10 | Cross-promote ethically | Mutual shout-out offline | Two businesses same town |

---

## Index by 3B implementation status

| 3B live | Library IDs |
|---------|-------------|
| Yes | R01, R04, R05, R03, W01, P01, S01, S04, H01, E01, C07 (partial) |
| Planned 3D | Remaining 89 |

---

## Usage rules

1. One primary category per activation.
2. Surface max 2 activations per session (inherited 3B).
3. Viral-tier concepts flagged in [VIRAL_ACTIVATION_CONCEPTS.md](./VIRAL_ACTIVATION_CONCEPTS.md) — subset of above.
4. Eligibility via [REAL_WORLD_ACTIVATION_ENGINE.md](./REAL_WORLD_ACTIVATION_ENGINE.md) — never ranking.

**Total: 100 activations** (C10 + L10 + S10 + D10 + E10 + P10 + H10 + W10 + R10 + B10).
