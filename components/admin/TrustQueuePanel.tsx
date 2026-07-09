'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

type QueueItem = {
  id: string;
  source: string;
  type: string;
  status: string;
  reason: string;
  createdAt: string;
  tracked: boolean;
  links: { userId?: string; orderId?: string; productId?: string; reportId?: string };
};

export default function TrustQueuePanel() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<Record<string, { tracked: boolean; note?: string }>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/trust-queue?limit=40');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setSources(data.sources || {});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Trust queue
          </h3>
          <p className="text-sm text-gray-600">Unified operational signals — no fake metrics.</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg border hover:bg-gray-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        {Object.entries(sources).map(([key, meta]) => (
          <span
            key={key}
            className={`px-2 py-1 rounded-full border ${
              meta.tracked ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'
            }`}
            title={meta.note}
          >
            {key}: {meta.tracked ? 'tracked' : 'not tracked'}
          </span>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No trust signals in queue.</p>
      ) : (
        <ul className="divide-y max-h-80 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id} className="py-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium text-gray-900">
                  [{item.source}] {item.type}
                </span>
                <span className="text-gray-500 shrink-0">
                  {new Date(item.createdAt).toLocaleString('nl-NL')}
                </span>
              </div>
              <p className="text-gray-600 mt-1">{item.reason}</p>
              <p className="text-xs text-gray-500 mt-1">Status: {item.status}</p>
              <div className="flex gap-3 mt-2 text-xs">
                {item.links.userId ? (
                  <Link href={`/admin?tab=users`} className="text-blue-600 hover:underline">
                    User
                  </Link>
                ) : null}
                {item.links.orderId ? (
                  <Link href={`/admin?tab=orders`} className="text-blue-600 hover:underline">
                    Order
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
