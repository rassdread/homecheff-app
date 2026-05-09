'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { PendingClientReward } from '@/lib/gamification/gamification-me-types';

const DISPLAY_MS = 3200;
const MAX_STACK = 4;

function ToastSurface({ item, onDone }: { item: PendingClientReward; onDone: (id: string) => void }) {
  useEffect(() => {
    const t = window.setTimeout(() => onDone(item.id), DISPLAY_MS);
    return () => window.clearTimeout(t);
  }, [item.id, onDone]);

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto max-w-[min(92vw,20rem)] rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-white px-4 py-3 shadow-lg',
        'animate-hcp-toast-in'
      )}
    >
      <p className="text-sm font-bold text-amber-950 leading-snug">{item.title}</p>
      {item.subtitle ? <p className="mt-0.5 text-xs text-gray-700 leading-snug">{item.subtitle}</p> : null}
    </div>
  );
}

/** Floating reward stack: +HCP, badges, streak — lightweight CSS animation. */
export default function HcpRewardToastDock({ pending }: { pending?: PendingClientReward[] | null }) {
  const [active, setActive] = useState<PendingClientReward[]>([]);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!pending?.length) return;
    const next: PendingClientReward[] = [];
    for (const r of pending) {
      if (seen.current.has(r.id)) continue;
      seen.current.add(r.id);
      next.push(r);
    }
    if (!next.length) return;
    setActive((cur) => [...cur, ...next].slice(-MAX_STACK));
  }, [pending]);

  const remove = useCallback((id: string) => {
    setActive((cur) => cur.filter((x) => x.id !== id));
  }, []);

  if (active.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[100] flex flex-col items-center gap-2 px-3"
      aria-live="polite"
    >
      {active.map((item) => (
        <ToastSurface key={item.id} item={item} onDone={remove} />
      ))}
    </div>
  );
}
