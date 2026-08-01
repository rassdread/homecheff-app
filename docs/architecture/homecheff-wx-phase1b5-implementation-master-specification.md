# HomeCheff — WX Phase 1B.5 Implementation Master Specification  
## Progressive Capability Surfaces — Controlled Implementation Roadmap

| Field | Value |
| --- | --- |
| Document type | Permanent implementation roadmap (planning only) |
| Version | **1.0** |
| Status | **Proposed for architectural approval** |
| Date | 2026-08-01 |
| Classification | Architecture planning only — **no implementation** |
| Normative language | MUST / SHOULD / MAY / MAY NOT / MUST NOT (RFC 2119 sense) |
| Parent architecture | [WX Phase 1B.5 Master Specification](./homecheff-wx-phase1b5-master-specification.md) |
| Program context | [WX Phase 1B Master Specification](./homecheff-wx-phase1b-master-specification.md) |
| Complements | AWA · WDL v1.0 · WMS v1.0 · WMS v1.1 · WQS v1.0 |
| Production baseline | Runtime `0b84f593b3dda5cbe2e54adf30f809a5bab076cc` (Phase 1B.4 frozen) |
| Does not authorize | Code · styling · React · deployment · browser execution · WX-1B.5.1 implementation prompt |

**Binding stance:** Once approved, this Implementation Master Specification is the **only permitted sequence** for implementing WX Phase 1B.5. Implementation prompts MUST be authored **one sub-phase at a time**, starting with **WX-1B.5.1**, only after explicit approval of this document **and** the Phase 1B.5 Master Specification.

If implementation conflicts with AWA / WDL / WMS / Capability Model / WQS / Phase 1B.5 Master Spec / Production freezes through 1B.4: **implementation MUST change; architecture MUST NOT.**

---

## 1. Executive Summary

WX Phase 1B.5 converts frozen **capability truth** into honest **Workspace surface presentation**.

It does **not** change Mode Engine, Transition Continuity, Capability Framework activation semantics, Landscape Work Posture design, GeoFeed ownership, or Controlled Host state.

### Method

Phase 1B.5 is **not** one large implementation. It is a controlled sequence of **seven** small, independently reviewable, testable, deployable, reversible, and freezable sub-phases — the same methodology that delivered WX-1B.1 through WX-1B.4.

| Phase | Title | Core deliverable |
| --- | --- | --- |
| **WX-1B.5.1** | Surface Registry & Presentation Contract | Sealed surface classes, states, and presentation contract |
| **WX-1B.5.2** | Surface Presentation Resolver | Deterministic AvailableSpace × Mode × Capability → Surface Presentation Plan (incl. prioritisation) |
| **WX-1B.5.3** | Assist Surface Eligibility Presentation | First user-visible assist occupancy from the plan |
| **WX-1B.5.4** | Progressive Disclosure Continuity | Reachable fallbacks when persistent surfaces retract |
| **WX-1B.5.5** | Tool & Action Surface Presentation | Shortcuts / quick-action persistence vs Reachable |
| **WX-1B.5.6** | Honesty Density & Compacted States | Height/posture compaction of eligible surfaces (not Professional densification) |
| **WX-1B.5.7** | Integrated Proof & Production Freeze | Full WQS evidence + Phase 1B.5 freeze |

**Explicitly deferred beyond 1B.5:** Contextual Assist living composition (1B.6) · Professional densification (1B.7) · Inspector · Selection · Memory · AI · Collaboration · Extensions · search/filter/nav IA/card redesign · Host ACTIVE · GeoFeed ownership transfer.

---

## 2. Architectural Goals

1. Establish **Surface Presentation** as a third truth distinct from Mode truth and Capability truth.  
2. Make assist and tool surfaces appear/retract from **AvailableSpace only**.  
3. Preserve **Reachability** whenever persistence retracts.  
4. Keep presentation **additive and reversible** atop 1B.1–1B.4.  
5. Never invent hollow permanent surfaces.  
6. Never activate reserved capabilities.  
7. Never remount Stage, fork writers/renderers, or change ownership.  
8. End 1B.5 ready for 1B.6 (living assist content) without redefining eligibility.

