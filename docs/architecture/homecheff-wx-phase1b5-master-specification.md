# HomeCheff — WX Phase 1B.5 Master Specification  
## Progressive Capability Surfaces

| Field | Value |
| --- | --- |
| Document type | Permanent architectural specification |
| Identifier | **WX-1B.5** |
| Title | Progressive Capability Surfaces |
| Version | **1.0** |
| Status | **Proposed for architectural approval** |
| Date | 2026-08-01 |
| Classification | Architecture planning only — **no implementation** |
| Normative language | MUST / SHOULD / MAY / MUST NOT (RFC 2119 sense) |
| Complements | AWA · WDL v1.0 · WMS v1.0 · WMS v1.1 (Capability Model) · WQS v1.0 |
| Extends | [WX Phase 1B Master Specification](./homecheff-wx-phase1b-master-specification.md) § WX-1B.5 |
| Production baseline at authorship | Merge runtime `0b84f593b3dda5cbe2e54adf30f809a5bab076cc` (WX Phase 1B.4 frozen) |
| Does not authorize | Implementation · code · styling systems · deployment · browser proof · Phase 1B.5.1 · Phase 1B.6 |

**Binding stance:** Once approved, this document is the **sole architectural authority** for every future implementation prompt belonging to WX Phase 1B.5. If implementation conflicts with AWA, WDL, WMS, Capability Model, WQS, or any Production freeze through Phase 1B.4: **implementation MUST change; this architecture MUST NOT**.

---

## 1. Executive Summary

Phases 1B.1–1B.4 completed the Workspace **foundation**:

| Layer | Status |
| --- | --- |
| Mode Engine | Deterministic AvailableSpace → Mode + Posture |
| Transition Continuity | Non-destructive transitions; stable mounts |
| Capability Framework | Deterministic capability plans; **visual activation = zero** |
| Landscape Work Posture | Portrait discovery / landscape work; chrome honesty |

The Workspace can already **know** what it is allowed to do. It does not yet **show** progressive productive surfaces accordingly.

**WX Phase 1B.5** is the first experience layer of the Adaptive Workspace. It does not invent new Modes, new ownership, or new product domains. It defines how **authorized progressive capabilities become progressively presentable** as AvailableSpace and Mode evolve — without confusing users, without device logic, and without breaking continuity.

The correct architectural centre of Phase 1B.5 is:

> **Progressive Capability Surfaces** — Mode- and AvailableSpace-governed presentation of Workspace surfaces that already exist in the Capability Model, with Reachable fallbacks when persistent surfaces retract.

Concepts explicitly **in** Phase 1B.5:

- Progressive Workspace Surfaces  
- Workspace Surface Progression  
- Workspace Surface Prioritisation  
- Progressive Disclosure (as reachability continuity)  
- Adaptive Workspace Tools / Action Surfaces (**presentation only** of already-authorized quick actions and shortcuts)  
- Limited contextual surface **eligibility** (when a Mode may host a living assist region — not the living content system)

Concepts explicitly **deferred** beyond Phase 1B.5:

- Contextual Assist composition / “living modules” honesty system → **1B.6**  
- Professional density / ultrawide densification system → **1B.7**  
- Inspector / Selection Mode as primary product experiences → later authorized phases  
- Workspace Memory · AI · Collaboration · Extensions → **reserved**  
- Navigation IA redesign · search redesign · filter redesign · card redesign · GeoFeed redesign → **out of program**

Capability **activation** (boolean / tier truth) remains owned by the frozen Capability Framework.  
Capability **presentation** (whether and how a surface occupies Workspace chrome) is the concern of Phase 1B.5.

---

## 2. Architectural Purpose

Phase 1B.5 exists to convert **capability truth** into **honest Workspace presence**.

After Landscape Work Posture, the shell already adapts chrome density and navigation reachability by posture. What remains missing is the next evolutionary step:

The Workspace must begin to feel like a **productivity environment** whose assist surfaces, tool surfaces, and disclosure surfaces appear and retract according to AvailableSpace capacity — not according to device mythology, not according to permanent website columns, and not according to hollow decoration.

Phase 1B.5 therefore answers:

