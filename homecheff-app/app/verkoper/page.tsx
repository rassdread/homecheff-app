
'use client';

import { useEffect, useState } from 'react';
import { ShareButton } from '@/components/ui/ShareButton';
import Link from 'next/link';

type Product = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  image: string | null;
  createdAt: string;
  category: string;
  stock: number;
  isActive: boolean;
};

export default function VerkoperPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
    
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/seller/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-6">
                  <div className="h-48 bg-neutral-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Mijn Producten</h1>
            <p className="text-neutral-600 mt-2">Beheer en deel je creaties</p>
          </div>
          <Link
            href="/verkoper/product-nieuw"
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium"
          >
            + Nieuw Product
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🍽️</span>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Nog geen producten</h3>
            <p className="text-neutral-600 mb-6">Begin met het toevoegen van je eerste creatie!</p>
            <Link
              href="/verkoper/product-nieuw"
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium"
            >
              Eerste Product Toevoegen
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                <div className="relative">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                      <span className="text-neutral-400 text-4xl">🍽️</span>
                    </div>
                  )}
                  
                  <div className="absolute top-3 right-3">
                    <ShareButton
                      url={`${baseUrl}/product/${product.id}`}
                      title={product.title}
                      description={product.description || ''}
                      type="seller"
                      productId={product.id}
                      productTitle={product.title}
                      className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    />
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-neutral-900">{product.title}</h3>
                    <Link
                      href={`/product/${product.id}/edit`}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      Bewerken
                    </Link>
                  </div>
                  <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
                    {product.description || 'Geen beschrijving'}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-emerald-600">
                        €{(product.priceCents / 100).toFixed(2)}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {new Date(product.createdAt).toLocaleDateString('nl-NL')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600">
                        Voorraad: {product.stock || 0}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