### Program non-goals (entire 1B.5)

- Visual identity / motion / typography systems  
- Professional Workspace densification program  
- Contextual intelligence / memory / AI  
- Navigation IA, search, filters, or card redesign  
- Capability Framework redesign  
- Landscape Work Posture redesign  

---

## 3. Recommended Phase Breakdown

Seven sub-phases. Count derived from dependency layers — not from schedule pressure:

1. **Identity** must exist before resolution (Registry).  
2. **Deterministic plan** must exist before chrome moves (Resolver + prioritisation).  
3. **Assist eligibility** is the first visible capacity change and must be proven alone.  
4. **Disclosure continuity** must follow immediately so retraction never strands tools.  
5. **Tool/action presentation** depends on disclosure paths existing.  
6. **Honesty density** depends on tools remaining Reachable under compaction.  
7. **Integrated freeze** depends on all prior freezes.

Large “resolver + assist + tools + density together” phases are **forbidden**.

---

## 4. Detailed Specification For Every Phase

---

### WX-1B.5.1 — Surface Registry & Presentation Contract

| Field | Specification |
| --- | --- |
| **Phase identifier** | `WX-1B.5.1` |
| **Purpose** | Seal the vocabulary of Workspace surfaces and presentation states |
| **Scope** | Surface class registry (Stage, Orientation, Command, Assist, Tool, Disclosure, Utility-blocked, Reserved-blocked); presentation states (Absent, Reachable, Persistent, Compacted, Reserved-blocked); contract identifiers; fail-closed defaults; pure documentation + sealed constants / contract tests |
| **Architectural objective** | Create a presentation identity layer that Mode Engine and Capability Framework do not own |
| **User-visible outcome** | None required (diagnostics MAY appear; chrome behaviour MUST NOT change) |
| **Internal outcome** | Single sealed registry; tests assert class/state vocabulary and reserved blocks |
| **Dependencies** | Phase 1B.5 Master Spec approved · 1B.1–1B.4 Production freezes |
| **Explicitly excluded** | Resolver logic · chrome wiring · disclosure UI · tool presentation · density · living assist content · any ownership change |
| **AWA** | Presentation-only authority · fail-closed · no ownership transfer |
| **WDL** | Workspace-first vocabulary · honesty of permanent regions |
| **WMS** | Mode/posture remain consumers later — not redefined here |
| **Capability Model** | Align surface classes to matrix rows without inventing capabilities |
| **WQS** | Architecture citation · no device forks · evidence of sealed contract |
| **Validation** | Unit/contract: registry completeness; reserved cannot be Persistent; CORE classes exist |
| **Browser proof** | Optional smoke that production behaviour unchanged |
| **Responsive proof** | N/A beyond “no behavioural delta” |
| **Regression** | 1B.4 landscape posture + nav preservation unchanged |
| **Accessibility** | No a11y delta required; if diagnostics added, must be non-interactive |
| **Performance** | Negligible constant registry |
| **Production readiness** | Contract sealed; no chrome drift |
| **Freeze criteria** | `WX_1B5_1_PASS` + freeze pack |
| **Rollback** | Remove registry wiring; restore prior constants-only world |
| **Mandatory STOP GATE** | No 1B.5.2 until 1B.5.1 approved/frozen |

---

### WX-1B.5.2 — Surface Presentation Resolver

