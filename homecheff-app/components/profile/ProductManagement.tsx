'use client';

import { useState, useEffect } from 'react';
import { Edit3, Trash2, Package, Euro, AlertCircle } from 'lucide-react';

type Product = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  stock: number;
  maxStock?: number | null;
  unit: string;
  delivery: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  Image: { id: string; fileUrl: string; sortOrder: number }[];
};

interface ProductManagementProps {
  onUpdate: () => void;
}

export default function ProductManagement({ onUpdate }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Edit form state
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editMaxStock, setEditMaxStock] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/seller/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      setMessage({type: 'error', text: 'Fout bij het laden van producten'});
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditPrice((product.priceCents / 100).toFixed(2));
    setEditStock(product.stock.toString());
    setEditMaxStock(product.maxStock?.toString() || '');
    setEditIsActive(product.isActive);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceCents: Math.round(parseFloat(editPrice) * 100),
          stock: parseInt(editStock),
          maxStock: editMaxStock ? parseInt(editMaxStock) : null,
          isActive: editIsActive
        })
      });

      if (response.ok) {
        setMessage({type: 'success', text: 'Product succesvol bijgewerkt!'});
        setShowEditModal(false);
        setEditingProduct(null);
        await loadProducts();
        onUpdate(); // Update parent stats
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({type: 'error', text: errorData.error || 'Fout bij het bijwerken van product'});
      }
    } catch (error) {
      console.error('Failed to update product:', error);
      setMessage({type: 'error', text: 'Er is een fout opgetreden'});
    } finally {
      setSaving(false);
    }
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
        <div className="text-sm text-gray-500">
          {products.length} product{products.length !== 1 ? 'en' : ''}
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
              <div key={product.id} className="rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Product Image */}
                <div className="relative">
                  <img 
                    src={mainImage?.fileUrl ?? "/placeholder.webp"} 
                    alt={product.title} 
                    className="w-full h-48 object-cover" 
                  />
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
                    <p className="text-sm text-gray-600 capitalize">{product.category.toLowerCase()}</p>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  
                  {/* Price and Stock */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-emerald-600">
                        € {(product.priceCents / 100).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {product.unit.toLowerCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Voorraad:</span>
                      <span className={`font-medium ${
                        product.stock === 0 ? 'text-red-600' : 
                        product.stock <= 5 ? 'text-orange-600' : 
                        'text-green-600'
                      }`}>
                        {product.stock} {product.unit.toLowerCase()}
                        {product.maxStock && ` / ${product.maxStock}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Levering:</span>
                      <span className="text-gray-900 capitalize">
                        {product.delivery.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="flex items-center space-x-1 text-sm px-3 py-1 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Bewerken</span>
                      </button>
                      
                      <button 
                        onClick={() => confirmDelete(product)}
                        className="flex items-center space-x-1 text-sm px-3 py-1 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Verwijderen</span>
                      </button>
                    </div>
                    
                    <span className="text-xs text-gray-400">
                      {new Date(product.createdAt).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Product bewerken: {editingProduct.title}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prijs (€) *</label>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Huidige voorraad *</label>
                    <input 
                      type="number"
                      min="0"
                      value={editStock}
                      onChange={e => setEditStock(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximale voorraad (optioneel)</label>
                    <input 
                      type="number"
                      min="0"
                      value={editMaxStock}
                      onChange={e => setEditMaxStock(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Leeg laten voor onbeperkt"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      id="isActive" 
                      checked={editIsActive} 
                      onChange={e => setEditIsActive(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Product actief (zichtbaar voor kopers)
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving || !editPrice || !editStock}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      saving || !editPrice || !editStock
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {saving ? 'Opslaan...' : 'Opslaan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
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









