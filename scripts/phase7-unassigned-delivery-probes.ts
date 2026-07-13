/**
 * Phase 7 read-only delivery schema + data probes.
 * No DDL or data mutations.
 */
import { prisma } from "../lib/prisma";

async function main() {
  const migrationWindow = "2026-02-11";

  const deliveryTables = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name ILIKE '%delivery%'
    ORDER BY table_name
  `;

  const deliveryProfileCols = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'DeliveryProfile'
    ORDER BY ordinal_position
  `;

  const deliveryOrderCols = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'DeliveryOrder'
    ORDER BY ordinal_position
  `;

  const deliveryProfileConstraints = await prisma.$queryRaw`
    SELECT tc.constraint_name, tc.constraint_type, kcu.column_name,
           ccu.table_name AS foreign_table, rc.delete_rule
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    LEFT JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
    WHERE tc.table_schema = 'public' AND tc.table_name = 'DeliveryProfile'
    ORDER BY tc.constraint_type, tc.constraint_name
  `;

  const deliveryOrderConstraints = await prisma.$queryRaw`
    SELECT tc.constraint_name, tc.constraint_type, kcu.column_name,
           ccu.table_name AS foreign_table, rc.delete_rule
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    LEFT JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
    WHERE tc.table_schema = 'public' AND tc.table_name = 'DeliveryOrder'
    ORDER BY tc.constraint_type, tc.constraint_name
  `;

  const deliveryProfileIndexes = await prisma.$queryRaw`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE tablename = 'DeliveryProfile' ORDER BY indexname
  `;

  const profileStats = await prisma.$queryRaw`
    SELECT
      COUNT(*)::int AS total_profiles,
      COUNT(*) FILTER (WHERE "userId" IS NULL)::int AS null_user_id,
      COUNT(*) FILTER (WHERE "isActive" = true)::int AS active,
      COUNT(*) FILTER (WHERE "isVerified" = true)::int AS verified,
      COUNT(*) FILTER (WHERE "createdAt"::date = ${migrationWindow}::date)::int AS created_on_migration_date,
      MIN("createdAt") AS earliest_created,
      MAX("createdAt") AS latest_created
    FROM "DeliveryProfile"
  `;

  const profileNamePatterns = await prisma.$queryRaw`
    SELECT
      COUNT(*) FILTER (WHERE LOWER(COALESCE("bio", '')) LIKE '%unassigned%')::int AS bio_unassigned,
      COUNT(*) FILTER (WHERE LOWER(COALESCE("bio", '')) LIKE '%system%')::int AS bio_system,
      COUNT(*) FILTER (WHERE LOWER(COALESCE("homeAddress", '')) LIKE '%unassigned%')::int AS addr_unassigned
    FROM "DeliveryProfile"
  `;

  const orderStats = await prisma.$queryRaw`
    SELECT
      COUNT(*)::int AS total_orders,
      COUNT(*) FILTER (WHERE "deliveryProfileId" IS NULL)::int AS null_profile_id,
      COUNT(*) FILTER (WHERE status = 'PENDING' AND "deliveryProfileId" IS NULL)::int AS pending_unassigned,
      COUNT(*) FILTER (WHERE status = 'PENDING' AND "deliveryProfileId" IS NOT NULL)::int AS pending_assigned,
      COUNT(*) FILTER (WHERE "createdAt"::date = ${migrationWindow}::date)::int AS created_on_migration_date,
      MIN("createdAt") AS earliest_created,
      MAX("createdAt") AS latest_created
    FROM "DeliveryOrder"
  `;

  const profilesOnMigrationDate = await prisma.$queryRaw`
    SELECT id, "userId", age, "isActive", "isVerified", "createdAt"
    FROM "DeliveryProfile"
    WHERE "createdAt"::date = ${migrationWindow}::date
    ORDER BY "createdAt"
    LIMIT 20
  `;

  const ordersOnMigrationDate = await prisma.$queryRaw`
    SELECT id, "orderId", "deliveryProfileId", status, "createdAt"
    FROM "DeliveryOrder"
    WHERE "createdAt"::date = ${migrationWindow}::date
    ORDER BY "createdAt"
    LIMIT 20
  `;

  const systemUsers = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM "User"
    WHERE LOWER(COALESCE(email, '')) LIKE '%system%'
       OR LOWER(COALESCE(username, '')) LIKE '%system%'
       OR LOWER(COALESCE(name, '')) LIKE '%unassigned%'
  `;

  const orphanDeliveryOrders = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS orphan_profile_fk
    FROM "DeliveryOrder" d
    LEFT JOIN "DeliveryProfile" p ON p.id = d."deliveryProfileId"
    WHERE d."deliveryProfileId" IS NOT NULL AND p.id IS NULL
  `;

  const deliveryRequestStats = await prisma.$queryRaw`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'OPEN')::int AS open_count
    FROM "DeliveryRequest"
  `;

  const courierAssignmentStats = await prisma.$queryRaw`
    SELECT status, COUNT(*)::int AS count
    FROM "CourierAssignment"
    GROUP BY status
    ORDER BY status
  `;

  const relatedMigrations = await prisma.$queryRaw`
    SELECT migration_name, started_at, applied_steps_count, checksum::text
    FROM _prisma_migrations
    WHERE migration_name IN (
      '20250921112416_add_delivery_profile_system',
      '20251113120000_make_delivery_profile_optional',
      '20260210120000_add_unassigned_delivery_profile',
      '20260705240000_delivery_marketplace_foundation_v1'
    )
    ORDER BY started_at
  `;

  const output = {
    generated_at: new Date().toISOString(),
    migration_under_investigation: "20260210120000_add_unassigned_delivery_profile",
    delivery_tables: deliveryTables,
    delivery_profile: {
      columns: deliveryProfileCols,
      constraints: deliveryProfileConstraints,
      indexes: deliveryProfileIndexes,
      stats: profileStats,
      name_patterns: profileNamePatterns,
      created_on_migration_date: profilesOnMigrationDate,
    },
    delivery_order: {
      columns: deliveryOrderCols,
      constraints: deliveryOrderConstraints,
      stats: orderStats,
      orphan_profile_fk: orphanDeliveryOrders,
      created_on_migration_date: ordersOnMigrationDate,
    },
    delivery_request: deliveryRequestStats,
    courier_assignment: courierAssignmentStats,
    system_user_pattern_count: systemUsers,
    related_migrations_timeline: relatedMigrations,
  };

  console.log(JSON.stringify(output, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
