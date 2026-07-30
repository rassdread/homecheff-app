# Adaptive Workspace — Future-Development Baseline

| Field | Value |
| --- | --- |
| Baseline | Adaptive Workspace Production v1 |
| Runtime freeze | `be42e9fd73f9dbf09d64dbbb3ccc6eb5e5413170` |
| Migration | complete (AW-R1–AW-R6 immutable) |
| Next migration stage | none |
| AW-R7 | absent |

## Rules for new work

1. All migration work is complete; new work starts after AW-R6.
2. Legacy authority must not be reopened.
3. GeoFeed must remain one instance (no remount for space/profile changes).
4. New writers require explicit ownership proof.
5. New renderers require single-renderer proof.
6. New request paths must preserve request identity.
7. New Workspace behavior must use AvailableSpace and deterministic resolution.
8. Production changes require regression, browser, and rollback proof.
9. Architecture changes require a new separately approved roadmap.
10. AW-R1 through AW-R6 are immutable historical release stages.

Do not invent future product phases in this baseline.
