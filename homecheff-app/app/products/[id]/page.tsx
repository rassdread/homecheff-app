// @ts-ignore
import type { PageProps } from ".next/types/routes";

export default async function ProductDetailPage(props: PageProps<"/products/[id]">) {
  const params = await props.params;
  // Hier kun je een fetch doen naar het product met params.id
  // Bijvoorbeeld: const res = await fetch(`/api/products/${params.id}`)
  // Voor nu een placeholder:
  if (!params.id) return <div>Product niet gevonden.</div>;

  // Dummy product info
  const product = {
    title: "Voorbeeld product",
    description: "Dit is een voorbeeld van een productbeschrijving. Vul deze zo volledig mogelijk in voor een optimale presentatie.",
    category: "CHEFF",
    price: 9.95,
    unit: "PORTION",
    delivery: "PICKUP",
    images: [],
    seller: { name: "Voorbeeld Verkoper" },
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="w-full border-b" style={{ borderColor: "#e5e7eb", background: "#fff" }}>
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: "var(--primary)" }}>Product detail</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-4 text-sm text-gray-600 bg-yellow-50 border-l-4 p-3 rounded" style={{ borderColor: "var(--accent)" }}>
          Let op: Vul alle productinformatie zo volledig mogelijk in. Duidelijke foto’s, een goede beschrijving en juiste categorieën zorgen voor meer succes!
        </div>
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="font-semibold text-xl mb-2" style={{ color: "var(--primary)" }}>{product.title}</h2>
          <div className="mb-2 text-gray-500">Categorie: {product.category}</div>
          <div className="mb-2 text-gray-500">Verkoper: {product.seller.name}</div>
          <div className="mb-2 text-gray-500">Prijs: € {product.price} / {product.unit}</div>
          <div className="mb-2 text-gray-500">Levering: {product.delivery}</div>
          <p className="mt-4 text-gray-700">{product.description}</p>
          <div className="mt-6 flex gap-2">
            <button className="px-3 py-1 rounded text-black text-sm" style={{ background: "var(--accent)" }}>Opslaan als favoriet</button>
            <button className="px-3 py-1 rounded text-white text-sm" style={{ background: "var(--secondary)" }}>Delen</button>
            <button className="px-3 py-1 rounded text-white text-sm" style={{ background: "var(--success)" }}>WhatsApp</button>
          </div>
        </div>
      </section>
    </main>
  );
}