1. Which Workspace surfaces may become persistently present in each Mode?  
2. Which surfaces must remain only Reachable?  
3. How surfaces progress as Mode rises and retract as Mode falls?  
4. How progressive disclosure preserves tool access without permanent chrome?  
5. How presentation differs from activation so diagnostics never become fake UI?  
6. How every surface decision remains deterministic under identical AvailableSpace?

---

## 3. Problem Statement

### 3.1 Current state

| What exists | What is missing |
| --- | --- |
| Deterministic Mode | Mode-visible productive surfaces still largely layout-band driven, not capability-presented |
| Deterministic capability plan | Capability visual activation remains zero by design |
| Landscape work posture | Posture chrome is correct; progressive assist/tool surfaces are not yet capability-led |
| Continuity and ownership seals | No permission yet to grow experience without risking ownership / remount mistakes |

### 3.2 User problem

Users experience space changes primarily as **layout rearrangement**. They do not yet experience a clear progressive ladder of Workspace productivity:

- In constrained space: stage-first discovery with tools Reachable.  
- In greater space: one honest assist surface.  
- In expanded space: dual living assist regions.  
- Always: feed remains the stage; tools never strand the user.

Without Phase 1B.5 architecture, implementers will either:

- hard-code device breakpoints into surface presence, or  
- light up hollow permanent panels because space exists, or  
- couple surface presence to Mode Engine internals incorrectly, or  
- skip Reachable fallbacks and lose tools when rails retract.

### 3.3 Architectural problem

**Presentation of progressive capabilities is undefined as a first-class Workspace contract**, even though the Capability Model already names those capabilities.

Phase 1B.5 closes that gap.

---

## 4. Architectural Principles

| ID | Principle | Normative statement |
| --- | --- | --- |
| S1 | **AvailableSpace is the only architectural truth** | Surface presence MUST derive from AvailableSpace → Mode → Capability Plan → Surface Presentation Plan. Device type, OS, user agent, and marketing screen categories MUST NOT decide surfaces. |
| S2 | **Activation ≠ presentation** | Capability Framework decides whether a capability is available / reserved / unreachable. Surface Presentation decides whether that capability occupies persistent chrome, Reachable disclosure, or remains non-present. |
| S3 | **Foundation immutability** | Mode Engine, Transition Continuity, Capability Framework contracts, Landscape Work Posture semantics, GeoFeed ownership, and Controlled Host posture MUST NOT be redesigned by Phase 1B.5. |
| S4 | **Progressive honesty** | Surfaces MAY appear only when they carry real Workspace value. Hollow permanent surfaces are forbidden. |
| S5 | **Retraction with Reachability** | When AvailableSpace shrinks, persistent surfaces MAY retract, but previously available tools MUST remain Reachable where the Capability Model requires reachability. |
| S6 | **Continuity first** | Surface appearance or retraction MUST NOT remount the feed stage, reload listings for space reasons alone, fork writers/renderers, or reset user workspace state. |
| S7 | **Feed remains the stage** | Progressive surfaces support the feed; they MUST NOT replace, duplicate, or visually eclipse the primary discovery stage. |
| S8 | **Determinism** | Identical AvailableSpace inputs MUST yield an identical Surface Presentation Plan. |
| S9 | **Fail closed** | Invalid or impossible space MUST fail closed to the most constrained honest surface set (stage-first; tools Reachable). |
| S10 | **Reserved stays reserved** | Memory, AI, Collaboration, and Extensions MUST remain non-presentable under Phase 1B.5. |
| S11 | **No IA redesign** | Phase 1B.5 MUST NOT redefine navigation information architecture, search mental model, filter taxonomy, or card systems. It may only change **where and how** already-authorized tools appear. |
| S12 | **Posture awareness without device logic** | Landscape Work Posture MAY affect surface eligibility only through AvailableSpace geometry and existing posture semantics — never through device detection. |

---

## 5. Workspace Surface Philosophy

A **Workspace Surface** is a durable region of Workspace presentation where a class of user work may persistently or transiently occur.

Surfaces are not pages.  
Surfaces are not marketing sections.  
Surfaces are not device layouts.

Surfaces are **capacity-shaped places of work** inside one continuous Workspace.

