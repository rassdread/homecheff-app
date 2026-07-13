/**
 * Server-only Prisma per-request instrumentation (Phase 2).
 */

import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Prisma } from '@prisma/client';
import type { PrismaPerfCategory, PrismaPerfSnapshot } from '@/lib/performance/prisma-perf-types';

export type { PrismaPerfCategory, PrismaPerfSnapshot };

type PrismaPerfStore = PrismaPerfSnapshot & {
  currentCategory: PrismaPerfCategory;
};

const storage = new AsyncLocalStorage<PrismaPerfStore>();

export function isPrismaPerfEnabled(): boolean {
  return (
    process.env.FEED_PERF_TIMING === '1' ||
    process.env.PRISMA_PERF_TIMING === '1'
  );
}

function createStore(): PrismaPerfStore {
  return {
    queryCount: 0,
    totalMs: 0,
    durationByCategory: {},
    countByCategory: {},
    slowestMs: 0,
    slowestKey: null,
    currentCategory: 'other',
  };
}

export function prismaPerfSetCategory(category: PrismaPerfCategory): void {
  const store = storage.getStore();
  if (store) store.currentCategory = category;
}

export async function runWithPrismaPerfContext<T>(fn: () => Promise<T>): Promise<T> {
  return storage.run(createStore(), fn);
}

export function getPrismaPerfSnapshot(): PrismaPerfSnapshot | null {
  const store = storage.getStore();
  if (!store) return null;
  return {
    queryCount: store.queryCount,
    totalMs: Math.round(store.totalMs),
    durationByCategory: { ...store.durationByCategory },
    countByCategory: { ...store.countByCategory },
    slowestMs: Math.round(store.slowestMs),
    slowestKey: store.slowestKey,
  };
}

export const prismaPerfExtension = Prisma.defineExtension({
  name: 'homecheff-perf',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const store = storage.getStore();
        if (!store) return query(args);

        const category = store.currentCategory;
        const key = `${model}.${operation}`;
        const start = performance.now();
        try {
          return await query(args);
        } finally {
          const ms = performance.now() - start;
          store.queryCount += 1;
          store.totalMs += ms;
          store.countByCategory[category] = (store.countByCategory[category] ?? 0) + 1;
          store.durationByCategory[category] =
            (store.durationByCategory[category] ?? 0) + ms;
          if (ms > store.slowestMs) {
            store.slowestMs = ms;
            store.slowestKey = key;
          }
        }
      },
    },
  },
});
