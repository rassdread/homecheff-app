'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, X } from 'lucide-react';

type Product = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  stock: number;
  maxStock: number;
  isActive: boolean;
  category: string;
  delivery: string;
  unit: string;
  seller: {
    User: {
      id: string;
      name: string;
      username: string;
      profileImage: string | null;
    };
  };
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priceCents: 0,
    stock: 0,
    maxStock: 0,
    isActive: true,
    category: '',
    delivery: '',
    unit: ''
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${params.id}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', errorData);
          setError(errorData.error || 'Product niet gevonden');
          router.push('/verkoper');
          return;
        }
        const data = await response.json();
        console.log('Product data:', data);
        
        // Transform the data to match the expected structure
        const transformedProduct = {
          id: data.id,
          title: data.title,
          description: data.description,
          priceCents: data.priceCents,
          stock: data.stock,
          maxStock: data.maxStock,
          isActive: data.isActive,
          category: data.category,
          delivery: data.delivery,
          unit: data.unit,
          seller: {
            User: {
              id: data.User?.id,
              name: data.User?.name,
              username: data.User?.username,
              profileImage: data.User?.image || data.User?.profileImage
            }
          }
        };
        
        setProduct(transformedProduct);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          priceCents: data.priceCents || 0,
          stock: data.stock || 0,
          maxStock: data.maxStock || 0,
          isActive: data.isActive !== undefined ? data.isActive : true,
          category: data.category || '',
          delivery: data.delivery || '',
          unit: data.unit || ''
        });
      } catch (error) {
        console.error('Error fetching product:', error);
        router.push('/verkoper');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, router]);

  const handleSave = async () => {
    if (!product) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      const updatedProduct = await response.json();
      setProduct(updatedProduct);
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      // Redirect to verkoper dashboard after successful deletion
      router.push('/verkoper');
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete product');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-64 mb-6"></div>
            <div className="bg-white rounded-xl p-6">
              <div className="space-y-4">
                <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
                <div className="h-10 bg-neutral-200 rounded"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
                <div className="h-20 bg-neutral-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product niet gevonden</h1>
            <Button onClick={() => router.push('/verkoper')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar Verkoper Dashboard
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/verkoper')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Terug</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Bewerken</h1>
              <p className="text-gray-600">Bewerk de details van je product</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Product succesvol bijgewerkt!
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Productnaam *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Voer de productnaam in"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Beschrijving *
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Beschrijf je product..."
                />
              </div>

              {/* Price and Stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="priceCents" className="block text-sm font-medium text-gray-700 mb-2">
                    Prijs (in centen) *
                  </label>
                  <input
                    type="number"
                    id="priceCents"
                    value={formData.priceCents}
                    onChange={(e) => handleInputChange('priceCents', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                    Voorraad
                  </label>
                  <input
                    type="number"
                    id="stock"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label htmlFor="maxStock" className="block text-sm font-medium text-gray-700 mb-2">
                    Max Voorraad
                  </label>
                  <input
                    type="number"
                    id="maxStock"
                    value={formData.maxStock}
                    onChange={(e) => handleInputChange('maxStock', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Category and Delivery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Categorie
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Selecteer categorie</option>
                    <option value="CHEF">Chef</option>
                    <option value="GARDEN">Garden</option>
                    <option value="DESIGNER">Designer</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="delivery" className="block text-sm font-medium text-gray-700 mb-2">
                    Levering
                  </label>
                  <select
                    id="delivery"
                    value={formData.delivery}
                    onChange={(e) => handleInputChange('delivery', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Selecteer levering</option>
                    <option value="PICKUP">Afhalen</option>
                    <option value="DELIVERY">Bezorgen</option>
                    <option value="BOTH">Beide</option>
                  </select>
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Product is actief (zichtbaar in feed)
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving || isDeleting}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Verwijderen
              </Button>
              
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/verkoper')}
                  disabled={isSaving || isDeleting}
                >
                  Annuleren
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || isDeleting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Opslaan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Opslaan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Product Verwijderen
                  </h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  Weet je zeker dat je dit product wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                </p>
                <p className="text-sm font-medium text-gray-900 mt-2">
                  "{product.title}"
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Annuleren
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verwijderen...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Verwijderen
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}