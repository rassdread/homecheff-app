"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  total: number | null;
  status: string | null;
  createdAt: string;
  items?: Array<{ id: string; title?: string | null; quantity?: number | null; price?: number | null }>;
};

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load(p = 1) {
    setLoading(true);
    const res = await fetch(`/api/profile/orders?page=${p}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.items || []);
      setTotalPages(data.meta?.totalPages || 1);
    }
    setLoading(false);
  }

  useEffect(() => { load(page); }, [page]);

  if (loading) return <div className="rounded-xl border p-4 bg-white animate-pulse h-32" />;
  if (!orders.length) return <div className="rounded-xl border p-4 bg-white text-sm text-muted-foreground">Nog geen bestellingen.</div>;

  return (
    <div className="rounded-xl border bg-white">
      <ul className="divide-y">
        {orders.map(o => (
          <li key={o.id} className="p-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="font-medium">Bestelling #{o.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</p>
                <p className="text-sm">Status: <span className="font-medium">{o.status ?? "onbekend"}</span></p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">€ {((o.total ?? 0) / 100).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{o.items?.length ?? 0} items</p>
              </div>
            </div>
            {!!o.items?.length && (
              <div className="mt-3 grid md:grid-cols-2 gap-2 text-sm">
                {o.items.map(it => (
                  <div key={it.id} className="rounded-lg border p-2">
                    <p className="font-medium">{it.title ?? "Item"}</p>
                    <p className="text-xs text-muted-foreground">
                      {it.quantity ?? 1} × € {((it.price ?? 0) / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between p-3 border-t">
        <button className="px-3 py-1 rounded-lg border" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
          Vorige
        </button>
        <span className="text-sm">Pagina {page} / {totalPages}</span>
        <button className="px-3 py-1 rounded-lg border" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
          Volgende
        </button>
      </div>
    </div>
  );
}