| Field | Specification |
| --- | --- |
| **Phase identifier** | `WX-1B.5.2` |
| **Purpose** | Deterministically resolve a Surface Presentation Plan from AvailableSpace, Mode, Capability Plan, and posture |
| **Scope** | Pure resolver: inputs → plan of presentation states per surface class; **includes Surface Prioritisation under contention** as an internal resolver stage; diagnostics emission; identical floors → identical plan; fail-closed; **no chrome behaviour change yet** (presentation visual activation remains gated off / non-driving) |
| **Architectural objective** | Capability truth becomes presentable truth without yet mutating experience |
| **User-visible outcome** | None required beyond diagnostics |
| **Internal outcome** | Surface Presentation Plan object; vector suite across Modes × postures × contention cases |
| **Dependencies** | **WX-1B.5.1** |
| **Explicitly excluded** | Assist chrome occupancy changes · disclosure redesign · tool chrome changes · density policies · Mode/Capability engine edits · device/UA branches |
| **AWA** | AvailableSpace primary · deterministic resolution · no brand/model exceptions |
| **WDL** | Progressive honesty encoded as plan outcomes |
| **WMS** | Consume Mode/posture; obey transition non-destructiveness (plan-only) |
| **Capability Model** | Consume matrix; RES → Reserved-blocked; Reachable class mapped; progressive unlock/retract encoded |
| **WQS** | Determinism · AvailableSpace-first · ownership untouched |
| **Validation** | Unit vectors: Browse/Compact/Hybrid/Full/Professional; portrait/landscape; contention priority order; RES never Persistent; fail-closed invalid space |
| **Browser proof** | Diagnostics present across matrix; chrome occupancy matches pre-1B.5.2 baseline |
| **Responsive proof** | 320–2560 + landscape phones: plan labels correct vs fixtures |
| **Regression** | Capability visual activation semantics for reserved remain dark; 1B.4 posture intact |
| **Accessibility** | Diagnostics must not become focusable chrome |
| **Performance** | Resolver O(surface classes); no listeners/polling/timers beyond existing measurement |
| **Production readiness** | Plan stable; chrome unchanged |
| **Freeze criteria** | `WX_1B5_2_PASS` |
| **Rollback** | Disable resolver consumers; remove plan diagnostics |
| **Mandatory STOP GATE** | No 1B.5.3 until 1B.5.2 approved/frozen |

**Prioritisation note:** Surface Prioritisation is **not** a separate deployable phase. Shipping a resolver without contention priority would be architecturally incomplete. Prioritisation MUST be validated as first-class vectors inside 1B.5.2.

---

### WX-1B.5.3 — Assist Surface Eligibility Presentation

| Field | Specification |
| --- | --- |
| **Phase identifier** | `WX-1B.5.3` |
| **Purpose** | Drive persistent Assist Surface occupancy from the Surface Presentation Plan |
| **Scope** | Wire existing authorized assist regions (start/end supporting capacity already in Workspace layout) to Persistent / Absent / Compacted eligibility; Mode ladder: Browse absent; Compact ≤1; Hybrid 1; Full/Professional ≤2 when capacity allows; hollow permanent assists forbidden — if no honest content exists, surface MUST NOT claim Persistent occupancy as decoration |
| **Architectural objective** | First real Progressive Capability Surfaces experience: capacity-shaped assist presence |
| **User-visible outcome** | As AvailableSpace/Mode grows, assist regions may become present; as it shrinks, they retract |
| **Internal outcome** | Shell consumes Surface Presentation Plan for assist occupancy; diagnostics show presentation driving state |
| **Dependencies** | **WX-1B.5.2** |
| **Explicitly excluded** | Living assist composition / editorial module systems (1B.6) · Inspector · Selection · Tool/shortcut IA redesign · Disclosure system (next) · Professional densification · Capability Framework changes |
| **AWA** | Panel placement presentation · stable slots · no remount |
| **WDL** | Permanent rails honesty · no dead space · no hollow modules · feed remains stage |
| **WMS** | Panel behaviour per Mode |
| **Capability Model** | Left/Right rail · Context Panels · Multi-panel rows |
| **WQS** | Presentation continuity · regression · no overflow |
| **Validation** | Mode×assist occupancy matrix; contention never steals Stage readability; mount continuity on resize |
| **Browser proof** | Portrait/landscape Mode ladder screenshots + occupancy assertions |
| **Responsive proof** | Full viewport matrix; tablet landscape Compact assist eligibility via geometry only |
| **Regression** | 1B.4 bottom-nav collapse / nav Reachable paths; capability RES dark |
| **Accessibility** | Persistent assist must expose correct landmark/name if present; Absent must remove from a11y tree / not trap focus |
| **Performance** | No extra feed requests; no remount; no layout thrash loops |
| **Production readiness** | Assist occupancy matches plan; no hollow decoration |
| **Freeze criteria** | `WX_1B5_3_PASS` |
| **Rollback** | Ignore plan for assist occupancy; restore prior layout-band assist rules |
| **Mandatory STOP GATE** | No 1B.5.4 until 1B.5.3 approved/frozen |

