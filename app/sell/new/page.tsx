"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import CategoryFormSelector from "@/components/products/CategoryFormSelector";

function HomeCheffProductNieuwPageContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams?.get('category');
  const [category, setCategory] = useState<'CHEFF' | 'GARDEN' | 'DESIGNER'>('CHEFF');
  
  // Determine category from URL param or template data
  useEffect(() => {
    if (categoryParam && (categoryParam === 'CHEFF' || categoryParam === 'GARDEN' || categoryParam === 'DESIGNER')) {
      setCategory(categoryParam);
      return;
    }
    
    // Try to get category from template data
    if (typeof window !== 'undefined') {
      const fromRecipe = searchParams?.get('fromRecipe') === 'true';
      const fromGarden = searchParams?.get('fromGarden') === 'true';
      const fromDesign = searchParams?.get('fromDesign') === 'true';
      
      if (fromGarden) {
        setCategory('GARDEN');
        return;
      }
      
      if (fromDesign) {
        setCategory('DESIGNER');
        return;
      }
      
      if (fromRecipe) {
        try {
          const recipeDataStr = sessionStorage.getItem('recipeToProductData') || localStorage.getItem('recipeToProductData');
          if (recipeDataStr) {
            const recipeData = JSON.parse(recipeDataStr);
            if (recipeData.category) {
              // Recipe category is typically 'CHEFF', so we keep CHEFF
              setCategory('CHEFF');
              return;
            }
          }
        } catch (error) {
          console.error('Error reading recipe data:', error);
        }
        setCategory('CHEFF');
        return;
      }
    }
    
    // Default to CHEFF
    setCategory('CHEFF');
  }, [categoryParam, searchParams]);

  const handleSave = (product: any) => {
    // Redirect to product page or profile
    if (product?.id) {
      window.location.href = `/product/${product.id}`;
    } else {
      window.location.href = '/profile?tab=producten';
    }
  };

  const handleCancel = () => {
    window.location.href = '/profile?tab=producten';
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nieuw Product</h1>
          <p className="mt-2 text-gray-600">Voeg een nieuw product toe aan het dorpsplein</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <CategoryFormSelector
            category={category}
            editMode={false}
            onSave={handleSave}
            onCancel={handleCancel}
            platform="dorpsplein"
            initialPhoto={typeof window !== 'undefined' ? (sessionStorage.getItem('productPhoto') || sessionStorage.getItem('quickAddPhoto') || localStorage.getItem('pendingProductPhoto') || undefined) : undefined}
          />
        </div>
      </div>
    </main>
  );
}

export default function HomeCheffProductNieuwPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Laden...</div>
        </div>
      </main>
    }>
      <HomeCheffProductNieuwPageContent />
    </Suspense>
  );
}




