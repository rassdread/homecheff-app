# Rollback — WX Phase 1C.1.2 Production

| Item | Value |
| --- | --- |
| Rollback SHA | `84c182a31325d6c4749253870033bf4bb2deaf5c` |
| Prior deployment | `dpl_AhQnWjkurSvtajvbxLkunGR7SACt` |
| Merge to undo | `90a51f1a3caa4341ee1a5e5076db708b505c42aa` |
| Schema / data migration | **none** |

## Procedure

1. Prefer instant rollback: promote prior Vercel Production deployment `dpl_AhQnWjkurSvtajvbxLkunGR7SACt` (alias https://homecheff.eu).
2. Or: `git revert -m 1 90a51f1a3caa4341ee1a5e5076db708b505c42aa` on `main`, then `npx vercel --prod` for `homecheff-app`.
3. Confirm live phase and polish markers revert; no DB migrate/deploy required.
