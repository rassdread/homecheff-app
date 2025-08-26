export default async function Home() {
  const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/products`, { cache: "no-store" });
  const data = await res.json();
  const items = (data?.items ?? []) as any[];

  return (
    <main className="min-h-screen bg-[#F6F8FA]">
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold text-[#006D52]">The Cheff&apos;s Network</span>
          <a href="/sell/new" className="rounded-lg bg-[#0067B1] text-white px-3 py-2 text-sm">Plaats product</a>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-8 grid gap-4 sm:grid-cols-2">
        {items.length === 0 && (
          <div className="col-span-full rounded-xl bg-white p-6 border border-gray-200">
            Nog geen producten.
          </div>
        )}
        {items.map((p) => (
          <div key={p.id} className="rounded-xl bg-white p-5 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">{p.category}</div>
            <h3 className="font-semibold text-gray-900">{p.title}</h3>
            <p className="text-sm text-gray-700 line-clamp-2">{p.description}</p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span>€ {(p.priceCents/100).toFixed(2)} / {p.unit}</span>
              <span className="text-gray-500">{p.delivery}</span>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
