'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ChatShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Vaste chat-container: overflow verborgen; op desktop afgerond met rand, op mobiel full-bleed.
 */
export default function ChatShell({ children, className }: ChatShellProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white',
        'rounded-none border-0 shadow-none ring-0',
        'lg:rounded-2xl lg:border lg:border-gray-200/90 lg:shadow-sm lg:ring-1 lg:ring-black/[0.04]',
        className
      )}
    >
      {children}
    </div>
  );
}