---

### WX-1B.5.4 — Progressive Disclosure Continuity

| Field | Specification |
| --- | --- |
| **Phase identifier** | `WX-1B.5.4` |
| **Purpose** | Guarantee Reachable continuity when persistent Assist/Tool surfaces retract |
| **Scope** | Disclosure Surface behaviour for Reachable tools; intentional open/close; restore Stage interaction after close; no auto-open on Mode change; preserve canonical destinations/actions already in product; generalize 1B.4 navigation-reachability honesty to progressive surfaces |
| **Architectural objective** | Retraction honesty — absence of persistence must not mean abandonment |
| **User-visible outcome** | Users can still reach required tools via disclosure when assists/tools are not persistent |
| **Internal outcome** | Presentation plan Reachable states have proven disclosure paths |
| **Dependencies** | **WX-1B.5.3** |
| **Explicitly excluded** | New navigation IA · new search model · new filter taxonomy · Memory/AI · changing Create/HCP canonical owners · Landscape posture redesign |
| **AWA** | Non-destructive transitions · presentation-only |
| **WDL** | Progressive disclosure principles |
| **WMS** | Drawer / overlay transient behaviour |
| **Capability Model** | Reachable class · Progressive Disclosure · Drawer behaviour rows |
| **WQS** | Accessibility · keyboard/touch reachability · no stranded tools |
| **Validation** | For each retracted Persistent→Reachable case, prove open → listed → activate → close → Stage interactive |
| **Browser proof** | Continuous journey: expand Mode (persistent) → shrink Mode (reachable via disclosure) without reload |
| **Responsive proof** | Below-lg landscape + portrait + desktop matrix |
| **Regression** | 1B.4 Create + `/mijn-hcp` Reachable invariants remain PASS |
| **Accessibility** | Disclosure trigger named; Escape closes where expected; focus returns; collapsed persistent regions not focusable |
| **Performance** | Transient overlay only; no permanent second chrome layer |
| **Production readiness** | No stranded-tool findings |
| **Freeze criteria** | `WX_1B5_4_PASS` |
| **Rollback** | Restore prior disclosure/overflow behaviour; keep assist eligibility rollbackable independently |
| **Mandatory STOP GATE** | No 1B.5.5 until 1B.5.4 approved/frozen |

---

### WX-1B.5.5 — Tool & Action Surface Presentation