### 5.1 Mental model

```
Stage (feed) ── always primary
  ├─ Orientation / command chrome ── always present (may densify)
  ├─ Persistent assist surfaces ── unlock with Mode capacity
  └─ Reachable disclosure surfaces ── preserve tools when assist is absent
```

### 5.2 Philosophical rules

1. **Presence must mean usefulness.** If a surface has nothing honest to host, it MUST NOT occupy permanent space.  
2. **Absence must not mean abandonment.** Tools that leave persistent chrome MUST remain discoverable through progressive disclosure.  
3. **Growth must feel additive.** Rising Mode SHOULD add concurrent capacity, not reshuffle the user’s primary task identity.  
4. **Shrinkage must feel continuous.** Falling Mode SHOULD compress and retract, never reboot the Workspace.  
5. **Landscape is work posture.** In landscape, surface priority may favour compact work affordances earlier than portrait at equal width — still AvailableSpace geometry, not a phone exception.

---

## 6. Progressive Capability Philosophy

### 6.1 Capability ladder (conceptual)

```
Browse ──► Compact ──► Hybrid ──► Full ──► Professional
  CORE      +assist     +rail      +dual     (+density later)
```

Phase 1B.5 implements the **surface consequences** of this ladder for presentation — not Professional densification (1B.7) and not living assist composition (1B.6).

### 6.2 Three truths that must remain distinct

| Truth | Owner | Phase 1B.5 role |
| --- | --- | --- |
| **Mode truth** | Mode Engine | Consume only |
| **Capability truth** | Capability Framework | Consume only |
| **Surface presentation truth** | Phase 1B.5 Surface Presentation Model | Define and later implement |

### 6.3 Progressive means two directions

1. **Unlock:** as AvailableSpace grows, eligible surfaces MAY become persistently present.  
2. **Retract:** as AvailableSpace shrinks, persistent surfaces MAY become Reachable-only — without state loss.

Progressive does **not** mean animated gimmickry, device-specific toolbars, or permanent dual columns on insufficient space.

---

## 7. Workspace Surface Model

### 7.1 Surface classes in Phase 1B.5

| Surface class | Meaning | Phase 1B.5 status |
| --- | --- | --- |
| **Stage Surface** | Primary feed discovery region | CORE — always present; never redesigned as ownership |
| **Orientation Surface** | Workspace orientation / posture chrome | CORE — always present; may compact under existing posture rules |
| **Command Surface** | Essential top / bottom command affordances | CORE family — reachability preserved; no IA redesign |
| **Assist Surface** | Persistent supporting region for contextual work | Progressive — eligible by Mode capacity |
| **Tool Surface** | Quick actions / shortcuts presentation | Progressive / Reachable per Capability Model |
| **Disclosure Surface** | Drawer / sheet / overflow presentation of Reachable tools | Required continuity mechanism |
| **Utility Surface** | Transient utility capacity | Out of Phase 1B.5 primary scope (Professional later) |
| **Reserved Surfaces** | Memory / AI / Collaboration / Extensions | Forbidden to present |

### 7.2 Surface progression states

Every progressive surface exists in exactly one presentation state for a given plan:

| State | Meaning |
| --- | --- |
| **Absent** | Not eligible; MUST NOT occupy chrome |
| **Reachable** | Available through disclosure without persistent occupation |
| **Persistent** | Occupies authorized Workspace region while Mode capacity holds |
| **Compacted** | Persistent but density-reduced under posture / height honesty |
| **Reserved-blocked** | Named future surface; MUST remain Absent |

### 7.3 Surface Prioritisation (normative order under contention)

When AvailableSpace is insufficient for all eligible desires, priority MUST be:

1. Stage Surface integrity (readable feed stage)  
2. Orientation + essential Command reachability  
3. Primary Create / Quick Action reachability  
4. One Assist Surface (if Mode allows any)  
5. Secondary Assist Surface (Full / Professional capacity only)  
6. Persistent Tool Surfaces beyond essentials  
7. Decorative or low-value modules — **never** ahead of 1–3

Under contention, lower priorities become Reachable or Absent. They MUST NOT steal stage readability.

### 7.4 Dual-assist rule

