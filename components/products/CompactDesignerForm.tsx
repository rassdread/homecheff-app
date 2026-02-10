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

type Uploaded = { 
  url: string; 
  uploading?: boolean;
  error?: string;
};

const DELIVERY = [
  { label: 'Afhalen', value: 'PICKUP' },
  { label: 'Bezorgen', value: 'DELIVERY' },
  { label: 'Verzenden', value: 'SHIPPING' },
  { label: 'Beide', value: 'BOTH' },
];

const DESIGNER_SUBCATEGORIES = [
  "Meubels", "Decoratie", "Kleding", "Accessoires", "Schilderijen",
  "Beelden", "Fotografie", "Keramiek", "Houtwerk", "Metaalwerk",
  "Textiel", "Digitale kunst", "Upcycling", "Vintage", "Modern", "Handgemaakt"
];

interface CompactDesignerFormProps {
  editMode?: boolean;
  existingProduct?: any;
  onSave?: (product: any) => void;
  onCancel?: () => void;
  initialPhoto?: string;
  platform?: 'dorpsplein' | 'inspiratie';
}

export default function CompactDesignerForm({ 
  editMode = false,
  existingProduct = null,
  onSave,
  onCancel,
  initialPhoto,
  platform = 'dorpsplein'
}: CompactDesignerFormProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [subcategory, setSubcategory] = React.useState('');
  const [deliveryOptions, setDeliveryOptions] = React.useState<string[]>(['PICKUP']);
  
  // Helper function to convert deliveryOptions array to deliveryMode string for API
  const getDeliveryMode = (options: string[]): string => {
    if (options.length === 0) return 'PICKUP'; // Default
    if (options.length === 1) return options[0];
    // Multiple options: convert to appropriate format
    if (options.includes('PICKUP') && options.includes('DELIVERY') && !options.includes('SHIPPING')) {
      return 'BOTH'; // PICKUP + DELIVERY = BOTH
    }
    // For other combinations, use comma-separated string (will be handled by API)
    return options.join(',');
  };
  
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

  // Track if design data has been loaded
  const [designDataLoaded, setDesignDataLoaded] = React.useState(false);

  // Load design data from sessionStorage when fromDesign=true
  React.useEffect(() => {
    if (editMode || designDataLoaded || typeof window === 'undefined') return;
    
    const fromDesign = searchParams?.get('fromDesign') === 'true';
    if (!fromDesign) return;
    
    try {
      const designDataStr = sessionStorage.getItem('designToProductData') || localStorage.getItem('designToProductData');
      if (!designDataStr) return;
      
      const designData = JSON.parse(designDataStr);
      
      // Pre-fill form fields with design data
      if (designData.title) setTitle(designData.title);
      if (designData.description) setDescription(designData.description);
      if (designData.category) setSubcategory(designData.category);
      if (designData.tags && Array.isArray(designData.tags)) setTags(designData.tags);
      
      // Load photos (only main photos, max 5)
      if (designData.photos && Array.isArray(designData.photos)) {
        const mainPhotos = designData.photos.slice(0, 5).map((photo: any) => ({
          url: photo.url || photo,
          uploading: false
        }));
        if (mainPhotos.length > 0) {
          setImages(mainPhotos);
        }
      }
      
      setDesignDataLoaded(true);
      
      // Clean up sessionStorage after loading
      setTimeout(() => {
        sessionStorage.removeItem('designToProductData');
        localStorage.removeItem('designToProductData');
      }, 1000);
    } catch (error) {
      console.error('Error loading design data:', error);
    }
  }, [editMode, designDataLoaded, searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const priceNumber = Number(price.replace(',', '.'));
    if (!title || !description || !Number.isFinite(priceNumber)) {
      setMessage('Vul titel, beschrijving en geldige prijs in.');
      return;
    }
    if (images.length === 0) {
      setMessage('Minstens 1 foto toevoegen.');
      return;
    }
    const priceCents = Math.round(priceNumber * 100);

    // Prepare pickup address - use user address if useMyAddress is true, otherwise use entered address
    let finalPickupAddress: string | null = null;
    let finalPickupLat: number | null = null;
    let finalPickupLng: number | null = null;
    
    // Pickup address is needed when deliveryMode is PICKUP or BOTH (for dorpsplein products)
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

    setSubmitting(true);
    try {
      const imageUrls = images.map(i => i.url);

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
            category: 'DESIGNER',
            subcategory: subcategory || null,
            deliveryMode: getDeliveryMode(deliveryOptions),
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
        // Create new product
        res = await fetch('/api/products/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            priceCents,
            category: 'DESIGNER',
            subcategory: subcategory || null,
            deliveryMode: getDeliveryMode(deliveryOptions),
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
      
      console.log('📡 [CompactDesignerForm] Response status:', res.status, res.ok);
      console.log('📡 [CompactDesignerForm] Response data:', data);
      
      if (res.ok) {
        console.log('✅ [CompactDesignerForm] Product created/updated successfully');
        if (onSave) {
          onSave(data.product || data);
        } else {
          window.location.href = editMode ? `/product/${data.product?.id || data.id}` : '/profile?tab=producten';
        }
      } else {
        console.error('❌ [CompactDesignerForm] API error:', {
          status: res.status,
          statusText: res.statusText,
          error: data.error,
          details: data.details
        });
        setMessage(data.error || data.details || 'Er is een fout opgetreden');
      }
    } catch (error) {
      console.error('❌ [CompactDesignerForm] Submit error:', error);
      console.error('❌ [CompactDesignerForm] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      setMessage(error instanceof Error ? error.message : 'Er is een fout opgetreden bij het opslaan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-sm" data-compact-designer-form>
      {/* Compact Header */}
      <div className="mb-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">🎨</span>
          <h2 className="text-xl font-bold text-gray-900">
            {editMode ? 'Designer Product Bewerken' : 'Nieuw Designer Product'}
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
          <span>🎨</span>
          <span>Handgemaakt & Design</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Video Upload */}
        <div>
          <VideoUploader
            value={video || null}
            onChange={(videoData) => {
              setVideo(videoData || null);
            }}
            maxDuration={30}
          />
        </div>

        {/* Foto Upload - Compact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📸 Foto's
          </label>
          <SimpleImageUploader
            value={images}
            onChange={setImages}
            max={5}
            category="DESIGNER"
          />
        </div>

        {/* Titel & Prijs - Side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('common.exampleDesign')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prijs (€)</label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="25,00"
              inputMode="decimal"
            />
          </div>
        </div>

        {/* Beschrijving - Compact */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Beschrijving</label>
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
              category="DESIGNER"
              className="flex-shrink-0"
            />
          </div>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 h-20 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschrijf je creatie: materiaal, techniek, afmetingen, unieke eigenschappen..."
          />
        </div>

        {/* Subcategorie & Bezorging - Side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.typeCreation')}</label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">{t('products.chooseType')}</option>
              {DESIGNER_SUBCATEGORIES.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bezorgopties</label>
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
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Afhalen
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
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Bezorgen
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
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Verzenden
                </span>
              </label>
              {deliveryOptions.length === 0 && (
                <p className="text-xs text-red-600 mt-1">Selecteer minimaal één bezorgoptie</p>
              )}
            </div>
          </div>
        </div>

        {/* Pickup Location - Alleen tonen wanneer PICKUP of BOTH gekozen is (voor dorpsplein producten) */}
        {hasDeliveryOption('PICKUP') && (
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              📍 Afhaaladres
            </label>
            <p className="text-xs text-gray-600 mb-4">
              Geef aan waar klanten het product kunnen ophalen. Deze locatie wordt gebruikt voor de radius filter op dorpsplein.
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
                    className="mr-2 w-4 h-4 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Mijn adres gebruiken
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
                    className="mr-2 w-4 h-4 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Ander adres opgeven
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
          <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              📦 {t('productForm.shippingInfo.title') || 'Verzenden'}
            </label>
            <p className="text-xs text-gray-600 mb-2">
              {t('productForm.shippingInfo.description') || 'Dit product kan via pakketpost worden verzonden. De verzendkosten worden automatisch berekend op basis van het adres van de koper.'}
            </p>
            <p className="text-xs text-gray-500">
              {t('productForm.shippingInfo.addressNote') || 'Je adres wordt automatisch gebruikt als verzendadres. Zorg dat je adres compleet is in je profiel.'}
            </p>
          </div>
        )}

        {/* Seller Delivery Option - Alleen tonen wanneer DELIVERY of BOTH gekozen is */}
        {hasDeliveryOption('DELIVERY') && (
          <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              🚚 Bezorging
            </label>
            <p className="text-xs text-gray-600 mb-4">
              Geef aan of je zelf kunt bezorgen en binnen welk bereik.
            </p>
            
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sellerCanDeliver}
                  onChange={(e) => setSellerCanDeliver(e.target.checked)}
                  className="mr-2 w-4 h-4 text-blue-500 focus:ring-blue-500 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Ik kan zelf bezorgen
                </span>
              </label>

              {sellerCanDeliver && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bezorgbereik (km)
                  </label>
                  <input
                    type="number"
                    value={deliveryRadiusKm}
                    onChange={(e) => setDeliveryRadiusKm(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Bijv. 5"
                    min="0"
                    step="0.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Binnen hoeveel kilometer ben je bereid te bezorgen?
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Toggle - Altijd beschikbaar */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            👁️ {t('productForm.status') || 'Zichtbaarheid op Dorpsplein'}
          </label>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 mb-1">
                {isActive ? '✅ Actief - Zichtbaar op Dorpsplein' : '❌ Inactief - Verborgen op Dorpsplein'}
              </p>
              <p className="text-xs text-gray-600">
                {isActive 
                  ? 'Je product is zichtbaar voor andere gebruikers op het dorpsplein'
                  : 'Je product is verborgen maar niet verwijderd. Je kunt het later weer activeren.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`ml-4 relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                isActive ? 'bg-purple-600' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={isActive}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">📦 Voorraad</label>
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
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            🏷️ Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((_, i) => i !== index))}
                  className="hover:text-blue-900"
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
              className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tag toevoegen (Enter)"
            />
            <button
              type="button"
              onClick={() => {
                if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                  setTags([...tags, tagInput.trim()]);
                  setTagInput('');
                }
              }}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Error Message */}
        {message && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {message}
          </div>
        )}

        {/* Submit Buttons - Sticky at bottom */}
        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 flex gap-2 shadow-lg -mx-4 -mb-4 mt-4 z-10">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {editMode ? t('recipe.update') + '...' : t('buttons.save') + '...'}
              </div>
            ) : (
              editMode ? '✅ ' + t('recipe.update') : '🚀 ' + t('buttons.publish')
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('buttons.cancel')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}














