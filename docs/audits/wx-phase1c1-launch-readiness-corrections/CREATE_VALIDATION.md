# Create Validation

| Context | Result |
| --- | --- |
| Guest phone portrait | PASS — bottom primary Create |
| Guest phone landscape | PASS — landscape NavBar Create |
| Tablet portrait/landscape | PASS |
| Laptop/Desktop/Ultrawide | PASS — single primary Create |
| Rotation portrait↔landscape | PASS — Create remains reachable |
| Secondary left-rail Create | Present as non-primary shortcut only |

Invariant: Workspace never lacks a discoverable Create when bottom nav collapses.