| Field | Specification |
| --- | --- |
| **Phase identifier** | `WX-1B.5.5` |
| **Purpose** | Present already-authorized Workspace tools and quick actions as Persistent or Reachable per plan |
| **Scope** | Workspace Shortcuts / Quick Actions presentation states only; densify or persist only when Capability Model allows; otherwise Reachable via 1B.5.4 disclosure; **no new actions**, **no renamed IA**, **no duplicate business-logic owners** |
| **Architectural objective** | Action surfaces become capacity-aware without becoming a new command product |
| **User-visible outcome** | In higher Modes, authorized shortcuts may appear persistently; in lower Modes they remain Reachable |
| **Internal outcome** | Tool Surface states driven by Surface Presentation Plan |
| **Dependencies** | **WX-1B.5.4** |
| **Explicitly excluded** | Navigation IA redesign · Create flow redesign · new marketplace actions · Inspector · Selection · Professional tool densification |
| **AWA** | Widgets own functionality; Workspace places presentation |
| **WDL** | Primary action clarity · Workspace-first |
| **WMS** | Quick Actions / Shortcuts behaviour by Mode |
| **Capability Model** | Quick Actions · Workspace Shortcuts rows |
| **WQS** | Reachability · no duplicate visible conflicting owners · regression |
| **Validation** | Mode×tool persistence matrix; canonical action identity unchanged; guest/auth paths unchanged where applicable |
| **Browser proof** | Persistent vs Reachable assertions across Modes |
| **Responsive proof** | Phone landscape Reachable continuity + desktop persistent eligibility |
| **Regression** | 1B.4 nav preservation · assist eligibility · disclosure continuity |
| **Accessibility** | Persistent tool targets meet minimum size; Reachable items keyboard reachable |
| **Performance** | No new polling; no feed ownership work |
| **Production readiness** | Tools match plan; no IA drift |
| **Freeze criteria** | `WX_1B5_5_PASS` |
| **Rollback** | Restore prior static tool chrome rules; plan ignored for tools |
| **Mandatory STOP GATE** | No 1B.5.6 until 1B.5.5 approved/frozen |

---

### WX-1B.5.6 — Honesty Density & Compacted Surface States

| Field | Specification |
| --- | --- |
| **Phase identifier** | `WX-1B.5.6` |
| **Purpose** | Apply Compacted presentation for eligible surfaces under height constraint and landscape work posture honesty |
| **Scope** | Compacted state behaviour for Orientation/Command/Assist/Tool surfaces already eligible; prefer compaction before Stage sacrifice; align with existing Landscape Work Posture semantics without redesigning them; **not** Professional densification, ultrawide packing, or typography systems |
| **Architectural objective** | Honesty density — pack eligible surfaces, do not invent Professional Workspace |
| **User-visible outcome** | Short/landscape spaces feel compact and workable; expanded spaces do not gain empty decorative chrome |
| **Internal outcome** | Compacted transitions deterministic; Stage readability preserved under contention |
| **Dependencies** | **WX-1B.5.5** |
| **Explicitly excluded** | Professional density program (1B.7) · visual identity · motion system · card redesign · posture policy redesign · Mode threshold redesign |
| **AWA** | Height honesty · readable stage |
| **WDL** | Density before empty margin · continuous Workspace |
| **WMS** | Interaction/information density guidance at honesty level |
| **Capability Model** | Productivity Density row only as honesty refinement — not Professional unlock program |
| **WQS** | Responsive · performance · no overflow · regression |
| **Validation** | Height-constrained vectors; landscape compaction; Stage min readability; tools remain Reachable if compacted away from persistence |
| **Browser proof** | Portrait tall vs short; landscape phone; desktop unchanged where not compacted |
| **Responsive proof** | Required landscape set from 1B.4 plus desktop/ultrawide non-regression |
| **Regression** | All 1B.5.1–1B.5.5 invariants + 1B.4 posture/nav |
| **Accessibility** | Compacted controls remain operable; no clipped focusable targets |
| **Performance** | Compaction must not induce remount or request storms |
| **Production readiness** | Honesty density accepted; Professional densification explicitly not claimed |
| **Freeze criteria** | `WX_1B5_6_PASS` |
| **Rollback** | Disable Compacted presentation mapping; keep eligibility/disclosure/tools |
| **Mandatory STOP GATE** | No 1B.5.7 until 1B.5.6 approved/frozen |

---

### WX-1B.5.7 — Integrated Proof & Production Freeze

