import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

// Create Prisma client with optimized connection pooling for Neon
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"], // Less logging in dev
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Optimize for Neon's connection pooling
    // See: https://neon.tech/docs/guides/prisma-connection-pooling
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Connection pooling settings for better performance
// Make sure your DATABASE_URL uses pooled connection (ends with ?pgbouncer=true)
// and DIRECT_URL uses direct connection
