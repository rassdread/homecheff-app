# AW-R4 recursive capability audit

## Scope

Imports, registries, bridges, readers, runtime handles, callbacks, factories, lazy/dynamic imports, pipeline/transaction transitions, Workspace host, GeoFeed runtime, legacy authority path, target authority path, rollback path.

## Results

| Capability | Active authority | Hidden dual? |
| --- | --- | --- |
| Owner | workspace (1) | No |
| Writer | workspace (1) | No |
| Renderer | workspace (1) | No |
| Request | workspace (1) | No |
| Pagination | workspace (1) | No |
| Cache | workspace (1) | No |
| Observer | workspace (1) | No |
| Legacy writer/renderer | inactive after commit | No concurrent activation |
| Feed ON | closed (`feedOnAuthorized=false`) | No |
| Production promotion | closed | No |

## Verdict

**PASS** — one active authority per capability; no Feed ON; no production promotion; rollback gated.