- Browse: Assist Surfaces Absent as persistent regions.  
- Compact: at most one Assist Surface when capacity/posture allows.  
- Hybrid: one preferred Assist Surface.  
- Full / Professional: two persistent Assist Surfaces when capacity allows.

Phase 1B.5 defines **eligibility and prioritisation**. It does not define the editorial content of those assists (1B.6).

---

## 8. Capability Presentation Model

### 8.1 Definition

**Capability Presentation** is the mapping:

```
Capability Plan  ×  Surface Priorities  ×  Posture honesty
        →  Surface Presentation Plan
```

### 8.2 Presentation outcomes per capability class

| Capability class (WMS 1.1) | Presentation rule in 1B.5 |
| --- | --- |
| CORE | MUST remain present or Reachable; MUST NOT disappear |
| Progressive (Y / P) | MAY become Persistent only when Mode capacity and honesty allow |
| Reachable (R) | MUST NOT be forced into permanent chrome solely because space exists |
| Reserved (RES) | MUST remain Absent |
| Forbidden | MUST remain Absent |

### 8.3 Activation vs presentation (hard separation)

| Event | Allowed in 1B.5? |
| --- | --- |
| Capability Framework changes boolean availability | No — already frozen; consume only |
| Surface Presentation shows a Persistent Assist because capability is available | Yes |
| Surface Presentation invents a new capability not in the matrix | No |
| Diagnostics claim visual activation while presentation remains off | No — presentation on implies honest visual activation semantics for that surface class |
| “Visual activation” of reserved capabilities | No |

Phase 1B.5 is the first phase allowed to move selected progressive capabilities from **diagnostics-only** to **presented**, strictly for surface classes in scope. It MUST NOT claim program-wide “all capabilities visually active.”

### 8.4 In-scope capability presentation targets

Phase 1B.5 SHOULD govern presentation for:

- Left / Right Assist eligibility (per Mode matrix)  
- Multi-panel layout presence as surface occupancy (not inspector product)  
- Workspace Shortcuts presentation (persistent vs Reachable)  
- Progressive Disclosure behaviour for filters/tools already in product  
- Drawer / overflow behaviour as Reachable continuity  
- Quick Actions continuity under posture and Mode change  

Phase 1B.5 MUST NOT govern presentation for:

- Inspector Panel product behaviour  
- Selection Mode product behaviour  
- Context Memory  
- AI / Collaboration / Extensions regions  
- New search or filter taxonomies  

---

## 9. Workspace Density Strategy

Phase 1B.5 density is **honesty density**, not Professional densification.

### 9.1 What density means here

Density is the packing and compaction of **already-eligible surfaces** so that:

- short height compresses orientation before sacrificing stage  
- landscape work posture prefers compact chrome and earlier assist eligibility where WMS allows  
- expanded width prefers additional assist capacity before empty margin growth  

### 9.2 What density does not mean here

Phase 1B.5 MUST NOT introduce:

- Professional pointer densification systems  
- ultrawide module packing programs  
- typography / motion / visual identity density systems  
- card redesign for denser grids  

Those belong to later phases (notably 1B.7 for Professional density).

### 9.3 Density relationship to surfaces

| Condition | Density response |
| --- | --- |
| Height constrained | Compact Orientation / Command before removing Stage |
| Width constrained | Prefer Reachable tools over Persistent Assist |
| Width expanded | Prefer Persistent Assist over empty lateral space |
| Landscape work posture | Compact chrome; preserve Stage; allow Compact assist eligibility per geometry |

---

## 10. Progressive Disclosure Strategy

Progressive Disclosure is the **continuity mechanism** of Phase 1B.5.

### 10.1 Purpose

When a tool cannot honestly occupy persistent chrome, disclosure MUST keep it Reachable without:

- trapping the user  
- inventing a second navigation IA  
- blocking Stage interaction after close  
- duplicating business logic owners  

### 10.2 Disclosure rules

1. Disclosure is transient presentation, not a permanent second Workspace.  
2. Opening disclosure MUST be intentional; it MUST NOT auto-open merely because Mode changed.  
3. Closing disclosure MUST restore Stage interaction.  
4. Disclosure content MUST be the same logical destinations/actions as persistent counterparts where applicable — no divergent owners.  
5. Landscape Work Posture already established that collapsed command surfaces require Reachable equivalents; Phase 1B.5 generalizes that honesty to progressive capability surfaces.

