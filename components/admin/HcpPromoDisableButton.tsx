'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HcpPromoDisableButton({ slideId, disabled }: { slideId: string; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (disabled) {
    return (
      <span className="text-xs text-gray-400" title="Alleen actieve slides kunnen worden uitgeschakeld">
        —
      </span>
    );
  }

  return (
    <button
      type="button"
      className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch(`/api/admin/hcp-carousel/${slideId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: false }),
          });
          if (res.ok) router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? '…' : 'Uitschakelen'}
    </button>
  );
}
