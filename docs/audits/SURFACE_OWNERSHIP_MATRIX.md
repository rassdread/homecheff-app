# Surface Ownership Matrix

**Phase:** 3D audit  
**Last updated:** 2026-07-06

---

## Legend

| Code | Surface |
|------|---------|
| L | Desktop left sidebar |
| R | Desktop right sidebar |
| H | Homepage hero |
| F | Feed center (desktop + mobile) |
| FI | Feed insert (mobile / interleaved) |
| AC | Activity card |
| SP | Sponsored placement |
| PS | Profile owner |
| SH | Sheet / drawer |
| PU | Push / notification (future) |
| — | Not on this surface |

**Primary** = canonical home; **Secondary** = allowed duplicate with dedup; **Teaser** = guest-limited.

---

## Core content types

| Content type | L | R | H | F | FI | AC | SP | PS | SH | PU |
|--------------|---|---|---|---|----|----|----|----|----|-----|
| **Filters** (radius, category, sort) | **Primary** | — | Teaser chip | — | — | — | — | — | **Primary** (mobile) | — |
| **Organic discovery sections** | — | — | — | **Primary** | — | — | — | — | — | — |
| **Marketplace tiles** | — | — | — | **Primary** | — | — | — | — | Preview | — |
| **Nearby activity** (pulse) | — | **Primary** | — | — | Secondary | — | — | — | — | — |
| **Recommendations** (disabled) | — | — | — | — | — | — | — | — | — | — |
| **Sponsored placements** | — | **Primary** | — | Secondary | Secondary | — | **Primary** | — | — | — |
| **HomePromotion** (platform) | — | **Primary** | Secondary | — | **Primary** | — | — | — | — | — |
| **Activity / activations** | — | **Primary** | — | Secondary | **Primary** | **Primary** | — | **Primary** | — | Secondary |
| **Partner invitations** | — | **Primary** | — | — | Secondary | Secondary | — | **Primary** | Flow | — |
| **Community challenges** | — | Secondary | — | — | — | Secondary | — | **Primary** | — | — |
| **Workshops** (discovery) | — | Secondary | — | **Primary** | — | Secondary | **Primary** | — | Preview | Secondary |
| **Help requests** | — | Secondary | — | **Primary** | — | **Primary** | — | — | — | Secondary |
| **Ambassador opportunities** | — | **Primary** | — | — | — | Secondary | — | **Primary** | — | — |
| **QR sharing** | — | Secondary | — | — | — | **Primary** | — | Secondary | Native share | — |
| **Local events** | — | **Primary** | — | Secondary | — | Secondary | Secondary | — | — | Secondary |
| **Business opportunities** | — | **Primary** | — | — | — | Secondary | Secondary | **Primary** | Onboarding | — |
| **Reputation / HCP** | — | **Primary** | — | — | Secondary | — | — | **Primary** | — | — |
| **Messages urgent** | — | **Primary** | — | — | — | — | — | — | — | Secondary |
| **Quick actions** (create, sell) | — | **Primary** | Secondary | — | — | — | — | — | Create sheet | — |
| **Role dashboard links** | Secondary | **Primary** | — | — | — | — | — | — | — | — |
| **Onboarding tour** | — | — | — | Overlay | — | — | — | — | — | — |

---

## System ownership (resolver)

| System | Owns surfaces | Must not own |
|--------|---------------|--------------|
| `buildDiscoveryFeed` / sections | F (organic bands) | R, AC, SP |
| `resolveActivityCard*` | AC, R activation stack | SP, section order |
| `resolveSponsored*` (future) | SP, R sponsored slots | AC, organic |
| `HomeRecommendedPromotions` | R, FI | SP |
| `CommunityPulseBar` | R, FI pulse | Ranking |
| `FeedFiltersPanel` / mobile sheet | L, SH | Activations |
| Activation engine 3C | AC, R opportunity, PS | Sponsored, sections |
| Editorial / admin | Community spotlight, hero | Feed ranking |

---

## Conflict rules

1. **Same activation ID** — one surface per session (feed AC wins over R stack).  
2. **Same sponsored campaign** — feed OR sidebar hero, not both.  
3. **Partner invite** — max one of {courier, business, club, ambassador} visible.  
4. **Workshop** — organic tile in F always allowed; event module is additive, not duplicate CTA.  
5. **Help request** — AC only if user role matches; never sponsored.

---

## Guest vs authenticated

| Content | Guest | Auth |
|---------|-------|------|
| Filters | L, SH | L, SH |
| Feed organic | F | F |
| Activity cards | — | AC, R |
| Partner modules | Teaser in H | R, PS |
| Sponsored | R spotlight only | Full |
| Profile activations | — | PS |

---

## Forbidden placements

| Content | Forbidden surface | Reason |
|---------|-------------------|--------|
| Sponsored | Left sidebar | Control column purity |
| Filters | Right sidebar | Clutters action lane |
| Organic section fake headers | SP band | Pay-to-trust mimicry |
| Activations | Public SEO / guest feed | Privacy |
| HCP as gate | Any activation eligibility | 3C rule |
| Ranking boosts | Any paid surface | Discovery integrity |

---

## References

- [SURFACE_SYSTEM_VISION.md](../architecture/SURFACE_SYSTEM_VISION.md)
- [SIDEBAR_ARCHITECTURE.md](../architecture/SIDEBAR_ARCHITECTURE.md)
- [MOBILE_SURFACE_ARCHITECTURE.md](../architecture/MOBILE_SURFACE_ARCHITECTURE.md)