### 10.3 Disclosure vs Assist

| | Assist Surface | Disclosure Surface |
| --- | --- | --- |
| Persistence | Persistent while eligible | Transient |
| Capacity cost | Occupies working area | Overlays temporarily |
| Use when | Mode capacity supports concurrent help | Capacity does not, or user requests overflow |

---

## 11. Contextual Surface Strategy

### 11.1 Scoped meaning in Phase 1B.5

“Contextual” in Phase 1B.5 means:

> Surfaces whose **eligibility** depends on Mode, posture, and AvailableSpace capacity.

It does **not** mean:

> Intelligent personalization, memory, AI assistance, or editorial opportunity systems.

### 11.2 Eligibility only

Phase 1B.5 defines when an Assist Surface may exist.  
Phase 1B.6 defines how authorized assist content must feel living and non-hollow once that surface exists.

### 11.3 Context-sensitive behaviour allowed now

- Mode-dependent persistent panel count  
- Posture-dependent compact presentation  
- Prioritisation under contention  
- Reachable fallback when context region retracts  

### 11.4 Context-sensitive behaviour forbidden now

- New opportunity ranking platforms  
- Fake “assistant” panels  
- Memory-like persistence of contextual UI state that forks ownership  
- Collaboration / multi-user contextual regions  

---

## 12. AvailableSpace Decision Model

### 12.1 Exclusive inputs

Surface Presentation MAY consider only:

| Input | Role |
| --- | --- |
| Usable width | Primary driver of Mode and assist count |
| Usable height | Compression / demotion / short-height honesty |
| Interaction space | Refinement of targets within an already-eligible surface set — MUST NOT alone upgrade Mode or unlock dual assists |
| Workspace density | Packing honesty within eligible surfaces |
| Available working area | Overall capacity envelope |
| Mode plan | From Mode Engine |
| Capability plan | From Capability Framework |
| Work posture | Portrait discovery / landscape work from existing posture semantics |

### 12.2 Decision chain (conceptual, not procedural code)

1. Measure AvailableSpace.  
2. Resolve Mode + Posture (existing engines).  
3. Resolve Capability Plan (existing framework).  
4. Derive Surface Presentation Plan: Absent / Reachable / Persistent / Compacted per surface class.  
5. Apply prioritisation under contention.  
6. Emit deterministic plan; present without remounting Stage ownership.

### 12.3 Invariants

- Same floored AvailableSpace → same Surface Presentation Plan.  
- No user-agent branch.  
- No device-class branch.  
- Fail closed to stage-first Reachable tools.  
- Landscape eligibility remains geometry, not hardware identity.

---

## 13. Relationship with Authoritative Documents

### 13.1 AWA

| AWA concern | Phase 1B.5 relationship |
| --- | --- |
| AvailableSpace measurement | Consumed as sole truth |
| Stable mount / slots / panels | Presentation occupies authorized regions; MUST NOT break mount contracts |
| Ownership seals | Reaffirmed; surfaces are presentation, not runtime owners |
| Fail-closed | Inherited |

Phase 1B.5 MUST NOT amend AWA ownership.

### 13.2 WDL

| WDL concern | Phase 1B.5 relationship |
| --- | --- |
| Workspace-first / feed-first | Stage Surface primacy |
| Continuous Workspace | Surface unlock/retract without reboot feeling |
| Permanent rails honesty | Assist Surfaces only when valuable |
| Progressive disclosure | Formalized as Reachable continuity |
| No dead space | Prefer Assist over empty expanded width when eligible |
| No hollow modules | Eligibility alone does not authorize empty persistent cards |

### 13.3 WMS v1.0

| WMS v1.0 concern | Phase 1B.5 relationship |
| --- | --- |
| Mode entry conditions | Consumed |
| Portrait / landscape posture | Consumed; landscape work posture remains authoritative |
| Transition model | Surface changes MUST obey non-destructive transition laws |

### 13.4 Capability Model (WMS v1.1)

