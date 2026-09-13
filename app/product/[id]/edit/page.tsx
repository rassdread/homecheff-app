'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import CategoryFormSelector from '@/components/products/CategoryFormSelector';
import { getProfileHrefAfterProductEdit } from '@/lib/profileProductTab';
import {
  buildProductEditPath,
  buildProductSlugPath,
  isBareProductUuidParam,
  resolveProductIdFromParam,
} from '@/lib/seo/productSlug';

/**
 * Map API product → editor shape.
 * Preserve scalar listing fields (allergens, parcel, settlement, provenance)
 * so edit hydrate does not fall back to create-defaults.
 */
function transformProductForEditor(raw: Record<string, any>) {
  const category = raw.category === 'GROWN' ? 'GARDEN' : raw.category;
  return {
    ...raw,
    id: raw.id,
    sellerPlace: raw.seller?.User?.place ?? null,
    title: raw.title,
    description: raw.description,
    priceCents: raw.priceCents,
    stock: raw.stock,
    maxStock: raw.maxStock,
    isActive: raw.isActive,
    category,
    deliveryMode: raw.delivery,
    subcategory: raw.subcategory,
    marketplaceCategory: raw.marketplaceCategory ?? null,
    specializations: raw.specializations ?? [],
    acceptedSpecializations: raw.acceptedSpecializations ?? [],
    listingIntent: raw.listingIntent ?? 'OFFER',
    priceModel: raw.priceModel ?? 'FIXED',
    barterOpenness: raw.barterOpenness ?? null,
    fulfillmentOptions: raw.fulfillmentOptions ?? null,
    unit: raw.unit,
    displayNameType: raw.displayNameType || 'full',
    isFutureProduct: raw.isFutureProduct || false,
    availabilityDate: raw.availabilityDate,
    Image: raw.Image || [],
    pickupAddress: raw.pickupAddress,
    pickupLat: raw.pickupLat,
    pickupLng: raw.pickupLng,
    sellerCanDeliver: raw.sellerCanDeliver || false,
    deliveryRadiusKm: raw.deliveryRadiusKm,
    Video: raw.Video || null,
    tags: raw.tags || [],
    acceptHomeCheffPayment: raw.acceptHomeCheffPayment ?? null,
    acceptDirectContact: raw.acceptDirectContact ?? null,
    orderMethod: raw.orderMethod ?? null,
    allergens: raw.allergens ?? [],
    allergensConfirmedAt: raw.allergensConfirmedAt ?? null,
    integrityStatus: raw.integrityStatus ?? null,
    sellerContributionTypes: raw.sellerContributionTypes ?? [],
    sellerContributionNote: raw.sellerContributionNote ?? null,
    madeToConsumerSpecifications: raw.madeToConsumerSpecifications ?? false,
    rapidlyPerishable: raw.rapidlyPerishable ?? false,
    weightGrams: raw.weightGrams ?? null,
    lengthCm: raw.lengthCm ?? null,
    widthCm: raw.widthCm ?? null,
    heightCm: raw.heightCm ?? null,
    parcelPreset: raw.parcelPreset ?? null,
    domesticShippingEnabled: raw.domesticShippingEnabled,
  };
}

export default function EditProductPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const canonicalizedRef = useRef<string | null>(null);

  const routeParam = typeof params?.id === 'string' ? params.id : '';
  const productId = resolveProductIdFromParam(routeParam);

  useEffect(() => {
    if (!productId) return;

    let cancelled = false;

    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', errorData);
          if (cancelled) return;
          setError(
            errorData.error || t('profileV2.forms.productNotFound'),
          );
          router.push('/verkoper');
          return;
        }
        const data = await response.json();
        if (cancelled) return;

        const transformedProduct = transformProductForEditor(data.product);

        // Canonicalize bare UUID → slug/edit exactly once per product.
        // Never depend on unstable `t` / re-fetch on every render.
        if (
          isBareProductUuidParam(routeParam) &&
          transformedProduct.isActive &&
          canonicalizedRef.current !== transformedProduct.id
        ) {
          const canonicalEdit = buildProductEditPath(
            transformedProduct.title,
            transformedProduct.sellerPlace,
            transformedProduct.id,
          );
          const currentPath =
            typeof window !== 'undefined'
              ? window.location.pathname.replace(/\/+$/, '')
              : '';
          if (currentPath !== canonicalEdit) {
            canonicalizedRef.current = transformedProduct.id;
            router.replace(canonicalEdit);
          }
        }

        setProduct(transformedProduct);
      } catch (err) {
        console.error('Error fetching product:', err);
        if (!cancelled) {
          router.push('/verkoper');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchProduct();
    return () => {
      cancelled = true;
    };
    // productId is the only fetch key. Do NOT list `t` — useTranslation recreates
    // `t` every render and would re-trigger fetch → loading → setProduct forever.
    // routeParam is read for one-shot UUID canonicalize; productId already changes
    // only when the underlying listing id changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable fetch
  }, [productId]);

  const handleSave = () => {
    if (!product) return;
    router.push(
      `/product/${buildProductSlugPath(
        product.title,
        product.sellerPlace,
        product.id
      )}`
    );
  };
  
  const handleCancel = () => {
    router.push(getProfileHrefAfterProductEdit(product?.category));
  };

  const handleDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      // Terug naar Profile V2 Aanbod-tab na verwijderen
      router.push(getProfileHrefAfterProductEdit(product?.category));
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete product');
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
              <h1 className="text-3xl font-bold text-gray-900">{t('product.editProduct')}</h1>
              <p className="text-gray-600">{t('product.editProductDescription')}</p>
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
            useMarketplaceV2={true}
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
                    {t('product.deleteTitle')}
                  </h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  {t('product.deleteConfirm')}
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
                      {t('product.deleting')}
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