| Field | Specification |
| --- | --- |
| **Phase identifier** | `WX-1B.5.7` |
| **Purpose** | Close WX Phase 1B.5 under WQS with integrated evidence and Production freeze |
| **Scope** | No new behaviour except proof harness fixes; full Mode×surface×posture matrix; continuous journeys; ownership probes; accessibility; performance; freeze pack; rollback record; STOP GATE for 1B.6 |
| **Architectural objective** | Program-level freeze of Progressive Capability Surfaces |
| **User-visible outcome** | Production Workspace presents progressive surfaces per plan |
| **Internal outcome** | `WX_PHASE_1B5_PRODUCTION_SUCCESS` (or WQS equivalent) + `PRODUCTION_FROZEN` |
| **Dependencies** | **WX-1B.5.1 through WX-1B.5.6** all frozen |
| **Explicitly excluded** | Any new surface class · 1B.6 scope · 1B.7 scope |
| **AWA / WDL / WMS / Capability / WQS** | Full compliance matrices in freeze pack |
| **Validation** | Entire accumulated suite re-run on merge tip |
| **Browser proof** | Integrated live Production proof after deploy |
| **Responsive proof** | Complete 320–2560 + landscape phones |
| **Regression** | 1A.x + 1B.1–1B.4 + 1B.5.1–1B.5.6 |
| **Accessibility** | Collapsed/absent surfaces non-interactive; Reachable paths complete |
| **Performance** | Final presentation-cost report; no feed ownership regression |
| **Production readiness** | All gates PASS |
| **Freeze criteria** | Live proof PASS · freeze docs on `origin/main` · runtime hash bound |
| **Rollback** | Documented revert to pre-1B.5 presentation / last known good deployment |
| **Mandatory STOP GATE** | **No WX Phase 1B.6** until explicit approval after this freeze |

---

## 5. Dependency Graph

```text
AWA / WDL / WMS / Capability / WQS  (frozen)
WX Phase 1B.5 Master Spec           (architecture)
WX-1B.1 … WX-1B.4                   (Production frozen)
                │
                ▼
        ┌───────────────┐
        │  WX-1B.5.1    │  Surface Registry & Contract
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │  WX-1B.5.2    │  Surface Presentation Resolver
        │               │  (+ Prioritisation stage)
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │  WX-1B.5.3    │  Assist Eligibility Presentation
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │  WX-1B.5.4    │  Progressive Disclosure Continuity
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │  WX-1B.5.5    │  Tool & Action Surface Presentation
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │  WX-1B.5.6    │  Honesty Density & Compacted States
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │  WX-1B.5.7    │  Integrated Proof & Production Freeze
        └───────┬───────┘
                ▼
         (await approval)
                ▼
           WX-1B.6 …
```

**Hard edges:** 5.1→5.2→5.3→5.4→5.5→5.6→5.7.  
**No parallel** chrome phases before resolver freeze.  
**No 1B.6** before 1B.5.7 freeze + explicit approval.

---

## 6. Phase Sequence Rationale

| Order decision | Why |
| --- | --- |
| Registry before resolver | Plans need sealed vocabulary |
| Resolver before chrome | Moving surfaces without deterministic plan recreates device/layout coupling |
| Prioritisation inside resolver | A plan that cannot contend safely is incomplete; separate ship would be unsafe |
| Assist eligibility before disclosure | Must observe retractable persistence before proving Reachable fallbacks |
| Disclosure before tool presentation | Tool Reachable states depend on disclosure continuity |
| Tools before honesty density | Compaction must not strand actions before Reachable paths exist |
| Density before integrated freeze | Compaction is the last presentation honesty layer in 1B.5 scope |
| Freeze last | WQS requires integrated live proof after behaviour exists |

### Rejected sequences

