# Phase 3F.4 — Cache Revalidation

**Branch:** `performance/phase3f-anonymous-cache`  
**Helper:** `lib/feed/revalidate-public-feed.ts`

## Tags

- `homecheff-feed`
- `homecheff-feed:national`

## Wired routes (after successful DB commit)

| Route | Trigger |
|-------|---------|
| `POST app/api/products/create` | active product created |
| `PATCH app/api/products/[id]` | product was/is feed-visible |
| `DELETE app/api/products/[id]` | product/listing was feed-visible |
| `POST app/api/profile/dishes` | dish published |
| `PATCH app/api/profile/dishes/[id]` | dish was/is PUBLISHED |
| `DELETE app/api/profile/dishes/[id]` | dish was PUBLISHED |

## Intentionally excluded

- Review-only updates
- Private draft edits (never visible)
- User profile changes without feed impact
- Broad `revalidatePath('/')`

## Validator

`npx tsx scripts/validate-feed-revalidation-phase3f.ts`
