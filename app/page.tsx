/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import type { ProductCategory, DeliveryMode, Unit } from "@prisma/client";

type FeedImage = { fileUrl: string; sortOrder: number };
type FeedItem = {
  id: string;
  title: string;
  description: string;
  category: ProductCategory;
  priceCents: number;
  unit: Unit;
  delivery: DeliveryMode;
  createdAt: string | Date;
  images?: FeedImage[];
};

export default async function Home() {
  const base = process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/listings`, { cache: "no-store" });
  const items = await res.json();

  return (
    <main className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((x: any) => (
        <article key={x.id} className="rounded-xl border p-3">
          {x.media?.[0]?.url && (
            <img src={x.media[0].url} alt={x.title} className="w-full h-48 object-cover rounded-lg" />
          )}
          <h3 className="font-semibold mt-2">{x.title}</h3>
          <p className="text-sm opacity-80">€ {(x.priceCents / 100).toFixed(2)}</p>
          {x.place && <p className="text-xs opacity-60">{x.place}</p>}
          <form action="/api/reservations" method="POST" className="mt-2">
            <input type="hidden" name="listingId" value={x.id} />
          </form>
        </article>
      ))}
    </main>
  );
}