| Rejected idea | Why rejected |
| --- | --- |
| Tools first | Strands Reachable requirements and invents IA pressure early |
| Density first | Densifies undefined surfaces |
| Assist + tools + density in one phase | Unreviewable; rollback opaque |
| Living contextual content inside 1B.5.3 | Belongs to 1B.6; creates hollow-risk and scope explosion |
| Professional densification inside 1B.5.6 | Belongs to 1B.7 |
| Separate “Surface Prioritisation” Production phase after visual assist | Either too late (unsafe chrome) or redundant (must be in resolver) |

---

## 7. Validation Strategy

Every sub-phase MUST:

1. Cite AWA · WDL · WMS · Capability Model · WQS · Phase 1B.5 Master Spec clauses.  
2. Run ownership probes: GeoFeed sole runtime/data owner · Controlled Host unchanged · single mount/writer/renderer/request/pagination owner.  
3. Assert Mode Engine / Continuity / Capability Framework remain behaviourally unchanged except intentional presentation consumption.  
4. Assert reserved capabilities remain non-presented.  
5. Assert no capability-activation redesign (presentation only).  
6. Pass lint / smoke / Production build gates used for release.  
7. Complete applicable WQS checklists.  

| Layer | Applies |
| --- | --- |
| Unit / contract | All phases |
| Integration (plan → shell) | 1B.5.3+ |
| Browser proof | Required from 1B.5.2 diagnostics; behavioural from 1B.5.3+ |
| Responsive proof | 1B.5.2+ |
| Performance | Every phase; formal report by 1B.5.7 |
| Accessibility | 1B.5.3+ mandatory; 1B.5.4 critical |
| Ownership | Every phase |
| Regression | Cumulative prior freezes |
| Promotion | Independent per sub-phase |
| Production proof | Each promoted sub-phase; integrated in 1B.5.7 |
| Freeze evidence | Each sub-phase + program freeze in 1B.5.7 |

---

## 8. Browser Proof Strategy

| Phase | Browser proof intent |
| --- | --- |
| 1B.5.1 | No behavioural delta (optional) |
| 1B.5.2 | Diagnostics-only plan visibility; chrome parity |
| 1B.5.3 | Assist occupancy ladder + continuous resize journey |
| 1B.5.4 | Reachable disclosure journeys after retraction |
| 1B.5.5 | Tool Persistent vs Reachable matrix |
| 1B.5.6 | Compaction honesty under short/landscape space |
| 1B.5.7 | Integrated Production matrix + journeys |

Proof MUST distinguish: mounted · visually present · keyboard Reachable · pointer/touch Reachable · canonical action invoked.

---

## 9. Responsive Strategy

AvailableSpace vectors remain the proof truth — not device labs.

Minimum matrix philosophy (exact lists belong in implementation prompts after approval):

- Constrained portrait (Browse stage-first)  
- Landscape work posture phones (Compact honesty + Reachable continuity)  
- Tablet portrait/landscape  
- Desktop Hybrid/Full eligibility  
- Ultrawide non-stretch Stage readability  

Landscape Work Posture rules from 1B.4 remain binding regression.

---

## 10. Accessibility Strategy

| Requirement | Binding from |
| --- | --- |
| Absent persistent surfaces not focusable / not announcing duplicates | 1B.5.3+ |
| Disclosure open/close, focus return, Escape where expected | 1B.5.4 |
| Reachable tools operable by keyboard and touch | 1B.5.4 / 1B.5.5 |
| Compacted controls remain operable and unclipped | 1B.5.6 |
| No a11y regression vs 1B.4 nav preservation | All chrome phases |

---

## 11. Production Strategy

Each sub-phase MUST support:

1. Independent merge to `main` after review.  
2. Independent Production deploy to official project.  
3. Independent live proof.  
4. Independent freeze documentation.  
5. Independent rollback without requiring later sub-phases.

Presentation feature flags / fail-closed defaults SHOULD allow Production to disable a new presentation consumer without removing resolver contracts already frozen.

