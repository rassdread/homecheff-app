"use client";

import { useEffect, useMemo, useState } from "react";
import ProductManagement from "./ProductManagement";

type Dish = {
  id: string;
  title: string | null;
  description: string | null;
  status: "PRIVATE" | "PUBLISHED";
  createdAt: string;
  priceCents?: number | null;
  deliveryMode?: "PICKUP" | "DELIVERY" | "BOTH" | null;
  place?: string | null;
  category?: "CHEFF" | "GROWN" | "DESIGNER";
  subcategory?: string;
  stock?: number | null;
  maxStock?: number | null;
  photos: { id: string; url: string; idx: number; isMain?: boolean }[];
};

type UploadedFile = {
  file: File;
  preview: string;
  isMain: boolean;
};

const CATEGORIES = {
  CHEFF: {
    label: "Chef",
    itemName: "gerecht",
    addButtonText: "Nieuw Gerecht",
    subcategories: [
      "Hoofdgerecht",
      "Voorgerecht", 
      "Dessert",
      "Snack",
      "Soep",
      "Salade",
      "Pasta",
      "Rijst",
      "Vlees",
      "Vis",
      "Vegetarisch",
      "Veganistisch",
      "Glutenvrij",
      "Aziatisch",
      "Mediterraans",
      "Italiaans",
      "Frans",
      "Spaans",
      "Surinaams",
      "Marokkaans",
      "Indisch",
      "Thais",
      "Chinees",
      "Japans",
      "Mexicaans",
      "Amerikaans",
      "Nederlands",
      "Anders"
    ]
  },
  GROWN: {
    label: "Garden",
    itemName: "kweek",
    addButtonText: "Nieuwe Kweek",
    subcategories: [
      "Groenten",
      "Fruit",
      "Kruiden",
      "Zaden",
      "Planten",
      "Bloemen",
      "Kamerplanten",
      "Tuinplanten",
      "Moestuin",
      "Biologisch",
      "Lokaal geteeld",
      "Seizoensgebonden",
      "Zeldzame variëteiten",
      "Struiken",
      "Bomen",
      "Bollen",
      "Stekken",
      "Compost",
      "Meststoffen",
      "Tuingereedschap",
      "Anders"
    ]
  },
  DESIGNER: {
    label: "Designer",
    itemName: "creatie",
    addButtonText: "Nieuwe Creatie",
    subcategories: [
      "Handgemaakt",
      "Kunst",
      "Decoratie",
      "Meubels",
      "Textiel",
      "Keramiek",
      "Houtwerk",
      "Metaalwerk",
      "Glaswerk",
      "Juwelen",
      "Accessoires",
      "Kleding",
      "Schoenen",
      "Tassen",
      "Interieur",
      "Exterieur",
      "Fotografie",
      "Illustraties",
      "Printwerk",
      "Digitale kunst",
      "Upcycling",
      "Vintage",
      "Modern",
      "Klassiek",
      "Minimalistisch",
      "Eclectisch",
      "Anders"
    ]
  }
};

// Functie om categorieën te filteren op basis van activeRole
const getFilteredCategories = (activeRole: string) => {
  if (activeRole === 'chef') {
    return { CHEFF: CATEGORIES.CHEFF };
  } else if (activeRole === 'garden') {
    return { GROWN: CATEGORIES.GROWN };
  } else if (activeRole === 'designer') {
    return { DESIGNER: CATEGORIES.DESIGNER };
  } else {
    // Als geen specifieke rol of generic, toon alle categorieën
    return CATEGORIES;
  }
};

interface MyDishesManagerProps {
  onStatsUpdate?: () => void;
  activeRole?: string;
}

