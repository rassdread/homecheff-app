'use client';
import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Package, Truck } from 'lucide-react';
import SimpleImageUploader from './SimpleImageUploader';
import EmojiPickerButton from '@/components/chat/EmojiPicker';
import { useTranslation } from '@/hooks/useTranslation';
import DynamicAddressFields, { AddressData } from '@/components/ui/DynamicAddressFields';
import { getAddressFormat } from '@/lib/global-geocoding';
import VideoUploader from '@/components/ui/VideoUploader';
import { getProfileHrefAfterProductSave } from '@/lib/profileProductTab';
import { deliveryModeFromOptions } from '@/lib/productDeliveryMode';
import ProductOrderMethodSelector from '@/components/products/ProductOrderMethodSelector';
import type { ProductOrderMethodValue } from '@/lib/product/order-method';
import ProductEditInspirationLink from '@/components/products/ProductEditInspirationLink';
import type { InspirationCategory } from '@/lib/inspiratie/instruction-content';
import { productHasUsableLocation } from '@/lib/geo/product-location-requirements';
import { useHcpRewardUi } from '@/components/gamification/HcpRewardProvider';
import { tryShowAccountRequirementsFromApiBody } from '@/lib/client/consume-account-requirements-response';

type Uploaded = { 
  url: string; 
  uploading?: boolean;
  error?: string;
};

const GARDEN_SUBCATEGORIES = [
  "Groenten", "Fruit", "Kruiden", "Bloemen", "Bomen", "Cactussen",
  "Vetplanten", "Kamerplanten", "Tuinplanten", "Moestuin", "Biologisch",
  "Zaadjes", "Stekjes", "Seizoensgroente", "Exotisch", "Compost"
];

interface CompactGardenFormProps {
  editMode?: boolean;
  existingProduct?: any;
  onSave?: (product: any) => void;
  onCancel?: () => void;
  initialPhoto?: string;
  platform?: 'dorpsplein' | 'inspiratie';
}

