# WX Phase 1C — Adaptive Workspace Specification

AvailableSpace-first. Classes are labels derived from usable geometry, not device identity.

## Phone Portrait

| Concern | Behaviour |
| --- | --- |
| navigation | Top NavBar + bottom nav (portrait affordance) |
| header / hero | Orientation strip standard (non-compact) |
| search / filters | Mobile toolbar + filter sheet in stage |
| rails | None |
| workspace / feed | Single column; feed primary; document scroll |
| tool access | Create via NavBar primary action |
| spacing / density | `browse` |
| scroll owner | `document` |
| interaction priority | feed → search → create → filters → navigation |

## Phone Landscape

| Concern | Behaviour |
| --- | --- |
| navigation | Bottom nav collapsed; Create remains in top command |
| header / hero | Compact orientation strip (minimal vertical pixels) |
| search / filters | Stage progressive / compact discover chrome |
| rails | End rail when width ≥ landscape carve-out |
| workspace / feed | Multi-col when carve-out; maximize stage height |
| chrome inset | `bottomRem = 0` (reclaim bottom-nav reserve) |
| density | `work` |
| scroll owner | `feed` when multi-col |
| interaction priority | feed → create → search → filters → navigation |

## Tablet Portrait

| Concern | Behaviour |
| --- | --- |
| rails | End rail (COMFORT) |
| filters | Stage owns filters (`stageOwnsFilters`) |
| density | `browse` |
| scroll owner | `feed` |
| interaction priority | feed → search → filters → create → rails |

## Tablet Landscape

| Concern | Behaviour |
| --- | --- |
| rails | End rail; bottom nav collapsed |
| chrome | Compact orientation; height reclaim |
| density | `work` |
| scroll owner | `feed` |
| interaction priority | feed → filters → create → search → rails |

## Laptop (`desktop` layoutMode, usable width &lt; 1200)

| Concern | Behaviour |
| --- | --- |
| rails | Start + end |
| filters | Start rail owns full filters (portal); stage compact |
| density | `work` |
| scroll owner | `feed` |
| interaction priority | feed → filters → create → search → rails |

## Desktop (usable width ≥ 1200, &lt; 1440)

| Concern | Behaviour |
| --- | --- |
| rails | Start + end |
| filters | Start rail owns filters; end rail context via surfacePlan |
| density | `pro` |
| stage gutters | Soft stage field fill (cards remain capped) |
| interaction priority | feed → filters → create → search → rails → context |

## Ultrawide (`desktop-wide`, ≥ 1440)

| Concern | Behaviour |
| --- | --- |
| rails | Wider start/end tracks; feed column capped (720) |
| density | `pro` |
| no dead card stretch | Feed max width preserved; rails absorb width |
| interaction priority | feed → filters → create → search → rails → context → density |
