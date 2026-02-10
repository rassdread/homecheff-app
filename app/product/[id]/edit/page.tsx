'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import CategoryFormSelector from '@/components/products/CategoryFormSelector';

export default function EditProductPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${params?.id}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', errorData);
          setError(errorData.error || 'Product niet gevonden');
          router.push('/verkoper');
          return;
        }
        const data = await response.json();
        
        // Transform to match Compact forms expected structure
        const category = data.product.category === 'GROWN' ? 'GARDEN' : data.product.category;
        const transformedProduct = {
          id: data.product.id,
          title: data.product.title,
          description: data.product.description,
          priceCents: data.product.priceCents,
          stock: data.product.stock,
          maxStock: data.product.maxStock,
          isActive: data.product.isActive,
          category: category,
          deliveryMode: data.product.delivery,
          subcategory: data.product.subcategory,
          unit: data.product.unit,
          displayNameType: data.product.displayNameType || 'full',
          isFutureProduct: data.product.isFutureProduct || false,
          availabilityDate: data.product.availabilityDate,
          Image: data.product.Image || [],
          pickupAddress: data.product.pickupAddress,
          pickupLat: data.product.pickupLat,
          pickupLng: data.product.pickupLng,
          sellerCanDeliver: data.product.sellerCanDeliver || false,
          deliveryRadiusKm: data.product.deliveryRadiusKm,
          Video: data.product.Video || null,
          tags: data.product.tags || [],
        };
        
        setProduct(transformedProduct);
      } catch (error) {
        console.error('Error fetching product:', error);
        router.push('/verkoper');
      } finally {
        setIsLoading(false);
      }
    };

    if (params?.id) {
      fetchProduct();
    }
  }, [params?.id, router]);

  const handleSave = () => {
    // Redirect to product page after save
    router.push(`/product/${params?.id}`);
  };
  
  const handleCancel = () => {
    router.push('/verkoper');
  };

  const handleDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${params?.id}`, {
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

  if (!product && !isLoading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('product.notFound')}</h1>
            <Button onClick={() => router.push('/verkoper')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('product.backToSellerDashboard')}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main 
      className="min-h-[100dvh] bg-neutral-50" 
      data-edit-product-form
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('common.back')}</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('product.editProduct') || 'Product Bewerken'}</h1>
              <p className="text-gray-600">{t('product.editProductDescription') || 'Bewerk de details van je product'}</p>
            </div>
          </div>
        </div>

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

        {/* Use CategoryFormSelector with correct category */}
        {product && (
          <CategoryFormSelector
            category={product.category as 'CHEFF' | 'GARDEN' | 'DESIGNER'}
            editMode={true}
            existingProduct={product}
            onSave={handleSave}
            onCancel={handleCancel}
            platform="dorpsplein"
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && product && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('product.deleteTitle') || 'Product Verwijderen'}
                  </h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  {t('product.deleteConfirm') || 'Weet je zeker dat je dit product wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.'}
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
                  {t('product.cancel')}
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('product.deleting') || 'Verwijderen...'}
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      {t('product.delete')}
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