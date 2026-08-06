# Location Flow Map

```
LocationRefineBanner “Wijzig locatie”
  → handleChoosePlaceForNearby
  → requestPlaceInputFocus (expand Discovery Filters if collapsed)
  → open mobile sheet / ensure sidebar filters visible
  → focus [data-testid=feed-place-input]
  → user types city / postcode
  → Enter or Apply
  → applyFilters → locationSource=manual → preference persist
  → GeoFeed API refresh with place
```

SSOT for manual location draft: GeoFeed `place` state.  
SSOT for applied location: `appliedPlace` + `lib/geo/location-preference.ts` (`hc_location_pref_v2`).