| Capability Model concern | Phase 1B.5 relationship |
| --- | --- |
| Capability matrix | Presentation source of truth for what may appear |
| Progressive unlock / retraction | Surface Progression implements presentation consequences |
| Reachable class | Disclosure Surfaces implement honesty |
| Reserved rows | Hard presentation block |
| Evolution prohibitions E1–E7 | Binding on surface changes |

### 13.5 WQS

| WQS concern | Phase 1B.5 relationship |
| --- | --- |
| Architecture before implementation | This Master Spec is the prerequisite |
| Evidence before freeze | Future implementation MUST satisfy WQS gates |
| Ownership / continuity blockers | Surface presentation regressions are promotion blockers |
| Progressive disclosure claims | Must be proven if claimed |

---

## 14. Production Safety Principles

1. **Additive presentation only** relative to frozen foundation behaviour.  
2. **Independent rollback** of Phase 1B.5 presentation without undoing 1B.1–1B.4 engines.  
3. **No migrations** of data or database schema as part of surface presentation.  
4. **No Host ACTIVE** and no GeoFeed ownership transfer.  
5. **No second Stage renderer** and no second feed writer.  
6. **No Mode-dependent remount identity**.  
7. **Navigation reachability must not regress** relative to Phase 1B.4 guarantees.  
8. **Capability reserved rows remain dark**.  
9. **Production freezes 1A–1B.4 remain authoritative constraints**, not historical notes.  
10. **If unsure, fail closed to Reachable tools + Stage primacy**.

---

## 15. Validation Philosophy

Validation of Phase 1B.5 is architectural and behavioural, not stylistic.

Future validation MUST prove:

- Surface Presentation Plan determinism across AvailableSpace vectors  
- Mode × surface eligibility matches Capability Model intent  
- Retraction preserves Reachability for required tools  
- Contention prioritisation never sacrifices Stage readability  
- No reserved capability presentation  
- No ownership / mount / writer regressions  
- Landscape and portrait posture remain coherent with 1B.4  

Validation MUST NOT require device labs as architectural truth. Measured AvailableSpace vectors are sufficient architectural proof inputs.

---

## 16. Browser Proof Philosophy

Browser proof, when later authorized, exists to observe:

- what surfaces are persistently present  
- what tools remain Reachable  
- whether Stage remains interactive  
- whether transitions remount or reload  
- whether hollow persistent regions appear  

Browser proof is **evidence of architecture**, not a substitute for architecture.

This Master Specification deliberately does not prescribe proof harnesses, viewport lists, or deployment steps. Those belong to implementation planning after approval.

---

## 17. Release Philosophy

Phase 1B.5 MUST be released as a controlled experience layer:

- foundation engines remain frozen dependencies  
- presentation changes are reviewable as a single architectural theme: Progressive Capability Surfaces  
- promotion requires WQS-quality evidence  
- freeze must record rollback to pre-1B.5 presentation behaviour  

Phase 1B.5 MUST NOT be released as a grab-bag of unrelated UI redesigns.

---

## 18. Rollback Philosophy

Rollback of Phase 1B.5 means:

- Surface Presentation returns to pre-1B.5 behaviour  
- Mode Engine, Continuity, Capability Framework, and Landscape Work Posture remain intact  
- users retain Stage and previously guaranteed navigation reachability  
- no irreversible state remains  

Rollback MUST be possible without database surgery and without ownership transfer reversal (because no ownership transfer is allowed).

---

## 19. Expected End State

When Phase 1B.5 is complete and frozen, the Workspace MUST exhibit:

1. **Capability-presented surfaces** — assist and tool surfaces appear according to Capability Plan + AvailableSpace, not device labels.  
2. **Progressive ladder clarity** — Browse feels stage-first; Compact may gain one assist; Hybrid has clear assisted work; Full shows dual-assist capacity when space allows.  
3. **Honest retraction** — shrinking space removes persistent assists without stranding tools.  
4. **Unbroken Stage** — feed identity, scroll ownership, and mount continuity remain intact across surface changes.  
5. **Zero reserved leakage** — Memory / AI / Collaboration / Extensions remain absent.  
6. **Preserved posture** — Landscape Work Posture remains compact work; portrait remains discovery-first.  
7. **Still presentation-only ownership** — GeoFeed and Controlled Host unchanged.  
8. **Ready for 1B.6** — Assist Surfaces exist as honest places where living contextual content can later be composed without inventing surface eligibility again.

