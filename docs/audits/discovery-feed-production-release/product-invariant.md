# Product Invariant

| Input | Expected | Code path |
|---|---|---|
| No location | Discovery feed (soft-national) | softNationalFallback + locationFilterActive false |
| Known location | Nearby-first + radius | locationFilterActive true |
| GPS denied | Discovery + manual fallback | GPS onFallback opens place; feed not gated |
| GPS allowed | Nearby-first | coords → !nearbyNeedsLocation |

Must **not** blank solely for missing coords/place/permission/profile/timeout/reverse-geocode.

Only genuine content/filter zero-results may empty the UI.
