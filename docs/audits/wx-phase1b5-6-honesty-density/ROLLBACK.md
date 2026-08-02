# WX Phase 1B.5.6 — Rollback

## Scope

Honesty Density is diagnostics-only. No DB migration. No chrome behaviour change.

## Procedure

1. Do not merge `wx/phase-1b5-6-honesty-density` if review fails.
2. If already merged: revert the merge commit (or reset feature commits).
3. Behavioural Production baseline remains 1B.5.5: `ad68d843d0b85b222cf524fd8016d3a18a45068b`.
4. Branch base tip before this phase: `3701cdcea93c87235f42b901ed01bc03d7faaa61`.

## Risk

Low — planner + diagnostics attributes only; sealed `appliesCompaction=false`.
