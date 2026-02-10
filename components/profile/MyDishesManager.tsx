"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSafeFetch } from "@/hooks/useSafeFetch";
import { Plus } from "lucide-react";
import ProductManagement from "./ProductManagement";
import RecipeManager from "./RecipeManager";
import RecipeViewer from "./RecipeViewer";
import GardenManager from "./GardenManager";
import DesignManager from "../designs/DesignManager";

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

import { CATEGORIES as BASE_CATEGORIES } from "@/lib/categories";

// Extended categories for MyDishesManager with more detailed subcategories
const CATEGORIES = {
  CHEFF: {
    ...BASE_CATEGORIES.CHEFF,
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
    ...BASE_CATEGORIES.GROWN,
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
    ...BASE_CATEGORIES.DESIGNER,
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
  userId?: string;
  isPublic?: boolean;
  role?: string;
  showOnlyActive?: boolean;
  contentSubTab?: 'dorpsplein' | 'inspiratie';
  userSellerRoles?: string[];
}

export default function MyDishesManager({ onStatsUpdate, activeRole = 'generic', userId, isPublic = false, role, showOnlyActive = false, contentSubTab = 'dorpsplein', userSellerRoles = [] }: MyDishesManagerProps) {
  const router = useRouter();
  const safeFetch = useSafeFetch();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Dish[]>([]);
  
  // Determine initial tab based on role
  // For chef: start on recipes tab
  // For garden: start on garden tab (to show their kweken)
  // For designer: start on designs tab
  // For others: start on products tab
  const getInitialTab = (): 'dishes' | 'products' | 'recipes' | 'garden' | 'designs' => {
    if (activeRole === 'chef') return 'recipes';
    if (activeRole === 'garden') return 'garden';
    if (activeRole === 'designer') return 'designs';
    return 'products';
  };
  
  const [activeTab, setActiveTab] = useState<'dishes' | 'products' | 'recipes' | 'garden' | 'designs'>(getInitialTab());
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [showRecipeViewer, setShowRecipeViewer] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publish, setPublish] = useState(false);
  const [priceEuro, setPriceEuro] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"PICKUP" | "DELIVERY" | "BOTH">("PICKUP");
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
    
    try {
      // Check if contentSubTab is provided (works for overview and category tabs)
      if (contentSubTab) {
        if (contentSubTab === 'dorpsplein') {
          // Dorpsplein: ProductManagement component loads its own data, so we don't need to load items here
          setItems([]);
          setLoading(false);
          return;
        } else if (contentSubTab === 'inspiratie') {
          // Inspiratie: load dishes/items without price (status PUBLISHED)
          const apiUrl = userId ? `/api/profile/dishes?userId=${userId}` : "/api/profile/dishes";
          const dishesRes = await safeFetch(apiUrl);
          if (dishesRes.ok) {
            const dishesData = await dishesRes.json();
            // Filter: only PUBLISHED items without price (or price === 0)
            // Also filter by category if role is specific (chef, garden, designer)
            // BUT: for overview role, show ALL inspiratie items (no category filter)
            let inspirationItems = (dishesData.items || []).filter((item: any) => 
              item.status === 'PUBLISHED' && (!item.priceCents || item.priceCents === 0)
            );
            
            // Filter by category for specific roles (but NOT for overview)
            if (role !== 'overview' && activeRole !== 'overview') {
              if (activeRole === 'chef') {
                inspirationItems = inspirationItems.filter((item: any) => item.category === 'CHEFF');
              } else if (activeRole === 'garden') {
                inspirationItems = inspirationItems.filter((item: any) => item.category === 'GROWN');
              } else if (activeRole === 'designer') {
                inspirationItems = inspirationItems.filter((item: any) => item.category === 'DESIGNER');
              }
            }
            
            setItems(inspirationItems);
          }
          setLoading(false);
          return;
        }
      } else if (showOnlyActive) {
        // For overview tab: only show active products (for sale)
        const productsUrl = userId ? `/api/seller/products?userId=${userId}` : "/api/seller/products";
        const res = await safeFetch(productsUrl);
        if (res.ok) {
          const data = await res.json();
          // Only show active products
          const activeProducts = data.products?.filter((product: any) => product.isActive) || [];
          const transformedItems = activeProducts.map((product: any) => ({
            id: product.id,
            title: product.title,
            description: product.description,
            status: "PUBLISHED",
            createdAt: product.createdAt,
            priceCents: product.priceCents,
            deliveryMode: product.delivery === "PICKUP" ? "PICKUP" : product.delivery === "DELIVERY" ? "DELIVERY" : "BOTH",
            place: "Nederland",
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
          }));
          setItems(transformedItems);
        }
      } else if (role && role !== 'overview') {
        // For "Mijn" tabs: show recipes and storage items (not for sale)
        // For public profiles: show only PUBLISHED items with price, filtered by category
        const apiUrl = userId ? `/api/profile/dishes?userId=${userId}` : "/api/profile/dishes";
        const dishesRes = await safeFetch(apiUrl);
        if (dishesRes.ok) {
          const dishesData = await dishesRes.json();
          if (dishesData.items && dishesData.items.length > 0) {
            let filteredItems = dishesData.items;
            
            // For public profiles: filter by status, category, and price
            if (isPublic) {
              // Only show PUBLISHED items with price (for sale items)
              filteredItems = filteredItems.filter((item: any) => 
                item.status === 'PUBLISHED' && item.priceCents && item.priceCents > 0
              );
              
              // Filter by category based on role
              if (activeRole === 'chef') {
                filteredItems = filteredItems.filter((item: any) => item.category === 'CHEFF');
              } else if (activeRole === 'garden') {
                filteredItems = filteredItems.filter((item: any) => item.category === 'GROWN');
              } else if (activeRole === 'designer') {
                filteredItems = filteredItems.filter((item: any) => item.category === 'DESIGNER');
              }
            }
            
            setItems(filteredItems);
          }
        }
      } else {
        // Default behavior: try dishes first, then products
        const apiUrl = userId ? `/api/profile/dishes?userId=${userId}` : "/api/profile/dishes";
        
        const dishesRes = await safeFetch(apiUrl);
        if (dishesRes.ok) {
          const dishesData = await dishesRes.json();
          if (dishesData.items && dishesData.items.length > 0) {
            let filteredItems = dishesData.items;
            
            // For public profiles: filter by status and price
            if (isPublic) {
              filteredItems = filteredItems.filter((item: any) => 
                item.status === 'PUBLISHED' && item.priceCents && item.priceCents > 0
              );
            }
            
            setItems(filteredItems);
            setLoading(false);
            return;
          }
        }
        
        // Fallback to products if no dishes found
        const productsUrl = userId ? `/api/seller/products?userId=${userId}` : "/api/seller/products";
        const res = await safeFetch(productsUrl);
        if (res.ok) {
          const data = await res.json();
          let transformedItems = data.products?.map((product: any) => ({
            id: product.id,
            title: product.title,
            description: product.description,
            status: product.isActive ? "PUBLISHED" : "PRIVATE",
            createdAt: product.createdAt,
            priceCents: product.priceCents,
            deliveryMode: product.delivery === "PICKUP" ? "PICKUP" : product.delivery === "DELIVERY" ? "DELIVERY" : "BOTH",
            place: "Nederland",
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
          
          // For public profiles: filter by status and price
          if (isPublic) {
            transformedItems = transformedItems.filter((item: any) => 
              item.status === 'PUBLISHED' && item.priceCents && item.priceCents > 0
            );
          }
          
          setItems(transformedItems);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Request was aborted') {
        // Component unmounted, ignore error
        return;
      }
      console.error('Error loading dishes:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [contentSubTab, activeRole, role, userId, isPublic, showOnlyActive]);

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const filesArr = Array.from(e.target.files || []).slice(0, 5 - uploadedFiles.length);
    if (filesArr.length === 0) return;
    
    const newFiles: UploadedFile[] = filesArr.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      isMain: uploadedFiles.length === 0 && index === 0 // First file is main by default
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles].slice(0, 5));
    e.target.value = ''; // Reset input
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

      // Upload all files in parallel using Promise.all for speed
      const uploadPromises = uploadedFiles.map(async (uploadedFile) => {
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
        
        const res = await safeFetch('/api/upload', { 
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
        
        return {
          url: data.url,
          isMain: uploadedFile.isMain,
          success: true
        };
      });
      
      const results = await Promise.all(uploadPromises);
      const uploadedUrls = results.filter(r => r.success);

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

      const res = await safeFetch("/api/profile/dishes", {
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
    const res = await safeFetch(`/api/products/${id}`, {
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
    
    const res = await safeFetch(`/api/products/${id}`, {
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

  // Filter items to only show published ones when in public mode
  const filteredItems = isPublic ? items.filter(item => item.status === 'PUBLISHED') : items;
  
  // Use role parameter if provided, otherwise use activeRole
  const currentRole = role || activeRole;

  const handleRecipeClick = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    setShowRecipeViewer(true);
  };

  const handleCloseRecipeViewer = () => {
    setShowRecipeViewer(false);
    setSelectedRecipeId(null);
  };

  return (
    <div className="space-y-6">
      {/* Message Display - only show in private mode */}
      {!isPublic && message && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs with sub-tabs - works for overview and category tabs when contentSubTab is set */}
      {!isPublic && contentSubTab && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brand mx-auto"></div>
              <p className="mt-2 text-gray-600">Laden...</p>
            </div>
          ) : contentSubTab === 'dorpsplein' ? (
            // Dorpsplein: show ProductManagement (products with price > 0)
            // For overview role, show ALL products (no category filter)
            <ProductManagement 
              onUpdate={() => {
                onStatsUpdate?.();
                load();
              }} 
              categoryFilter={
                role === 'overview' || activeRole === 'overview' ? null :
                activeRole === 'chef' ? 'CHEFF' : 
                activeRole === 'garden' ? 'GROWN' : 
                activeRole === 'designer' ? 'DESIGNER' : 
                null
              }
            />
          ) : (
            // Inspiratie: show managers or items based on activeRole
            (() => {
              // Hide add buttons when in overview mode with inspiratie sub-tab (we have a single "Toevoegen" button instead)
              const shouldHideAddButton = contentSubTab === 'inspiratie' && role === 'overview';
              
              // For specific roles, show the appropriate manager with built-in add buttons
              if (activeRole === 'chef' && (userSellerRoles.includes('chef') || activeRole === 'chef')) {
                return <RecipeManager isActive={true} userId={userId} isPublic={isPublic} hideAddButton={shouldHideAddButton} />;
              } else if (activeRole === 'garden' && (userSellerRoles.includes('garden') || activeRole === 'garden')) {
                return <GardenManager isActive={true} userId={userId} isPublic={isPublic} hideAddButton={shouldHideAddButton} />;
              } else if (activeRole === 'designer' && (userSellerRoles.includes('designer') || activeRole === 'designer')) {
                return <DesignManager isActive={true} userId={userId} isPublic={isPublic} hideAddButton={shouldHideAddButton} />;
              } else if (role === 'overview') {
                // For overview tab with inspiratie sub-tab, show ALL inspiratie items (not just one manager)
                // This shows all items: recepten, kweken, designs
                return items.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-12 h-12 mx-auto mb-4 text-gray-300">
                      <Plus className="w-full h-full" />
                    </div>
                    <p>Nog geen inspiratie items</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          // Check if this is a recipe (has ingredients/instructions but no price)
                          if (!item.priceCents && (item as any).ingredients && (item as any).instructions) {
                            handleRecipeClick(item.id);
                          } else {
                            // Navigate to product/inspiratie page
                            const itemType = item.category === 'CHEFF' ? 'recipe' : 
                                           item.category === 'GROWN' ? 'garden' : 
                                           item.category === 'DESIGNER' ? 'design' : 'product';
                            router.push(`/${itemType}/${item.id}`);
                          }
                        }}
                      >
                        {/* Item card content */}
                        <div className="relative aspect-video bg-gray-100">
                          {item.photos && item.photos.length > 0 ? (
                            <img 
                              src={item.photos[0].url} 
                              alt={item.title || 'Item'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Plus className="w-12 h-12" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
              
              // Fallback: show items without price (status PUBLISHED)
              return items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-4 text-gray-300">
                    <Plus className="w-full h-full" />
                  </div>
                  <p>Nog geen inspiratie items</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        // Check if this is a recipe (has ingredients/instructions but no price)
                        if (!item.priceCents && (item as any).ingredients && (item as any).instructions) {
                          handleRecipeClick(item.id);
                        } else {
                          window.location.href = `/dish/${item.id}`;
                        }
                      }}
                    >
                      {item.photos && item.photos.length > 0 && (
                        <div className="relative h-48">
                          <img
                            src={item.photos[0].url}
                            alt={item.title || 'Item'}
                            className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                          />
                          {/* Recipe indicator */}
                          {!item.priceCents && (item as any).ingredients && (
                            <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                              Recept
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {CATEGORIES[item.category || 'CHEFF']?.label || item.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString('nl-NL')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Tabs - only show in private mode when contentSubTab is NOT set - now always use subtabs (dorpsplein/inspiratie) */}
      {/* Removed "Live" tab - now all content goes through dorpsplein/inspiratie subtabs */}
      {/* This section is kept for backward compatibility but should not be used - always provide contentSubTab */}

      {/* Public view - show published items filtered by role */}
      {isPublic && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brand mx-auto"></div>
              <p className="mt-2 text-gray-600">Laden...</p>
            </div>
          ) : (() => {
            // Filter items by current role category
            const getRoleCategory = (role: string) => {
              if (role === 'chef') return 'CHEFF';
              if (role === 'garden') return 'GROWN';
              if (role === 'designer') return 'DESIGNER';
              return null;
            };
            
            const roleCategory = getRoleCategory(currentRole);
            const roleFilteredItems = roleCategory 
              ? filteredItems.filter(item => item.category === roleCategory)
              : filteredItems;
            
            return roleFilteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="w-12 h-12 mx-auto mb-4 text-gray-300">
                  <Plus className="w-full h-full" />
                </div>
                <p>Nog geen items gedeeld</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {roleFilteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    // Check if this is a recipe (has ingredients/instructions but no price)
                    if (!item.priceCents && (item as any).ingredients && (item as any).instructions) {
                      handleRecipeClick(item.id);
                    }
                  }}
                >
                  {item.photos && item.photos.length > 0 && (
                    <div 
                      className="relative h-48 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open image in modal
                        const event = new CustomEvent('openImageModal', { 
                          detail: { imageUrl: item.photos[0].url } 
                        });
                        window.dispatchEvent(event);
                      }}
                    >
                      <img
                        src={item.photos[0].url}
                        alt={item.title || 'Item'}
                        className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      />
                      {/* Recipe indicator - show for all users if it's a recipe */}
                      {!item.priceCents && (item as any).ingredients && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          Recept
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {item.priceCents ? (
                        <span className="font-semibold text-emerald-600">
                          €{(item.priceCents / 100).toFixed(2)}
                        </span>
                      ) : (item as any).ingredients ? (
                        <span className="text-sm text-emerald-600 font-medium">
                          {role === 'garden' ? 'Bekijk kweek' : role === 'designer' ? 'Bekijk design' : 'Bekijk recept'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {CATEGORIES[item.category || 'CHEFF']?.label || item.category}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('nl-NL')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            );
          })()}
        </div>
      )}

      {/* Recipe Viewer Modal */}
      {selectedRecipeId && (
        <RecipeViewer
          recipeId={selectedRecipeId}
          isOpen={showRecipeViewer}
          onClose={handleCloseRecipeViewer}
        />
      )}
    </div>
  );
}