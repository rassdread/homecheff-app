# Prisma baseline registration — official flow only

**Do not** manually `INSERT` into `_prisma_migrations`.  
**Do not** construct checksums by hand.  
**Do not** manipulate Prisma-internal columns.

Prisma records migration history via:

- `npx prisma migrate deploy` — runs pending `migration.sql` files and records checksum automatically
- `npx prisma migrate resolve --applied <name>` — marks a migration applied **without** running SQL (after DDL already matches)

## Greenfield (empty disposable database)

### Path A — preferred after promote (single baseline in `prisma/migrations/`)

Prerequisite: historical pre-cutoff folders archived to `prisma/migrations-archive/`.

```bash
export GREENFIELD_DATABASE_URL="postgresql://...@<disposable-host>/..."
npx prisma migrate deploy --schema prisma/schema.prisma
```

Runs only `20260714_greenfield_current_state_baseline/migration.sql` on an empty DB.

### Path B — DDL already applied via `db execute`

Use when baseline DDL was applied outside `migrate deploy` (e.g. large script split):

```bash
npx prisma db execute \
  --file prisma/baseline-staging/20260713_current_state/schema_baseline.sql \
  --url "$GREENFIELD_DATABASE_URL" \
  --schema prisma/schema.prisma

npx prisma migrate resolve --applied 20260714_greenfield_current_state_baseline \
  --schema prisma/schema.prisma
```

**Order matters:** DDL first, then `resolve --applied`. Resolve never runs SQL.

## Shared Neon (existing database)

**Never** run baseline DDL or `migrate deploy` of the baseline on shared Neon.

When baseline folder is promoted, run **once** after review:

```bash
npx prisma migrate resolve --applied 20260714_greenfield_current_state_baseline \
  --schema prisma/schema.prisma
```

Only when live schema already matches `schema.prisma` (true today).

## Post-cutoff

```bash
npx prisma migrate deploy
```

Runs only migrations with timestamp **after** `20260714_greenfield_current_state_baseline`.
