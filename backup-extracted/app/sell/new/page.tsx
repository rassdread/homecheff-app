"use client";
import NewProductForm from "@/components/products/NewProductForm";

export default function HomeCheffProductNieuwPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nieuw HomeCheff Product</h1>
          <p className="mt-2 text-gray-600">Voeg een nieuw HomeCheff product toe aan je aanbod</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <NewProductForm />
        </div>
      </div>
    </main>
  );
}