export default function MyDishesManager({ onStatsUpdate, activeRole = 'generic' }: MyDishesManagerProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Dish[]>([]);
  const [activeTab, setActiveTab] = useState<'dishes' | 'products'>('products');

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publish, setPublish] = useState(false);
  const [priceEuro, setPriceEuro] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"PICKUP" | "DELIVERY" | "BOTH">("PICKUP");
  const [useMyLocation, setUseMyLocation] = useState(true);
  const [place, setPlace] = useState("");
  const [coords, setCoords] = useState<{lat:number,lng:number} | null>(null);
  const [category, setCategory] = useState<"CHEFF" | "GROWN" | "DESIGNER">("CHEFF");
  const [subcategory, setSubcategory] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [stock, setStock] = useState("");
  const [maxStock, setMaxStock] = useState("");
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  // Stel categorie automatisch in op basis van activeRole
  useEffect(() => {
    if (activeRole === 'chef') {
      setCategory('CHEFF');
    } else if (activeRole === 'garden') {
      setCategory('GROWN');
    } else if (activeRole === 'designer') {
      setCategory('DESIGNER');
    } else {
      setCategory('CHEFF'); // default
    }
  }, [activeRole]);

  const canAdd = useMemo(() => {
    if (title.trim().length === 0 || uploadedFiles.length === 0) return false;
    if (publish) {
      const n = Number(priceEuro.replace(/[^0-9,\.]/g, "").replace(",", "."));
      if (!Number.isFinite(n) || n <= 0) return false;
      const stockNum = Number(stock);
      if (!Number.isFinite(stockNum) || stockNum < 0) return false;
    }
    return true;
  }, [title, uploadedFiles, publish, priceEuro, stock]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/seller/products");
    if (res.ok) {
      const data = await res.json();
      // Transform Product data to match Dish format for compatibility
      const transformedItems = data.products?.map((product: any) => ({
        id: product.id,
        title: product.title,
        description: product.description,
        status: product.isActive ? "PUBLISHED" : "PRIVATE",
        createdAt: product.createdAt,
        priceCents: product.priceCents,
        deliveryMode: product.delivery === "PICKUP" ? "PICKUP" : product.delivery === "DELIVERY" ? "DELIVERY" : "BOTH",
        place: "Nederland", // Default place
        category: product.category === "CHEFF" ? "CHEFF" : product.category === "GROWN" ? "GROWN" : "DESIGNER",
        subcategory: product.subcategory,
        stock: product.stock,
        maxStock: product.maxStock,
        photos: product.Image?.map((img: any, index: number) => ({
          id: img.id,
          url: img.fileUrl,
          idx: img.sortOrder || index,
          isMain: img.sortOrder === 0
        })) || []
      })) || [];
      setItems(transformedItems);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function ensureCoords(): Promise<{lat:number,lng:number} | null> {
    if (!useMyLocation) return null;
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 }
      );
    });
  }

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const filesArr = Array.from(e.target.files || []).slice(0, 5);
    const newFiles: UploadedFile[] = filesArr.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      isMain: uploadedFiles.length === 0 && index === 0 // First file is main by default
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles].slice(0, 5));
  }

  function removeFile(index: number) {
    setUploadedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      // If we removed the main photo, make the first remaining photo the main one
      if (prev[index]?.isMain && newFiles.length > 0) {
        newFiles[0].isMain = true;
      }
      return newFiles;
    });
  }

  function setMainPhoto(index: number) {
    setUploadedFiles(prev => 
      prev.map((file, i) => ({ ...file, isMain: i === index }))
    );
  }

  async function createDish() {
    if (!canAdd) return;
    
    setIsUploading(true);
    setMessage(null);
    
    try {
      const got = await ensureCoords();
      if (got) setCoords(got);

      const uploadedUrls: {url: string, isMain: boolean}[] = [];
      for (const uploadedFile of uploadedFiles) {
        // Client-side validation
        if (!uploadedFile.file.type.startsWith('image/')) {
          throw new Error(`Bestand "${uploadedFile.file.name}" is geen afbeelding. Alleen afbeeldingen zijn toegestaan.`);
        }
        
        if (uploadedFile.file.size > 10 * 1024 * 1024) { // 10MB
          throw new Error(`Bestand "${uploadedFile.file.name}" is te groot. Maximum 10MB toegestaan.`);
        }
        
        const formData = new FormData();
        formData.append('file', uploadedFile.file);
        
        const res = await fetch('/api/upload', { 
          method: 'POST', 
          body: formData 
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`Upload van "${uploadedFile.file.name}" mislukt: ${errorData.error || 'Onbekende fout'}`);
        }
        
        const data = await res.json();
        if (!data?.url) {
          throw new Error(`Upload van "${uploadedFile.file.name}" mislukt: Geen URL ontvangen`);
        }
        
        uploadedUrls.push({
          url: data.url,
          isMain: uploadedFile.isMain
        });
      }

      const payload: any = {
        title,
        description,
        status: publish ? "PUBLISHED" : "PRIVATE",
        photos: uploadedUrls,
        category,
        subcategory: subcategory || null,
      };
      
      if (publish) {
        payload.priceCents = Math.round(Number(priceEuro) * 100);
        payload.deliveryMode = deliveryMode;
        payload.stock = Number(stock);
        payload.maxStock = maxStock ? Number(maxStock) : null;
      }
      
      if (useMyLocation && (got || coords)) {
        const c = got || coords;
        payload.lat = c?.lat;
        payload.lng = c?.lng;
        payload.place = place || null;
      } else if (place) {
        payload.place = place;
      }

      const res = await fetch("/api/profile/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setTitle(""); 
        setDescription(""); 
        setPublish(false);
        setPriceEuro(""); 
        setDeliveryMode("PICKUP"); 
        setUploadedFiles([]);
        setCategory("CHEFF");
        setSubcategory("");
        setStock("");
        setMaxStock("");
        setIsFormExpanded(false); // Collapse form after successful creation
        setMessage({type: 'success', text: 'Item succesvol opgeslagen!'});
        await load();
        onStatsUpdate?.();
      } else {
        const j = await res.json().catch(() => ({} as any));
        setMessage({type: 'error', text: j?.error ?? "Opslaan mislukt"});
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Er is een fout opgetreden bij het uploaden';
      setMessage({type: 'error', text: errorMessage});
    } finally {
      setIsUploading(false);
    }
  }

  async function togglePublish(id: string, next: boolean) {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: next })
    });
    if (res.ok) {
      await load();
      onStatsUpdate?.();
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Weet je zeker dat je dit product wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.')) {
      return;
    }
    
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE"
    });
    if (res.ok) {
      await load();
      onStatsUpdate?.();
      setMessage({type: 'success', text: 'Product succesvol verwijderd!'});
    } else {
      const error = await res.json().catch(() => ({}));
      setMessage({type: 'error', text: error?.error || 'Fout bij verwijderen van product'});
    }
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

      {/* Tabs */}
      <div className="bg-white rounded-2xl border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-primary-brand text-primary-brand'
                  : 'border-transparent text-gray-500 hover:text-primary-brand hover:border-gray-300'
              }`}
            >
              <span>Live</span>
            </button>
            <button
              onClick={() => setActiveTab('dishes')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dishes'
                  ? 'border-primary-brand text-primary-brand'
                  : 'border-transparent text-gray-500 hover:text-primary-brand hover:border-gray-300'
              }`}
            >
              <span>Geschiedenis</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'dishes' && (
            <div className="space-y-6">
              {/* Collapsible New Dish Form */}
              <div className="rounded-2xl border bg-white">
                {/* Header Button */}
                <button
                  onClick={() => setIsFormExpanded(!isFormExpanded)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors rounded-2xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Nieuw {category === "CHEFF" ? "gerecht" : category === "GROWN" ? "kweek" : "creatie"} toevoegen
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {category === "CHEFF" 
                          ? "Upload maximaal 10 foto's van je gerecht en kies een hoofdfoto voor de feed"
                          : category === "GROWN" 
                          ? "Upload maximaal 10 foto's van je kweek en kies een hoofdfoto voor de feed"
                          : "Upload maximaal 10 foto's van je creatie en kies een hoofdfoto voor de feed"
                        }
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {isFormExpanded ? 'Verberg' : 'Toon'} formulier
                      </span>
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform ${isFormExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Expandable Form Content */}
                {isFormExpanded && (
                  <div className="px-6 pb-6 space-y-6 border-t border-gray-200">

                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Titel *</label>
                    <input 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                      placeholder={
                        category === "CHEFF" 
                          ? "bv. Surinaamse Roti" 
                          : category === "GROWN" 
                          ? "bv. Verse tomaten uit eigen tuin"
                          : "bv. Handgemaakte keramieken vaas"
                      }
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categorie *</label>
                    {activeRole && activeRole !== 'generic' ? (
                      // Toon alleen de juiste categorie voor specifieke rollen
                      <div className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-gray-50 text-gray-700">
                        {getFilteredCategories(activeRole)[category]?.label || category}
                      </div>
                    ) : (
                      // Toon dropdown voor generieke rol
                      <select 
                        value={category} 
                        onChange={e => {
                          setCategory(e.target.value as any);
                          setSubcategory(""); // Reset subcategory when category changes
                        }}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        {Object.entries(getFilteredCategories(activeRole)).map(([key, cat]) => (
                          <option key={key} value={key}>{cat.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subcategorie (optioneel)</label>
                  <select 
                    value={subcategory} 
                    onChange={e => setSubcategory(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Selecteer een subcategorie</option>
                    {getFilteredCategories(activeRole)[category]?.subcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Beschrijving *</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                    rows={4} 
                    placeholder={
                      category === "CHEFF" 
                        ? "Beschrijf je gerecht, ingrediënten, bereidingswijze..."
                        : category === "GROWN" 
                        ? "Beschrijf je product, teeltwijze, oogstdatum..."
                        : "Beschrijf je creatie, materialen, techniek..."
                    } 
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foto's * (max 5)</label>
                  <div className="space-y-4">
                    {/* Upload Button */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={onFilesChange}
                        className="hidden"
                        id="photo-upload"
                        disabled={uploadedFiles.length >= 5}
                      />
                      <label 
                        htmlFor="photo-upload" 
                        className={`cursor-pointer ${uploadedFiles.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-gray-600">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="mt-2 text-sm">
                            {uploadedFiles.length >= 5 ? 'Maximum 5 foto\'s bereikt' : 'Klik om foto\'s te uploaden'}
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF tot 10MB</p>
                        </div>
                      </label>
                    </div>

                    {/* Photo Preview Grid */}
                    {uploadedFiles.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={file.preview} 
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                            />
                            
                            {/* Main Photo Badge */}
                            {file.isMain && (
                              <div className="absolute top-1 left-1 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                                Hoofdfoto
                              </div>
                            )}
                            
                            {/* Actions */}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                              {!file.isMain && (
                                <button
                                  onClick={() => setMainPhoto(index)}
                                  className="bg-emerald-500 text-white px-2 py-1 rounded text-xs hover:bg-emerald-600"
                                >
                                  Maak hoofdfoto
                                </button>
                              )}
                              <button
                                onClick={() => removeFile(index)}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                              >
                                Verwijder
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Publishing Options */}
                <div className="border-t pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <input 
                      type="checkbox" 
                      id="publish" 
                      checked={publish} 
                      onChange={e => setPublish(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label htmlFor="publish" className="text-sm font-medium text-gray-700">
                      Publiceer direct (anders privé)
                    </label>
                  </div>

                  {publish && (
                    <div className="p-4 bg-gray-50 rounded-xl space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Prijs (€) *</label>
                          <input 
                            value={priceEuro} 
                            onChange={e => setPriceEuro(e.target.value)} 
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                            placeholder="bijv. 9,99" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Levering *</label>
                          <select 
                            value={deliveryMode} 
                            onChange={e => setDeliveryMode(e.target.value as any)} 
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="PICKUP">Alleen afhalen</option>
                            <option value="DELIVERY">Alleen bezorgen</option>
                            <option value="BOTH">Beide opties</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Voorraad *</label>
                          <input 
                            type="number"
                            min="0"
                            value={stock} 
                            onChange={e => setStock(e.target.value)} 
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                            placeholder="bijv. 10" 
                          />
                          <p className="text-xs text-gray-500 mt-1">Hoeveel items je beschikbaar hebt</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Maximale voorraad (optioneel)</label>
                          <input 
                            type="number"
                            min="0"
                            value={maxStock} 
                            onChange={e => setMaxStock(e.target.value)} 
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                            placeholder="bijv. 50" 
                          />
                          <p className="text-xs text-gray-500 mt-1">Maximum aantal items dat je kunt maken</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Locatie (optioneel)</h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        id="useLocation" 
                        checked={useMyLocation} 
                        onChange={e => setUseMyLocation(e.target.checked)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label htmlFor="useLocation" className="text-sm text-gray-700">
                        Gebruik mijn huidige locatie
                      </label>
                    </div>
                    <input 
                      value={place} 
                      onChange={e => setPlace(e.target.value)} 
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                      placeholder="Plaatsnaam (optioneel)" 
                    />
                    <p className="text-xs text-gray-500">Locatie helpt om je item in de feed op afstand te sorteren.</p>
                  </div>
                </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                      <button 
                        onClick={createDish} 
                        disabled={!canAdd || isUploading}
                        className={`px-8 py-3 rounded-xl font-medium transition-colors ${
                          canAdd && !isUploading
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isUploading ? 'Uploaden...' : 'Item opslaan'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Existing Dishes */}
              {loading ? (
                <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
              ) : !items.length ? (
                <div className="rounded-xl border bg-white p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen {category === "CHEFF" ? "gerechten" : category === "GROWN" ? "kweken" : "creaties"}</h3>
                  <p className="text-sm text-gray-500">Voeg je eerste {category === "CHEFF" ? "gerecht" : category === "GROWN" ? "kweek" : "creatie"} toe om te beginnen met verkopen!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Mijn {category === "CHEFF" ? "gerechten" : category === "GROWN" ? "kweken" : "creaties"} ({items.length})</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(d => {
                      const mainPhoto = d.photos?.find(p => p.isMain) || d.photos?.[0];
                      return (
                        <div 
                          key={d.id} 
                          onClick={() => window.location.href = `/product/${d.id}/edit`}
                          className="rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        >
                          {/* Main Photo */}
                          <div className="relative">
                            <img 
                              src={mainPhoto?.url ?? "/placeholder.webp"} 
                              alt={d.title ?? "Gerecht"} 
                              className="w-full h-48 object-cover" 
                            />
                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                d.status === "PUBLISHED" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {d.status === "PUBLISHED" ? "Gepubliceerd" : "Privé"}
                              </span>
                            </div>
                            {/* Category Badge */}
                            {d.category && (
                              <div className="absolute top-3 left-3">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                  {getFilteredCategories(activeRole)[d.category]?.label || d.category}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="p-4 space-y-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 truncate">{d.title ?? "Gerecht"}</h4>
                              {d.subcategory && (
                                <p className="text-sm text-gray-600">{d.subcategory}</p>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 line-clamp-2">{d.description}</p>
                            
                            {/* Price and Location */}
                            <div className="space-y-1">
                              {d.priceCents && (
                                <p className="text-lg font-semibold text-emerald-600">€ {(d.priceCents/100).toFixed(2)}</p>
                              )}
                              
                              {/* Stock Information */}
                              {d.stock !== undefined && d.stock !== null && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Voorraad:</span>
                                  <span className={`font-medium ${
                                    d.stock === 0 ? 'text-red-600' : 
                                    d.stock <= 5 ? 'text-orange-600' : 
                                    'text-green-600'
                                  }`}>
                                    {d.stock} {d.maxStock ? `/ ${d.maxStock}` : ''}
                                  </span>
                                </div>
                              )}
                              
                              {d.place && (
                                <p className="text-xs text-gray-500 flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  </svg>
                                  {d.place}
                                </p>
                              )}
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePublish(d.id, d.status !== "PUBLISHED");
                                  }} 
                                  className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                                    d.status === "PUBLISHED"
                                      ? "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                      : "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                                  }`}
                                >
                                  {d.status === "PUBLISHED" ? "Maak privé" : "Publiceer"}
                                </button>
                                
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/product/${d.id}/edit`;
                                  }} 
                                  className="text-sm px-3 py-1 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                                >
                                  Bewerken
                                </button>
                                
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteProduct(d.id);
                                  }} 
                                  className="text-sm px-3 py-1 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                                >
                                  Verwijderen
                                </button>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {d.photos && d.photos.length > 1 && (
                                  <span className="text-xs text-gray-500">
                                    {d.photos.length} foto's
                                  </span>
                                )}
                                <span className="text-xs text-gray-400">
                                  {new Date(d.createdAt).toLocaleDateString('nl-NL')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <ProductManagement onUpdate={() => {
              onStatsUpdate?.();
            }} />
          )}
        </div>
      </div>
    </div>
  );
}