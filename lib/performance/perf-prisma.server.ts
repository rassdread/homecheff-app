/**
 * Server-only perf-aware Prisma accessor for feed route.
 */

import 'server-only';
import { prisma as basePrisma } from '@/lib/prisma';
import {
  isPrismaPerfEnabled,
  prismaPerfExtension,
} from '@/lib/performance/prisma-perf-context.server';

type PrismaClientLike = typeof basePrisma;

let perfPrisma: PrismaClientLike | null = null;

export function getPerfPrisma(): PrismaClientLike {
  if (!isPrismaPerfEnabled()) return basePrisma;
  if (!perfPrisma) {
    perfPrisma = basePrisma.$extends(prismaPerfExtension) as unknown as PrismaClientLike;
  }
  return perfPrisma;
}
