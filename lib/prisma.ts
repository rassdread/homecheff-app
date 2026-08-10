import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

/**
 * Neon pooler + Prisma in serverless: keep Prisma's internal pool tiny (PgBouncer pools).
 * Without this, each isolate opens connection_limit=5 and Production auth can hit P2024
 * under concurrent page/cron/OAuth load — which breaks Google sign-in session minting.
 */
function resolveDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return raw;
  try {
    const u = new URL(raw.trim());
    const isPooler =
      u.hostname.includes("-pooler") || u.searchParams.get("pgbouncer") === "true";
    if (isPooler) {
      if (!u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
      if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "1");
      if (!u.searchParams.has("pool_timeout")) u.searchParams.set("pool_timeout", "20");
    }
    return u.toString();
  } catch {
    return raw;
  }
}

// Create Prisma client with optimized connection pooling for Neon
const createPrismaClient = () => {
  const url = resolveDatabaseUrl(process.env.DATABASE_URL);
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url,
      },
    },
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Prefer Neon pooled DATABASE_URL (?pgbouncer=true) + DIRECT_URL for migrations.