---

## 12. Freeze Strategy

| Freeze unit | Contents |
| --- | --- |
| Per sub-phase | Deliverable · ownership · regression · browser proof · rollback · STOP GATE |
| 1B.5.7 program freeze | Bound runtime hash · deployment id · integrated proofs · remaining warnings · explicit 1B.6 prohibition |

Freeze MUST record that Capability Framework activation ownership did not move.

---

## 13. Rollback Strategy

| Phase | Rollback meaning |
| --- | --- |
| 1B.5.1 | Remove registry contract consumers |
| 1B.5.2 | Stop emitting/consuming Surface Presentation Plan |
| 1B.5.3 | Restore prior assist occupancy rules |
| 1B.5.4 | Restore prior disclosure/overflow behaviour |
| 1B.5.5 | Restore prior tool chrome persistence rules |
| 1B.5.6 | Disable Compacted mapping |
| 1B.5.7 | Documented Production rollback target to pre-1B.5 or last good 1B.5.x |

Rollback MUST leave 1B.1–1B.4 intact.  
No database migration in any rollback path.

---

## 14. Risk Assessment

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Hollow assist regions after 1B.5.3 | High | Honesty ban; defer living content to 1B.6; Absent if no value |
| Stranded tools after retraction | High | 1B.5.4 before tool persistence expansion |
| Scope bleed into Professional densification | Medium | Explicit 1B.5.6 limits; 1B.7 deferral |
| Resolver coupled into Mode Engine | High | Hard separation of truths; consume-only rule |
| Mega-phase combining 5.3–5.6 | High | Forbidden by this roadmap |
| Navigation IA redesign under “tools” | High | 1B.5.5 presentation-only; 1B.4 invariants regression |
| Claiming all capabilities visually active | Medium | Scoped presentation targets only |
| Ownership leak via “smart surfaces” | Critical | Ownership probes every phase |

---

## 15. Expected End State

After **WX-1B.5.7** Production freeze:

1. Surface Presentation Plan is the sole presentation authority for in-scope surfaces.  
2. Assist occupancy follows Mode capacity with honesty.  
3. Retraction preserves Reachable tools via disclosure.  
4. Authorized tools/actions persist only when the plan allows.  
5. Compacted honesty exists without Professional densification claims.  
6. GeoFeed / Controlled Host / Mode / Continuity / Capability activation ownership unchanged.  
7. Reserved capabilities remain dark.  
8. Landscape Work Posture and 1B.4 navigation guarantees remain PASS.  
9. Workspace is ready for **WX-1B.6** living contextual assist composition — eligibility already solved.  
10. Phase 1B.6 remains **prohibited** until separate explicit approval.

---

## Cross-Cutting Quality Seals (every implementation phase)

Every implementation phase MUST preserve:

- GeoFeed ownership  
- Controlled Host unchanged  
- Mode Engine unchanged  
- Transition Continuity unchanged  
- Capability Framework activation ownership unchanged  
- Single renderer · single writer · single mount  
- Request ownership · pagination ownership  
- Workspace continuity  
- Deterministic behaviour  
- Presentation only (no capability-activation redesign)

---

## Document Control

| Field | Value |
| --- | --- |
| Approves sequence for | WX-1B.5.1 … WX-1B.5.7 |
| Does not approve | Any implementation prompt content |
| First implementable phase after dual approval | **WX-1B.5.1 only** |

---

## Mandatory Stop Gate

**STOP.**

- Do not implement anything.  
- Do not write code.  
- Do not generate components or styles.  
- Do not modify Production.  
- Do not author the WX Phase 1B.5.1 implementation prompt yet.

Wait for **formal architectural approval** of:

1. WX Phase 1B.5 Master Specification, and  
2. this WX Phase 1B.5 Implementation Master Specification.

Only after explicit approval may the implementation prompt for **WX Phase 1B.5.1** be authored.
