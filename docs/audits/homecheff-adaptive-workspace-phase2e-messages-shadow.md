# HomeCheff — Phase 2E  
## Messages Split/Stage Contract — Shadow-Mode Integration

| Field | Value |
| --- | --- |
| Date | 2026-07-19 |
| Branch | `identity/phase2-auth-foundation` |
| Base (Phase 2D) | `4b74a51` — `feat(workspace): add notifications panel shadow contract` |
| Mode | SHADOW diagnostics / fixture-only |
| Messages UI writer | Existing `/messages` + `ChatBox` / `ConversationsList` (unchanged) |

---

## 1. Scope

Model Messages as a one-primary-stage surface with deterministic supporting split for conversation list — without rendering, routing, Domain State, or keyboard engines.

---

## 2. Reference baseline

- Branch: `identity/phase2-auth-foundation`
- HEAD before Phase 2E: `4b74a51`

---

## 3–6. Topology & ownership

| Concern | Finding |
| --- | --- |
| Routes | `/messages` (list+split/drill-in), `/messages/[conversationId]` (thread-only) |
| Desktop | List + chat columns (`lg` = 1024px) |
| Mobile | Drill-in: list hidden, chat fixed |
| Domain State | `ConversationsList`, `ChatBox`, APIs, Pusher — federated |
| Presentation | Page-local `selectedConversation`; optional `?conversation=` |
| Details panel | **None** — context header is inline in chat column |

**Primary Task**

- No active conversation → `messages.list` (list = primary-stage)
- Active conversation → `messages.chat` (chat = primary-stage; list supporting or hidden)

**Split rule:** exactly one primary-stage; list may occupy supporting-start (split/rail); never two primaries.

---

## 7–11. Shadow model & manifests

Fixture-only via `createMessagesShadowResolveInput` + optional `messagesPresentationOverride` on Settings Shadow Root (diagnostics only). Real `/messages` not wrapped.

| Manifest | id / key | preferredRegion | modes | canBePrimary | collapse |
| --- | --- | --- | --- | --- | --- |
| List | `messages.list` | supporting-start | stage, split, rail | true | hide |
| Chat | `messages.chat` | primary-stage | stage, split | true | hide |
| Details | **omitted** | — | — | — | — |

Presentation intent: `{ schemaVersion:1, hasActiveConversation, listRequestedVisible?, preferredListMode?, localeDir?, reducedMotion?, keyboardOcclusionFixture? }` — no ids/drafts/messages.

---

## 12–13. Profile × mode (shadow)

| Scenario | Result |
| --- | --- |
| COMPACT, no conversation | list primary |
| COMPACT, active, list hidden | chat primary; list placement hidden |
| COMFORT/EXPANDED/PROFESSIONAL, active | chat primary; list supporting-start |
| H_SHORT | chat primary retained |
| Reduced motion | placements equal; transition `none` |
| RTL | supporting-start logical; widgetset same |

---

## 14. Keyboard / occlusion

**Contract A (fixture):** optional `keyboardOcclusionFixture` adds `AvailableSpace.occlusions[{kind:keyboard}]`.  
Resolver does **not** detect keyboards / visualViewport. Live IME deferred.

---

## 15–19. Intents / preservation / DecisionTrace

- Focus: plan preserve/stage; no DOM selectors; shadow does not execute
- Transition: reduced motion → none
- Lifecycle: VISIBLE when placed; no DESTROYED on profile/mode change
- Preservation keys: `messages.list`, `messages.chat` — stable across COMPACT↔EXPANDED
- Diagnostics: `data-aw-messages-*` (scenario, primary, modes, regions, split, intents, keys)

---

## 20–22. Single-writer / continuity

Workspace does not select conversations, mutate routes, open panels, or mount Messages UI.  
Settings child: stable host, one ResizeObserver, no messages keys.  
**Runtime Messages continuity verification: DEFERRED** (route not integrated).

---

## 23–28. Pure-core change

`pickPrimary` now scores **exact primaryTask id (2) > shared prefix (1)** so `messages.chat` outranks `messages.list` when both share `messages.*`. Documented + regression assertion. Prior 33 assertions + 1 new = 34.

---

## 29–31. Deferred / risks / Phase 2F

Deferred: production Messages renderer, live keyboard, details panel (none today), route wrapping.  
Next: **Phase 2F — Settings Workspace Renderer — Controlled ON Pilot**.

Entry: one-stage/split proven; preservation green; 2B–2E green; production ON still off.

---

## 32. Hygiene

Commit only Phase 2E paths (+ documented pure-core pickPrimary fix). Unrelated working-tree untouched. No Messages production file edits. No Feed.