The end state is **not** a finished Professional densification system and **not** a finished contextual intelligence layer.

---

## 20. Risks

| Risk | Why it matters | Architectural mitigation |
| --- | --- | --- |
| Treating 1B.5 as UI redesign | Breaks IA / search / filters / cards freezes | Strict out-of-scope list; presentation-only mandate |
| Coupling presentation into Mode Engine | Destabilizes frozen foundation | Hard separation of Mode / Capability / Surface Presentation truths |
| Lighting hollow rails because space exists | Violates WDL honesty | Hollow-permanent ban; 1B.6 owns living content rules |
| Skipping Reachable fallbacks | Repeats 1B.4 navigation class of failure | Disclosure continuity as first-class strategy |
| Device forks under pressure | Destroys AvailableSpace authority | Explicit prohibition; fail-closed vectors |
| Claiming all capabilities visually active | Overclaims vs reserved / deferred rows | Scoped presentation targets only |
| Pulling 1B.6 / 1B.7 into 1B.5 | Creates unreviewable mega-phase | Deferred concepts listed; end-state bounded |
| Ownership leaks via “smart surfaces” | Breaks AWA seals | Presentation-only authority reaffirmation |
| Dual diagnostic / presentation conflict | Confusing truth sources | Surface Presentation Plan is the sole presentation authority once active |

---

## 21. Future Phase Candidates

These are **not** authorized by this document; they are sequencing guidance after 1B.5 freezes:

| Candidate | Why after 1B.5 |
| --- | --- |
| **WX-1B.6 Contextual Assist (non-reserved)** | Needs Assist Surface eligibility already honest |
| **WX-1B.7 Density & Professional Mode** | Needs dual-assist surfaces stable before densification |
| **WX-1B.8 Integrated Proof & Program Freeze** | Closes Phase 1B under WQS |
| Inspector / Selection experiences | Require multi-panel maturity and separate product authorization |
| Workspace Memory | Reserved; needs ADR |
| AI Assistant region | Reserved; needs ADR |
| Collaboration region | Reserved; needs ADR |
| Workspace Extensions | Reserved; needs ADR |
| Controlled Host ACTIVE / ownership migration | Separate runtime ADR — never a surface phase |

---

## Concept Inclusion Record

Derived answer to the scoping question in the authoring brief:

| Concept | Phase 1B.5? | Rationale |
| --- | --- | --- |
| Progressive Workspace Surfaces | **Yes — core** | Primary architectural object |
| Workspace Surface Progression | **Yes** | Unlock/retract model |
| Workspace Surface Prioritisation | **Yes** | Contention safety |
| Progressive Disclosure | **Yes** | Reachability continuity |
| Adaptive Workspace Tools / Action Surfaces | **Yes — presentation only** | Quick actions / shortcuts presence rules |
| Contextual Workspace Panels | **Eligibility only** | Presence rules now; living content in 1B.6 |
| Context-sensitive Workspace Behaviour | **Limited** | Mode/posture eligibility, not intelligence |
| Workspace Density Evolution | **Honesty density only** | Professional densification deferred to 1B.7 |
| Professional Workspace foundations | **Surface eligibility only** | Not densification program |
| Workspace Memory / AI / Collaboration / Extensions | **No** | Reserved |

---

## Mandatory Stop Gate

**STOP.**

- Do not implement Phase 1B.5.  
- Do not author WX Phase 1B.5.1.  
- Do not write implementation prompts.  
- Do not modify Production.  
- Do not begin browser proof or deployment planning as architecture work.

Await **formal architectural approval** of this Master Specification before any implementation planning begins.

---

## Document Control

| Field | Value |
| --- | --- |
| Supersedes | Nothing (new phase-specific master) |
| Must be cited by | Every future WX-1B.5 implementation / review / freeze prompt |
| Conflict rule | Frozen authorities win; this document wins over informal implementation preference |
| Approval gate | Architectural approval required before implementation planning |
