"use client";

import { useEffect, useMemo, useState } from "react";
import ProductManagement from "./ProductManagement";
import RecipeManager from "./RecipeManager";

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
  const [activeTab, setActiveTab] = useState<'dishes' | 'products' | 'recipes'>('products');

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
    
    // Try to load dishes first (for kitchen photos)
    const dishesRes = await fetch("/api/profile/dishes");
    if (dishesRes.ok) {
      const dishesData = await dishesRes.json();
      if (dishesData.items && dishesData.items.length > 0) {
        setItems(dishesData.items);
        setLoading(false);
        return;
      }
    }
    
    // Fallback to products if no dishes found
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
        
        // Upload file directly
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
            {activeRole === 'chef' && (
              <button
                onClick={() => setActiveTab('recipes')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'recipes'
                    ? 'border-primary-brand text-primary-brand'
                    : 'border-transparent text-gray-500 hover:text-primary-brand hover:border-gray-300'
                }`}
              >
                <span>Mijn Recepten</span>
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'products' && (
            <ProductManagement onUpdate={() => {
              onStatsUpdate?.();
            }} />
          )}

          {activeTab === 'recipes' && activeRole === 'chef' && (
            <RecipeManager isActive={activeTab === 'recipes'} />
          )}
        </div>
      </div>
    </div>
  );
}