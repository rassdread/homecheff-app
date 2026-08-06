# Provider / API Review

Manual nearby place uses GeoFeed `place` query → server/viewer geocode path (existing). Client `LocationInput` Nominatim helper is not the homepage SSOT.

| Item | Status |
|------|--------|
| Homepage depends on Google Places autocomplete for typing | No |
| Manual city/postcode without suggestions | Supported via type + Enter/Apply |
| External provider failure | Does not disable the text field |
| API keys | Not printed; not required for this interactivity fix |

Operator may still need to confirm Production geocode responses for unusual places after deploy.
