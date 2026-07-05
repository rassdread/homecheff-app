'use client';

import { useSyncExternalStore } from 'react';
import type { OperationsTasksSurface } from '@/components/operations/OperationsTasksSection';

function readTodayTasksSurface(): OperationsTasksSurface {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 640) return 'inline';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function subscribeTodayTasksSurface(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onStoreChange();
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}

export function useTodayTasksSurface(): OperationsTasksSurface {
  return useSyncExternalStore(
    subscribeTodayTasksSurface,
    readTodayTasksSurface,
    () => 'desktop',
  );
}
