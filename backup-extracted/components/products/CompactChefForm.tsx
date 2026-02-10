'use client';
import * as React from 'react';
import { useSession } from 'next-auth/react';
import SimpleImageUploader from './SimpleImageUploader';

type Uploaded = { 
  url: string; 
  uploading?: boolean;
  error?: string;
};

const DELIVERY = [
  { label: 'Afhalen', value: 'PICKUP' },
  { label: 'Bezorgen', value: 'DELIVERY' },
  { label: 'Beide', value: 'BOTH' },
];

const CHEF_SUBCATEGORIES = [
  "Hoofdgerecht", "Voorgerecht", "Dessert", "Snack", "Soep", "Salade", 
  "Pasta", "Rijst", "Vegetarisch", "Veganistisch", "Glutenvrij", 
  "Lactosevrij", "Seizoen", "Feestdagen", "BBQ", "Bakken", "Wereldkeuken"
];

interface CompactChefFormProps {
  editMode?: boolean;
  existingProduct?: any;
  onSave?: (product: any) => void;
  onCancel?: () => void;
  initialPhoto?: string;
  platform?: 'dorpsplein' | 'inspiratie';
}

export default function CompactChefForm({ 
  editMode = false,
  existingProduct = null,
  onSave,
  onCancel,
  initialPhoto,
  platform = 'dorpsplein'
}: CompactChefFormProps) {
  
  const { data: session } = useSession();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [subcategory, setSubcategory] = React.useState('');
  const [deliveryMode, setDeliveryMode] = React.useState('PICKUP');
  const [images, setImages] = React.useState<Uploaded[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  
  // Edit mode specific states
  const [stock, setStock] = React.useState('');
  const [maxStock, setMaxStock] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);

  // Initialize form with existing product data
  React.useEffect(() => {
    if (editMode && existingProduct) {
      setTitle(existingProduct.title || '');
      setDescription(existingProduct.description || '');
      setPrice(existingProduct.priceCents ? (existingProduct.priceCents / 100).toString() : '');
      setSubcategory(existingProduct.subcategory || '');
      setDeliveryMode(existingProduct.deliveryMode || 'PICKUP');
      setStock(existingProduct.stock?.toString() || '');
      setMaxStock(existingProduct.maxStock?.toString() || '');
      setIsActive(existingProduct.isActive ?? true);
      
      if (existingProduct.Image && existingProduct.Image.length > 0) {
        setImages(existingProduct.Image.map((img: any) => ({ url: img.fileUrl })));
      }
    }
  }, [editMode, existingProduct]);

  // Initialize with initial photo from camera
  React.useEffect(() => {
    if (initialPhoto && !editMode) {
      setImages([{ url: initialPhoto }]);
    }
  }, [initialPhoto, editMode]);

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
            category: 'CHEFF',
            subcategory: subcategory || null,
            deliveryMode,
            images: imageUrls,
            stock: stock ? parseInt(stock) : undefined,
            maxStock: maxStock ? parseInt(maxStock) : undefined,
            isActive,
            platform
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
            category: 'CHEFF',
            subcategory: subcategory || null,
            deliveryMode,
            images: imageUrls,
            platform
          })
        });
      }

      data = await res.json();
      
      if (res.ok) {
        if (onSave) {
          onSave(data.product || data);
        } else {
          window.location.href = editMode ? `/product/${data.product?.id || data.id}` : '/profile?tab=producten';
        }
      } else {
        setMessage(data.error || 'Er is een fout opgetreden');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage('Er is een fout opgetreden bij het opslaan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-sm">
      {/* Compact Header */}
      <div className="mb-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">🍳</span>
          <h2 className="text-xl font-bold text-gray-900">
            {editMode ? 'Chef Product Bewerken' : 'Nieuw Chef Product'}
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
          <span>🍳</span>
          <span>Gerechten & Maaltijden</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Foto Upload - Compact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📸 Foto's
          </label>
          <SimpleImageUploader
            value={images}
            onChange={setImages}
            max={3}
            category="CHEFF"
          />
        </div>

        {/* Titel & Prijs - Side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bijv: Zelfgemaakte lasagne"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prijs (€)</label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="12,50"
              inputMode="decimal"
            />
          </div>
        </div>

        {/* Beschrijving - Compact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 h-20 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschrijf je gerecht: ingrediënten, porties, allergenen..."
          />
        </div>

        {/* Subcategorie & Bezorging - Side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type gerecht</label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Kies type...</option>
              {CHEF_SUBCATEGORIES.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bezorging</label>
            <select
              value={deliveryMode}
              onChange={(e) => setDeliveryMode(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {DELIVERY.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Voorraad - Alleen in edit mode */}
        {editMode && (
          <div className="bg-gray-50 rounded-lg p-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">📦 Voorraad</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Huidig"
                  min="0"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={maxStock}
                  onChange={(e) => setMaxStock(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Maximum"
                  min="0"
                />
              </div>
              <div>
                <select
                  value={isActive ? 'active' : 'inactive'}
                  onChange={(e) => setIsActive(e.target.value === 'active')}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="active">✅ Actief</option>
                  <option value="inactive">❌ Inactief</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {message && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {message}
          </div>
        )}

        {/* Submit Buttons - Compact */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {editMode ? 'Bijwerken...' : 'Opslaan...'}
              </div>
            ) : (
              editMode ? '✅ Bijwerken' : '🚀 Publiceren'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
