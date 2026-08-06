# Guest and Authenticated Proof

| Persona | Status |
|---|---|
| Guest no browser location | BOUNDED — headless guest session; no hard gate; feed chrome visible |
| Auth without saved location | NOT interactive (code: no profile-coords startup wait) |
| Auth with saved location | NOT interactive (Nearby path unchanged when coords exist) |
| Auth stale location | NOT interactive |

Code review confirms session-only `feedStartupBlocked`; no indefinite profile-coords wait.
