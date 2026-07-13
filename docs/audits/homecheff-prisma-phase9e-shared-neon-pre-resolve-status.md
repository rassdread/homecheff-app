# Phase 9E — Shared Neon status (pre-resolve)

**Command (read-only):** `npx prisma migrate status`  
**Expected:** baseline pending + applied-but-missing legacy migrations  
**Resolve required:** `true` (do **not** run in Phase 9E)

## Output (verbatim)

```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "neondb", schema "public" at "ep-summer-darkness-a2l0745u.eu-central-1.aws.neon.tech"

1 migration found in prisma/migrations
Your local migration history and the migrations table from your database are different:

The last common migration is: null

The migration have not yet been applied:
20260714_greenfield_current_state_baseline

The migrations from the database are not found locally in prisma/migrations:
<62 legacy migration names omitted here for brevity — see Phase 9E archive-manifest>
```

