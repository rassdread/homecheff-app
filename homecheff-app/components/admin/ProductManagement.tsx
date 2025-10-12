'use client';

import { useState, useEffect } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { Package, Search, Trash2, Eye, User, Calendar, Euro } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  category: string;
  isActive: boolean;
  createdAt: Date;
  seller: {
    User: {
      id: string;
      name: string | null;
      email: string;
      username: string | null;
      profileImage: string | null;
    };
  };
  Image: {
    fileUrl: string;
    sortOrder: number;
  }[];
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        console.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Weet je zeker dat je dit product wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.')) return;

    try {
      setDeleting(productId);
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setProducts(products.filter(product => product.id !== productId));
        setSelectedProducts(selectedProducts.filter(id => id !== productId));
        
        // Also refresh the full list to ensure consistency
        await fetchProducts();
        
        alert('Product succesvol verwijderd');
      } else {
        const errorData = await response.json();
        alert(`Fout bij verwijderen: ${errorData.error || 'Onbekende fout'}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Er is een fout opgetreden bij het verwijderen van het product');
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    if (!confirm(`Weet je zeker dat je ${selectedProducts.length} producten wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`)) return;

    try {
      const deletePromises = selectedProducts.map(async id => {
        const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to delete product ${id}: ${errorData.error || 'Unknown error'}`);
        }
        return response;
      });
      
      await Promise.all(deletePromises);
      
      // Remove from local state
      setProducts(products.filter(product => !selectedProducts.includes(product.id)));
      setSelectedProducts([]);
      
      // Also refresh the full list to ensure consistency
      await fetchProducts();
      
      alert(`${selectedProducts.length} producten succesvol verwijderd`);
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      alert(`Er is een fout opgetreden bij het verwijderen van de producten: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.seller.User.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.seller.User.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (priceCents: number) => {
    return `€${(priceCents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Productbeheer</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Productbeheer</h2>
        <div className="text-sm text-gray-500">
          {filteredProducts.length} van {products.length} producten
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Zoek producten, verkopers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {selectedProducts.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Verwijder geselecteerd ({selectedProducts.length})
          </button>
        )}
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Geen producten gevonden</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Probeer een andere zoekterm' : 'Er zijn nog geen producten aangemaakt'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(filteredProducts.map(p => p.id));
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verkoper
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prijs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aangemaakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts([...selectedProducts, product.id]);
                          } else {
                            setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {product.Image.length > 0 ? (
                          <img
                            src={product.Image[0].fileUrl}
                            alt={product.title}
                            className="h-12 w-12 rounded-lg object-cover mr-4"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 rounded-lg mr-4 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                          <div className="text-xs text-gray-400">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.seller.User.profileImage ? (
                          <img
                            src={product.seller.User.profileImage}
                            alt={getDisplayName(product.seller.User)}
                            className="h-8 w-8 rounded-full mr-3"
                          />
                        ) : (
                          <div className="h-8 w-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getDisplayName(product.seller.User)}
                          </div>
                          <div className="text-sm text-gray-500">{product.seller.User.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Euro className="h-4 w-4 mr-1" />
                        {formatPrice(product.priceCents)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(product.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(`/product/${product.id}`, '_blank')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Bekijk product"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={deleting === product.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Verwijder product"
                        >
                          {deleting === product.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



