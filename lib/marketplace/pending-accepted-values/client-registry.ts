import type { PendingAcceptedValueRecord } from './types';
import { toPendingAcceptedValueId } from './constants';

const registry = new Map<string, PendingAcceptedValueRecord>();
let loadPromise: Promise<void> | null = null;

export function getPendingAcceptedValueRegistry(): ReadonlyMap<string, PendingAcceptedValueRecord> {
  return registry;
}

export function upsertPendingAcceptedValueInRegistry(
  record: PendingAcceptedValueRecord,
): void {
  registry.set(record.taxonomyId, record);
}

export async function ensurePendingAcceptedValueRegistry(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (registry.size > 0) return;
  if (!loadPromise) {
    loadPromise = fetch('/api/marketplace/pending-accepted-values')
      .then(async (res) => {
        if (!res.ok) return;
        const body = (await res.json()) as { items?: PendingAcceptedValueRecord[] };
        for (const item of body.items ?? []) {
          registry.set(
            item.taxonomyId || toPendingAcceptedValueId(item.id),
            item,
          );
        }
      })
      .catch(() => {
        // offline / private mode — pending labels fall back gracefully
      });
  }
  await loadPromise;
}

export function resetPendingAcceptedValueRegistryForTests(): void {
  registry.clear();
  loadPromise = null;
}
