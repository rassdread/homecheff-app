# AW-R5 Category C preservation

## Baseline (branch creation from AW-R4 freeze fe4ad5e5)

Paths under `docs/audits/artifacts/phase3b2/` preserved dirty; never staged.

Post-proof SHA-256 (may regenerate during sealed Chromium; left unstaged):

```
0efe4fae95e7e4b48d6c14ef2e71b9879308649b3dc48687f0c78b6284d0a599  docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof-summary.md
a653b9dd57b9a940eaecb4ce839372bc90fb0328af06a3735d2237c689d7c9c4  docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json
7862c9a33717c45f287e16af5d2a54a0f0fe67ce789f91e72fe364bd16f3bffa  docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json
```

## Classification

| Class | Paths | Action |
| --- | --- | --- |
| Category C | `docs/audits/artifacts/phase3b2/*` | Preserved dirty; never staged |
| Category C | Unrelated untracked docs/scripts | Left untracked |
| Category A | AW-R5 sealed/bridge/tests/proofs | Staged in AW-R5 commits only |