export default function CompactGardenForm({ 
  editMode = false,
  existingProduct = null,
  onSave,
  onCancel,
  initialPhoto,
  platform = 'dorpsplein'
}: CompactGardenFormProps) {
  const { t, tOr, getTranslationObject } = useTranslation();

  /**
   * Suggesties komen volledig uit i18n (zie compactForms.shared.tagSuggestionsGarden in
   * public/i18n/{nl,en}.json). Wisselt automatisch met de gekozen taal.
   */
  const tagSuggestionsRaw = getTranslationObject('compactForms.shared.tagSuggestionsGarden');
  const TAG_SUGGESTIONS = Array.isArray(tagSuggestionsRaw)
    ? (tagSuggestionsRaw as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];
  const { data: session } = useSession();
  const hcpRewardUi = useHcpRewardUi();
  const searchParams = useSearchParams();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [orderMethod, setOrderMethod] = React.useState<ProductOrderMethodValue>('HOMECHEFF_PAYMENT');
  const [subcategory, setSubcategory] = React.useState('');
  const [deliveryOptions, setDeliveryOptions] = React.useState<string[]>(['PICKUP']);
  
  // Helper to check if option is selected
  const hasDeliveryOption = (option: string): boolean => {
    return deliveryOptions.includes(option);
  };
  const [images, setImages] = React.useState<Uploaded[]>([]);
  const [video, setVideo] = React.useState<{ url: string; thumbnail?: string | null; duration?: number | null } | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  
  // Edit mode specific states
  const [stock, setStock] = React.useState('');
  const [maxStock, setMaxStock] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);
  
  // Pickup location state
  const [useMyAddress, setUseMyAddress] = React.useState(true);
  const [pickupAddress, setPickupAddress] = React.useState('');
  const [pickupPostalCode, setPickupPostalCode] = React.useState('');
  const [pickupHouseNumber, setPickupHouseNumber] = React.useState('');
  const [pickupCity, setPickupCity] = React.useState('');
  const [pickupCountry, setPickupCountry] = React.useState<string>('NL');
  const [pickupLat, setPickupLat] = React.useState<number | null>(null);
  const [pickupLng, setPickupLng] = React.useState<number | null>(null);
  const [pickupGeocodingError, setPickupGeocodingError] = React.useState<string | null>(null);
  
  // Seller delivery state
  const [sellerCanDeliver, setSellerCanDeliver] = React.useState(false);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = React.useState<string>('');
  
  // Tags
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState('');

  // Load user address when useMyAddress is true
  React.useEffect(() => {
    if (!useMyAddress || !session?.user) return;
    
    const loadUserAddress = async () => {
      try {
        const response = await fetch('/api/profile/me');
        if (response.ok) {
          const data = await response.json();
          const user = data?.user;
          if (user) {
            if (user.country) setPickupCountry(user.country);
            const addressParts: string[] = [];
            if (user.address) addressParts.push(user.address);
            if (user.postalCode) addressParts.push(user.postalCode);
            if (user.city || user.place) addressParts.push(user.city || user.place);
            if (addressParts.length > 0) {
              setPickupAddress(addressParts.join(', '));
              if (user.address) {
                const addressMatch = user.address.match(/^(.+?)\s+(\d+[a-zA-Z0-9\-]*)$/);
                if (addressMatch) {
                  setPickupAddress(addressMatch[1]);
                  setPickupHouseNumber(addressMatch[2]);
                } else {
                  setPickupAddress(user.address);
                }
              }
              if (user.postalCode) setPickupPostalCode(user.postalCode);
              if (user.city || user.place) setPickupCity(user.city || user.place);
              if (user.lat && user.lng) {
                setPickupLat(user.lat);
                setPickupLng(user.lng);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading user address:', error);
      }
    };
    
    loadUserAddress();
  }, [useMyAddress, session]);

  // Initialize form with existing product data
  React.useEffect(() => {
    if (editMode && existingProduct) {
      setTitle(existingProduct.title || '');
      setDescription(existingProduct.description || '');
      setPrice(existingProduct.priceCents ? (existingProduct.priceCents / 100).toString() : '');
      setOrderMethod(
        existingProduct.orderMethod === 'CONTACT' ? 'CONTACT' : 'HOMECHEFF_PAYMENT',
      );
      setSubcategory(existingProduct.subcategory || '');
      // Convert deliveryMode to array of options
      const existingMode = existingProduct.deliveryMode || 'PICKUP';
      if (existingMode === 'BOTH') {
        setDeliveryOptions(['PICKUP', 'DELIVERY']);
      } else if (existingMode.includes(',')) {
        setDeliveryOptions(existingMode.split(',').map(s => s.trim()));
      } else {
        setDeliveryOptions([existingMode]);
      }
      setStock(existingProduct.stock?.toString() || '');
      setMaxStock(existingProduct.maxStock?.toString() || '');
      setIsActive(existingProduct.isActive ?? true);
      
      // Load pickup address if exists
      if (existingProduct.pickupAddress) {
        setUseMyAddress(false);
        setPickupAddress(existingProduct.pickupAddress);
        if (existingProduct.pickupLat) setPickupLat(existingProduct.pickupLat);
        if (existingProduct.pickupLng) setPickupLng(existingProduct.pickupLng);
      }
      
      // Load seller delivery fields
      if (existingProduct.sellerCanDeliver !== undefined) {
        setSellerCanDeliver(existingProduct.sellerCanDeliver);
      }
      if (existingProduct.deliveryRadiusKm !== undefined && existingProduct.deliveryRadiusKm !== null) {
        setDeliveryRadiusKm(existingProduct.deliveryRadiusKm.toString());
      }
      
      if (existingProduct.Image && existingProduct.Image.length > 0) {
        setImages(existingProduct.Image.map((img: any) => ({ url: img.fileUrl })));
      }
      
      // Load video if exists
      if (existingProduct.Video) {
        setVideo({
          url: existingProduct.Video.url,
          thumbnail: existingProduct.Video.thumbnail || null,
          duration: existingProduct.Video.duration || null
        });
      }
      
      // Load tags if they exist
      if (existingProduct.tags && Array.isArray(existingProduct.tags)) {
        setTags(existingProduct.tags);
      }

      void (async () => {
        try {
          const res = await fetch(`/api/products/${existingProduct.id}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.isDish && data.dishCategory) {
            setLinkedInspirationCategory(data.dishCategory as InspirationCategory);
          }
        } catch {
          /* optional linked dish */
        }
      })();
    }
  }, [editMode, existingProduct]);

  // Initialize with initial photo/video from camera or sessionStorage
  React.useEffect(() => {
    if (editMode) return;
    
    // Check for photo/video from sessionStorage first (from bottom menu)
    const productPhoto = sessionStorage.getItem('productPhoto') || 
                        sessionStorage.getItem('quickAddPhoto') ||
                        localStorage.getItem('pendingProductPhoto') ||
                        initialPhoto;
    
    const isVideo = productPhoto?.startsWith('data:video/') || false;
    
    if (productPhoto) {
      if (isVideo) {
        // Set as video
        setVideo({
          url: productPhoto,
          thumbnail: null,
          duration: null
        });
        // Clean up sessionStorage
        setTimeout(() => {
          sessionStorage.removeItem('productPhoto');
          sessionStorage.removeItem('quickAddPhoto');
          sessionStorage.removeItem('productIsVideo');
          localStorage.removeItem('pendingProductPhoto');
        }, 2000);
      } else {
        // Set as photo
        setImages([{ url: productPhoto }]);
        // Clean up sessionStorage
        setTimeout(() => {
          sessionStorage.removeItem('productPhoto');
          sessionStorage.removeItem('quickAddPhoto');
          localStorage.removeItem('pendingProductPhoto');
        }, 2000);
      }
    }
  }, [initialPhoto, editMode]);

  // Track if garden data has been loaded
  const [gardenDataLoaded, setGardenDataLoaded] = React.useState(false);
  const [linkedInspirationCategory, setLinkedInspirationCategory] =
    React.useState<InspirationCategory | null>(null);
  const [gardenMeta, setGardenMeta] = React.useState<{
    plantType?: string;
    sunlight?: string;
    waterNeeds?: string;
    harvestDate?: string;
    location?: string;
    growthDuration?: number | null;
    plantDate?: string;
    soilType?: string;
    plantDistance?: string;
    notes?: string;
    difficulty?: string;
  } | null>(null);

  // Load garden data from sessionStorage when fromGarden=true
  React.useEffect(() => {
    if (editMode || gardenDataLoaded || typeof window === 'undefined') return;
    
    const fromGarden = searchParams?.get('fromGarden') === 'true';
    if (!fromGarden) return;
    
    try {
      const gardenDataStr = sessionStorage.getItem('gardenToProductData') || localStorage.getItem('gardenToProductData');
      if (!gardenDataStr) return;
      
      const gardenData = JSON.parse(gardenDataStr);
      
      // Pre-fill form fields with garden data
      if (gardenData.title) setTitle(gardenData.title);
      if (gardenData.description) setDescription(gardenData.description);
      if (gardenData.plantType) setSubcategory(gardenData.plantType);
      if (gardenData.tags && Array.isArray(gardenData.tags)) setTags(gardenData.tags);
      setGardenMeta({
        plantType: gardenData.plantType,
        sunlight: gardenData.sunlight,
        waterNeeds: gardenData.waterNeeds,
        harvestDate: gardenData.harvestDate,
        location: gardenData.location,
        growthDuration: gardenData.growthDuration ?? null,
        plantDate: gardenData.plantDate,
        soilType: gardenData.soilType,
        plantDistance: gardenData.plantDistance,
        notes: gardenData.notes,
        difficulty: gardenData.difficulty,
      });
      
      // Load photos (only main photos, max 5)
      if (gardenData.photos && Array.isArray(gardenData.photos)) {
        const mainPhotos = gardenData.photos.slice(0, 5).map((photo: any) => ({
          url: photo.url || photo,
          uploading: false
        }));
        if (mainPhotos.length > 0) {
          setImages(mainPhotos);
        }
      }
      
      // Store growth photos with descriptions for later use when creating the product
      // These will be linked to the product via the Dish model
      if (gardenData.growthPhotos && Array.isArray(gardenData.growthPhotos) && gardenData.growthPhotos.length > 0) {
        sessionStorage.setItem('gardenGrowthPhotos', JSON.stringify(gardenData.growthPhotos));
        localStorage.setItem('gardenGrowthPhotos', JSON.stringify(gardenData.growthPhotos));
      }
      
      setGardenDataLoaded(true);
      
      // Clean up sessionStorage after loading
      setTimeout(() => {
        sessionStorage.removeItem('gardenToProductData');
        localStorage.removeItem('gardenToProductData');
      }, 1000);
    } catch (error) {
      console.error('Error loading garden data:', error);
    }
  }, [editMode, gardenDataLoaded, searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const priceNumber = price.trim()
      ? Number(price.replace(',', '.'))
      : NaN;
    const isContactOrder = orderMethod === 'CONTACT';

    if (!title || !description) {
      setMessage(t('compactForms.shared.fillTitleDescriptionPrice'));
      return;
    }

    let priceCents = 0;
    if (isContactOrder) {
      if (price.trim()) {
        if (!Number.isFinite(priceNumber) || priceNumber < 0) {
          setMessage(t('productOrder.errors.invalidOptionalPrice'));
          return;
        }
        priceCents = Math.round(priceNumber * 100);
      }
    } else if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      setMessage(t('compactForms.shared.fillTitleDescriptionPrice'));
      return;
    } else {
      priceCents = Math.round(priceNumber * 100);
    }
    if (images.length === 0) {
      setMessage(t('productForm.addAtLeastOnePhoto'));
      return;
    }
    if (images.some((i) => i.uploading)) {
      setMessage(t('productForm.photosStillUploading'));
      return;
    }
    const imageUrlsReady = images
      .filter((i) => i.url?.trim() && !i.uploading)
      .map((i) => i.url.trim());
    if (imageUrlsReady.length === 0) {
      setMessage(t('productForm.photosNeedValidUrl'));
      return;
    }

    // Prepare pickup address - use user address if useMyAddress is true, otherwise use entered address
    let finalPickupAddress: string | null = null;
    let finalPickupLat: number | null = null;
    let finalPickupLng: number | null = null;
    
    // Pickup address is needed when deliveryMode is PICKUP or BOTH (for dorpsplein products)
    // SHIPPING doesn't need pickup address - it uses seller address automatically
    if (hasDeliveryOption('PICKUP')) {
      if (useMyAddress) {
        // User address is already loaded in state via useEffect
        if (pickupAddress && pickupLat && pickupLng) {
          finalPickupAddress = pickupAddress;
          finalPickupLat = pickupLat;
          finalPickupLng = pickupLng;
        }
      } else {
        // Use entered address
        const addressFormat = getAddressFormat(pickupCountry);
        if (addressFormat === 'postcode_house') {
          // Netherlands format: combine postcode, house number, and city
          if (pickupPostalCode && pickupHouseNumber && pickupCity) {
            finalPickupAddress = `${pickupAddress || ''} ${pickupHouseNumber}, ${pickupPostalCode} ${pickupCity}`.trim();
            if (pickupLat && pickupLng) {
              finalPickupLat = pickupLat;
              finalPickupLng = pickupLng;
            }
          }
        } else {
          // Other countries: combine street, house number (if available), city, and postal code (if available)
          const addressParts: string[] = [];
          if (pickupAddress) addressParts.push(pickupAddress);
          if (pickupHouseNumber) addressParts.push(pickupHouseNumber);
          if (pickupPostalCode) addressParts.push(pickupPostalCode);
          if (pickupCity) addressParts.push(pickupCity);
          if (addressParts.length > 0) {
            finalPickupAddress = addressParts.join(', ');
            if (pickupLat && pickupLng) {
              finalPickupLat = pickupLat;
              finalPickupLng = pickupLng;
            }
          }
        }
      }
    }

    const isSaleListing =
      isActive && (priceCents > 0 || orderMethod === 'CONTACT');
    if (
      isSaleListing &&
      !productHasUsableLocation({
        pickupAddress: finalPickupAddress,
        pickupLat: finalPickupLat,
        pickupLng: finalPickupLng,
      })
    ) {
      setMessage(t('productForm.locationRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const imageUrls = imageUrlsReady;

      let res, data;
      
      if (editMode && existingProduct) {
        // Update existing product
        res = await fetch(`/api/products/${existingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            priceCents,
            orderMethod,
            category: 'GARDEN',
            subcategory: subcategory || null,
            deliveryMode: deliveryModeFromOptions(deliveryOptions),
            images: imageUrls,
            stock: stock ? parseInt(stock) : undefined,
            maxStock: maxStock ? parseInt(maxStock) : undefined,
            isActive,
            platform,
            pickupAddress: finalPickupAddress,
            pickupLat: finalPickupLat,
            pickupLng: finalPickupLng,
            sellerCanDeliver: hasDeliveryOption('DELIVERY') ? sellerCanDeliver : false,
            deliveryRadiusKm: hasDeliveryOption('DELIVERY') && sellerCanDeliver && deliveryRadiusKm ? parseFloat(deliveryRadiusKm) : null,
            tags: tags.filter(tag => tag.trim().length > 0),
            ...(video && {
              video: {
                url: video.url,
                thumbnail: video.thumbnail || null,
                duration: video.duration || null
              }
            })
          })
        });
      } else {
        // Get growth photos from sessionStorage if available
        let growthPhotos: any[] = [];
        try {
          const growthPhotosStr = sessionStorage.getItem('gardenGrowthPhotos') || localStorage.getItem('gardenGrowthPhotos');
          if (growthPhotosStr) {
            growthPhotos = JSON.parse(growthPhotosStr);
            // Clean up after reading
            sessionStorage.removeItem('gardenGrowthPhotos');
            localStorage.removeItem('gardenGrowthPhotos');
          }
        } catch (error) {
          console.error('Error reading growth photos:', error);
        }

        // Create new product
        res = await fetch('/api/products/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            priceCents,
            orderMethod,
            category: 'GARDEN',
            subcategory: subcategory || null,
            deliveryMode: deliveryModeFromOptions(deliveryOptions),
            images: imageUrls,
            isPublic: isActive, // For backwards compatibility
            isActive: isActive, // Explicitly send isActive state
            platform,
            pickupAddress: finalPickupAddress,
            pickupLat: finalPickupLat,
            pickupLng: finalPickupLng,
            sellerCanDeliver: hasDeliveryOption('DELIVERY') ? sellerCanDeliver : false,
            deliveryRadiusKm: hasDeliveryOption('DELIVERY') && sellerCanDeliver && deliveryRadiusKm ? parseFloat(deliveryRadiusKm) : null,
            stock: stock ? parseInt(stock) : 0,
            maxStock: maxStock ? parseInt(maxStock) : null,
            tags: tags.filter(tag => tag.trim().length > 0),
            growthPhotos: growthPhotos.length > 0 ? growthPhotos : undefined,
            ...(gardenMeta && {
              plantType: gardenMeta.plantType,
              sunlight: gardenMeta.sunlight,
              waterNeeds: gardenMeta.waterNeeds,
              harvestDate: gardenMeta.harvestDate,
              location: gardenMeta.location,
              growthDuration: gardenMeta.growthDuration,
              plantDate: gardenMeta.plantDate,
              soilType: gardenMeta.soilType,
              plantDistance: gardenMeta.plantDistance,
              notes: gardenMeta.notes,
              difficulty: gardenMeta.difficulty,
            }),
            ...(video && {
              video: {
                url: video.url,
                thumbnail: video.thumbnail || null,
                duration: video.duration || null
              }
            })
          })
        });
      }

      data = await res.json();
      
      console.log('📡 [CompactGardenForm] Response status:', res.status, res.ok);
      console.log('📡 [CompactGardenForm] Response data:', data);
      
      if (res.ok) {
        console.log('✅ [CompactGardenForm] Product created/updated successfully');
        if (data.publishBlocked && data.publishBlockReason === 'PAYMENTS_REQUIRED') {
          setMessage(t('marketplace.stripeRecommendation.message'));
        }
        await hcpRewardUi?.refetchGamification();
        if (onSave) {
          onSave(data.product || data);
        } else {
          window.location.href = editMode
            ? `/product/${data.product?.id || data.id}`
            : getProfileHrefAfterProductSave('GARDEN', { added: true });
        }
      } else {
        console.error('❌ [CompactGardenForm] API error:', {
          status: res.status,
          statusText: res.statusText,
          error: data.error,
          details: data.details
        });
        if (tryShowAccountRequirementsFromApiBody(res.status, data)) {
          setMessage(t('accountRequirementsGate.hint'));
          return;
        }
        setMessage(
          [data.error, data.details].filter(Boolean).join(' ').trim() ||
            t('productForm.errorOccurred')
        );
      }
    } catch (error) {
      console.error('❌ [CompactGardenForm] Submit error:', error);
      console.error('❌ [CompactGardenForm] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      setMessage(error instanceof Error ? error.message : t('productForm.savingFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-sm" data-compact-garden-form>
      {/* Compact Header */}
      <div className="mb-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">🌱</span>
          <h2 className="text-xl font-bold text-gray-900">
            {editMode ? t('productForm.editGardenProduct') : t('productForm.newGardenProduct')}
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
          <span>🌱</span>
          <span>{t('compactForms.garden.badge')}</span>
        </div>
      </div>

      {editMode && linkedInspirationCategory && existingProduct?.id ? (
        <ProductEditInspirationLink
          productId={existingProduct.id}
          category={linkedInspirationCategory}
        />
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Video Upload */}
        <div>
          <VideoUploader
            value={video || null}
            onChange={(videoData) => {
              setVideo(videoData || null);
            }}
            maxDuration={30}
            uploadContext="dish"
          />
        </div>

        {/* Foto Upload - Compact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('compactForms.shared.photoMediaLabel')}
          </label>
          <SimpleImageUploader
            value={images}
            onChange={setImages}
            max={5}
            category="GARDEN"
          />
        </div>

        {/* Verkoopvorm */}
        <ProductOrderMethodSelector
          value={orderMethod}
          onChange={setOrderMethod}
        />

        {/* Titel & Prijs - Side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('compactForms.shared.titleLabel')}</label>
            <p className="text-xs text-gray-500 mb-1.5 leading-snug">
              {t('compactForms.shared.titleHelper')}
            </p>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('compactForms.shared.titlePlaceholderGardenExample')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {orderMethod === 'CONTACT'
                ? t('productOrder.priceOptionalLabel')
                : t('compactForms.shared.priceLabelEuro')}
            </label>
            {orderMethod === 'CONTACT' ? (
              <p className="text-xs text-gray-500 mb-1.5 leading-snug">
                {t('productOrder.priceOptionalHint')}
              </p>
            ) : null}
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={
                orderMethod === 'CONTACT'
                  ? t('productOrder.priceOptionalPlaceholder')
                  : t('compactForms.shared.pricePlaceholderGarden')
              }
              inputMode="decimal"
            />
          </div>
        </div>

        {/* Beschrijving - Compact */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">{t('compactForms.shared.descriptionLabel')}</label>
            <EmojiPickerButton
              onEmojiClick={(emoji) => {
                setDescription(prev => prev + emoji);
                const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                if (textarea) {
                  textarea.focus();
                  const len = textarea.value.length;
                  textarea.setSelectionRange(len, len);
                }
              }}
              category="GARDEN"
              className="flex-shrink-0"
            />
          </div>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 h-20 focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('compactForms.shared.descriptionPlaceholderGarden')}
          />
        </div>

        {/* Subcategorie & Bezorging - Side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tOr('products.typeProduct', 'Category', 'Categorie')}
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              aria-label={tOr('products.chooseType', 'Choose a category', 'Kies een categorie')}
              className={`w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${subcategory ? 'text-gray-900' : 'text-gray-400'}`}
            >
              <option value="" disabled hidden>
                {tOr('products.chooseType', 'Choose a category', 'Kies een categorie')}
              </option>
              {GARDEN_SUBCATEGORIES.map((sub) => (
                <option key={sub} value={sub} className="text-gray-900">
                  {t(`compactForms.garden.subLabels.${sub}` as any)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('compactForms.shared.deliveryOptionsHeading')}</label>
            <div className="space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-white rounded p-2 transition-colors">
                <input
                  type="checkbox"
                  checked={hasDeliveryOption('PICKUP')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDeliveryOptions([...deliveryOptions, 'PICKUP']);
                    } else {
                      setDeliveryOptions(deliveryOptions.filter(opt => opt !== 'PICKUP'));
                    }
                  }}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {t('productForm.deliveryOptions.pickup')}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-white rounded p-2 transition-colors">
                <input
                  type="checkbox"
                  checked={hasDeliveryOption('DELIVERY')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDeliveryOptions([...deliveryOptions, 'DELIVERY']);
                    } else {
                      setDeliveryOptions(deliveryOptions.filter(opt => opt !== 'DELIVERY'));
                    }
                  }}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  {t('productForm.deliveryOptions.delivery')}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-white rounded p-2 transition-colors">
                <input
                  type="checkbox"
                  checked={hasDeliveryOption('SHIPPING')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDeliveryOptions([...deliveryOptions, 'SHIPPING']);
                    } else {
                      setDeliveryOptions(deliveryOptions.filter(opt => opt !== 'SHIPPING'));
                    }
                  }}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {t('productForm.shippingInfo.title')}
                </span>
              </label>
              {deliveryOptions.length === 0 && (
                <p className="text-xs text-red-600 mt-1">{t('compactForms.shared.deliveryAtLeastOne')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Pickup Location - Alleen tonen wanneer PICKUP of BOTH gekozen is (voor dorpsplein producten) */}
        {hasDeliveryOption('PICKUP') && (
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              📍 {t('productForm.pickupAddress')}
            </label>
            <p className="text-xs text-gray-600 mb-4">
              {t('productForm.pickupAddressDescription')}
            </p>
            
            {/* Keuze: Mijn adres of ander adres */}
            <div className="mb-4">
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="pickupAddressType"
                    checked={useMyAddress}
                    onChange={() => {
                      setUseMyAddress(true);
                      setPickupGeocodingError(null);
                    }}
                    className="mr-2 w-4 h-4 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {t('productForm.useMyAddress')}
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="pickupAddressType"
                    checked={!useMyAddress}
                    onChange={() => {
                      setUseMyAddress(false);
                      setPickupGeocodingError(null);
                    }}
                    className="mr-2 w-4 h-4 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {t('productForm.useOtherAddress')}
                  </span>
                </label>
              </div>
            </div>

            {/* Adres velden - alleen tonen wanneer "Ander adres" gekozen is */}
            {!useMyAddress && (
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <DynamicAddressFields
                  value={{
                    address: pickupAddress,
                    postalCode: pickupPostalCode,
                    houseNumber: pickupHouseNumber,
                    city: pickupCity,
                    country: pickupCountry,
                    lat: pickupLat,
                    lng: pickupLng,
                  }}
                  onChange={(data) => {
                    setPickupAddress(data.address || '');
                    setPickupPostalCode(data.postalCode || '');
                    setPickupHouseNumber(data.houseNumber || '');
                    setPickupCity(data.city || '');
                    setPickupCountry(data.country || 'NL');
                    setPickupLat(data.lat ?? null);
                    setPickupLng(data.lng ?? null);
                    if (data.lat === null || data.lng === null) {
                      setPickupGeocodingError(null);
                    }
                  }}
                  onGeocode={(data) => {
                    setPickupLat(data.lat);
                    setPickupLng(data.lng);
                    setPickupGeocodingError(null);
                  }}
                  required={!useMyAddress}
                  showValidation={true}
                  error={pickupGeocodingError}
                  geocodingEnabled={true}
                  showCountrySelector={true}
                />
              </div>
            )}
          </div>
        )}

        {/* Shipping Info - Alleen tonen wanneer SHIPPING gekozen is */}
        {hasDeliveryOption('SHIPPING') && (
          <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              📦 {t('productForm.shippingInfo.title')}
            </label>
            <p className="text-xs text-gray-600 mb-2">
              {t('productForm.shippingInfo.description')}
            </p>
            <p className="text-xs text-gray-500">
              {t('productForm.shippingInfo.addressNote')}
            </p>
          </div>
        )}

        {/* Status Toggle - Altijd beschikbaar */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border-2 border-emerald-200">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            👁️ {t('productForm.status')}
          </label>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 mb-1">
                {isActive
                  ? t('compactForms.shared.statusActiveDorpsplein')
                  : t('compactForms.shared.statusInactiveDorpsplein')}
              </p>
              <p className="text-xs text-gray-600">
                {isActive
                  ? t('compactForms.shared.statusActiveHelp')
                  : t('compactForms.shared.statusInactiveHelp')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`ml-4 relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                isActive ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={isActive}
              aria-label={t('productForm.status')}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Voorraad - Altijd beschikbaar */}
        <div className="bg-gray-50 rounded-lg p-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">📦 {t('productForm.stock')}</label>
          <div className="grid gap-2 grid-cols-2">
            <div>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder={t('common.current')}
                min="0"
              />
            </div>
            <div>
              <input
                type="number"
                value={maxStock}
                onChange={(e) => setMaxStock(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder={t('common.maximum')}
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            🏷️ {t('productForm.tags')}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((_, i) => i !== index))}
                  className="hover:text-green-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  e.preventDefault();
                  if (!tags.includes(tagInput.trim())) {
                    setTags([...tags, tagInput.trim()]);
                  }
                  setTagInput('');
                }
              }}
              className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder={t('compactForms.shared.tagPlaceholderEnter')}
            />
            <button
              type="button"
              onClick={() => {
                if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                  setTags([...tags, tagInput.trim()]);
                  setTagInput('');
                }
              }}
              className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
            >
              +
            </button>
          </div>
          {/* Klikbare suggestie-chips: helpen gebruiker zonder de bestaande tag-state
              te wijzigen. Gebruikt dezelfde setTags-flow als handmatig toevoegen. */}
          {TAG_SUGGESTIONS.length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1.5">
                {tOr('compactForms.shared.tagSuggestionsHeading', 'Suggestions', 'Suggesties')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TAG_SUGGESTIONS.map((suggestion) => {
                  const isActive = tags.includes(suggestion);
                  return (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        if (isActive) return;
                        setTags([...tags, suggestion]);
                      }}
                      aria-pressed={isActive}
                      disabled={isActive}
                      className={
                        isActive
                          ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-green-300 bg-green-100 text-green-700 cursor-default opacity-60'
                          : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-gray-300 bg-white text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors'
                      }
                    >
                      {isActive ? `✓ ${suggestion}` : `+ ${suggestion}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {message && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {message}
          </div>
        )}

        {/* Submit Buttons - Sticky at bottom */}
        <div className="sticky bottom-0 z-10 -mx-4 -mb-4 mt-4 flex gap-2 border-t border-gray-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] shadow-lg sm:pb-4 md:pb-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {editMode ? t('productForm.updating') : t('productForm.saving')}
              </div>
            ) : (
              editMode ? t('compactForms.shared.updateSubmitWithCheck') : t('compactForms.shared.publishAndEarn')
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}














