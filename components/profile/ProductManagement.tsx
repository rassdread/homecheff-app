'use client';

import { useState, useEffect } from 'react';
import { Edit3, Trash2, Package, Euro, AlertCircle, Clock, Users, Plus, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Product = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  stock: number;
  maxStock?: number | null;
  unit?: string | null;
  delivery?: string | null;
  category?: string | null;
  isActive: boolean;
  createdAt: string;
  Image: { id: string; fileUrl: string; sortOrder: number }[];
  // Recipe-specific fields
  prepTime?: number | null;
  servings?: number | null;
  difficulty?: string | null;
  ingredients?: string[];
  instructions?: string[];
  tags?: string[];
};

interface ProductManagementProps {
  onUpdate: () => void;
  categoryFilter?: 'CHEFF' | 'GROWN' | 'DESIGNER' | null;
}

export default function ProductManagement({ onUpdate, categoryFilter = null }: ProductManagementProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [categoryFilter]); // Re-load when category filter changes

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/seller/products');
      if (response.ok) {
        const data = await response.json();

        // Filter products by category if categoryFilter is provided
        let filteredProducts = data.products || [];

        if (categoryFilter) {
          const beforeCount = filteredProducts.length;
          filteredProducts = filteredProducts.filter((p: Product) => p.category === categoryFilter);

        }
        
        setProducts(filteredProducts);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      setMessage({type: 'error', text: 'Fout bij het laden van producten'});
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    console.log('🔧 handleEdit called for product:', product.id);
    // Navigate to full edit page
    router.push(`/product/${product.id}/edit`);
  };

  const handleEditStock = (product: Product) => {
    // Navigate to full edit page (same as handleEdit)
    router.push(`/product/${product.id}/edit`);
  };


  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({type: 'success', text: 'Product succesvol verwijderd!'});
        setShowDeleteModal(false);
        setProductToDelete(null);
        await loadProducts();
        onUpdate(); // Update parent stats
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({type: 'error', text: errorData.error || 'Fout bij het verwijderen van product'});
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      setMessage({type: 'error', text: 'Er is een fout opgetreden'});
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Producten beheren</h3>
          <p className="text-sm text-gray-500">Pas prijzen, voorraad en status aan</p>
        </div>
        <div className="flex items-center gap-4">
          {categoryFilter && (
            <a
              href={`/sell/new?category=${categoryFilter}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Product op Dorpsplein zetten</span>
              <span className="sm:hidden">+</span>
            </a>
          )}
          <div className="text-sm text-gray-500">
            {products.length} product{products.length !== 1 ? 'en' : ''}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Package className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen producten</h3>
          <p className="text-sm text-gray-500">Voeg je eerste product toe om te beginnen met verkopen!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => {
            const mainImage = product.Image?.find(img => img.sortOrder === 0) || product.Image?.[0];

            return (
              <div 
                key={product.id} 
                className="rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/product/${product.id}/edit`)}
              >
                {/* Product Image */}
                <div className="relative">
                  {mainImage?.fileUrl ? (
                    <img 
                      src={mainImage.fileUrl} 
                      alt={product.title} 
                      className="w-full h-48 object-cover" 
                      onError={(e) => {
                        console.error(`Image failed to load for product ${product.title}:`, mainImage.fileUrl);
                        e.currentTarget.src = "/placeholder.webp";
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {product.isActive ? "Actief" : "Inactief"}
                    </span>
                  </div>
                  {/* Stock Warning */}
                  {product.stock <= 5 && product.stock > 0 && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Laag voorraad
                      </span>
                    </div>
                  )}
                  {/* Out of Stock */}
                  {product.stock === 0 && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Uitverkocht
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 truncate">{product.title}</h4>
                    <p className="text-sm text-gray-600 capitalize">{product.category?.toLowerCase() || 'Onbekend'}</p>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  
                  {/* Price and Stock */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-emerald-600">
                        € {(product.priceCents / 100).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {product.unit?.toLowerCase() || 'stuk'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Voorraad:</span>
                      <span className={`font-medium ${
                        product.stock === 0 ? 'text-red-600' : 
                        product.stock <= 5 ? 'text-orange-600' : 
                        'text-green-600'
                      }`}>
                        {product.stock} {product.unit?.toLowerCase() || 'stuk'}
                        {product.maxStock && ` / ${product.maxStock}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Levering:</span>
                      <span className="text-gray-900 capitalize">
                        {product.delivery?.toLowerCase().replace('_', ' ') || 'Niet gespecificeerd'}
                      </span>
                    </div>
                    
                    {/* Recipe-specific info */}
                    {(() => {

                      return (product.prepTime || product.servings || product.difficulty);
                    })() && (
                      <div className="flex items-center gap-3 text-sm text-gray-500 pt-2 border-t">
                        {product.prepTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{product.prepTime} min</span>
                          </div>
                        )}
                        {product.servings && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{product.servings} pers.</span>
                          </div>
                        )}
                        {product.difficulty && (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            product.difficulty === 'EASY' ? 'text-green-600 bg-green-100' :
                            product.difficulty === 'MEDIUM' ? 'text-yellow-600 bg-yellow-100' :
                            'text-red-600 bg-red-100'
                          }`}>
                            {product.difficulty === 'EASY' ? 'Makkelijk' :
                             product.difficulty === 'MEDIUM' ? 'Gemiddeld' : 'Moeilijk'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(product);
                        }}
                        className="flex items-center space-x-1 text-sm px-3 py-1 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                        title="Bewerken (inclusief voorraad)"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span className="hidden sm:inline">Bewerken</span>
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/product/${product.id}`);
                        }}
                        className="flex items-center space-x-1 text-sm px-3 py-1 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                        title="Bekijk op Dorpsplein"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span className="hidden sm:inline">Dorpsplein</span>
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(product);
                        }}
                        className="flex items-center space-x-1 text-sm px-3 py-1 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Verwijderen</span>
                      </button>
                    </div>
                    
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      {new Date(product.createdAt).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Product verwijderen
                  </h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Weet je zeker dat je "{productToDelete.title}" wilt verwijderen? 
                  Deze actie kan niet ongedaan worden gemaakt.
                </p>
                
                <div className="flex items-center justify-end space-x-3">
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={saving}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      saving
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {saving ? 'Verwijderen...' : 'Verwijderen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

