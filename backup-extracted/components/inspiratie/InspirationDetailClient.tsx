'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Star, Eye, Heart, MessageCircle, Share2, Calendar, User,
  Download, Printer, ChefHat, Utensils, Flame, Clock, Users, BookOpen,
  Sprout, Palette, Ruler, Brush, Scissors, Sparkles, ShoppingBag, Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SafeImage from '@/components/ui/SafeImage';
import PhotoCarousel from '@/components/ui/PhotoCarousel';
import PropsButton from '@/components/props/PropsButton';
import ReviewForm from '@/components/reviews/ReviewForm';
import ReviewItem from '@/components/reviews/ReviewItem';
import { getDisplayName } from '@/lib/displayName';
import { useAnalytics } from '@/hooks/useAnalytics';
import BackButton from '@/components/navigation/BackButton';

interface InspirationDetailProps {
  inspiration: {
    id: string;
    title: string | null;
    description: string | null;
    category: string | null;
    subcategory: string | null;
    ingredients?: string[];
    instructions?: string[];
    prepTime?: number | null;
    servings?: number | null;
    difficulty?: string | null;
    tags?: string[];
    materials?: string[];
    dimensions?: string | null;
    notes?: string | null;
    plantType?: string | null;
    plantDate?: string | null;
    harvestDate?: string | null;
    growthDuration?: number | null;
    sunlight?: string | null;
    waterNeeds?: string | null;
    location?: string | null;
    soilType?: string | null;
    createdAt: string;
    photos: Array<{
      id: string;
      url: string;
      isMain: boolean;
      idx: number;
    }>;
    stepPhotos?: Array<{
      id: string;
      url: string;
      stepNumber: number;
      description?: string | null;
      idx: number;
    }>;
    growthPhotos?: Array<{
      id: string;
      url: string;
      phaseNumber: number;
      description?: string | null;
      idx: number;
    }>;
    user: {
      id: string;
      name: string | null;
      username: string | null;
      profileImage: string | null;
      displayFullName?: boolean;
      displayNameOption?: string;
    };
  };
  productId?: string | null;
}

export default function InspirationDetailClient({ inspiration, productId: initialProductId }: InspirationDetailProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { track } = useAnalytics();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [productId, setProductId] = useState<string | null>(initialProductId || null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // Debug: Log what we receive
  useEffect(() => {
    console.log('🎨 InspirationDetailClient - Received Data:', {
      id: inspiration.id,
      title: inspiration.title,
      category: inspiration.category,
      hasIngredients: !!inspiration.ingredients?.length,
      ingredientsCount: inspiration.ingredients?.length || 0,
      ingredients: inspiration.ingredients,
      hasInstructions: !!inspiration.instructions?.length,
      instructionsCount: inspiration.instructions?.length || 0,
      instructions: inspiration.instructions,
      hasTags: !!inspiration.tags?.length,
      tagsCount: inspiration.tags?.length || 0,
      tags: inspiration.tags,
      hasMaterials: !!inspiration.materials?.length,
      materialsCount: inspiration.materials?.length || 0,
      materials: inspiration.materials,
      hasStepPhotos: !!inspiration.stepPhotos?.length,
      stepPhotosCount: inspiration.stepPhotos?.length || 0,
      stepPhotos: inspiration.stepPhotos,
      hasGrowthPhotos: !!inspiration.growthPhotos?.length,
      growthPhotosCount: inspiration.growthPhotos?.length || 0,
      growthPhotos: inspiration.growthPhotos,
      plantType: inspiration.plantType,
      prepTime: inspiration.prepTime,
      servings: inspiration.servings,
      difficulty: inspiration.difficulty,
      isRecipe: inspiration.category === 'CHEFF',
      isGarden: inspiration.category === 'GROWN',
      isDesign: inspiration.category === 'DESIGNER'
    });
  }, [inspiration.id, inspiration.category, inspiration.ingredients, inspiration.instructions, inspiration.tags, inspiration.materials, inspiration.stepPhotos, inspiration.growthPhotos]);

  // Track view and load reviews
  useEffect(() => {
    track('VIEW', 'DISH', inspiration.id, {
      title: inspiration.title,
      category: inspiration.category,
      author: inspiration.user.name || inspiration.user.username
    });
    
    // Load reviews
    loadReviews();
    
    // Check if there's a product for this inspiration
    checkForProduct();
  }, [inspiration.id, track]);

  const checkForProduct = async () => {
    if (!inspiration.title || !inspiration.user.id) return;
    
    setIsLoadingProduct(true);
    try {
      // Try to find product by title and userId
      const response = await fetch(`/api/products/find-by-dish?dishId=${inspiration.id}&title=${encodeURIComponent(inspiration.title)}&userId=${inspiration.user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.productId) {
          setProductId(data.productId);
        }
      }
    } catch (error) {
      console.error('Failed to check for product:', error);
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/inspiratie/${inspiration.id}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string, title?: string, images?: File[]) => {
    if (!session?.user) {
      router.push('/login');
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await fetch(`/api/inspiratie/${inspiration.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment,
          title,
          reviewType: 'INSPIRATION'
        })
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews(prev => [newReview, ...prev]);
        setShowReviewForm(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Er ging iets mis bij het plaatsen van je review');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      alert('Er ging iets mis bij het plaatsen van je review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleResponseSubmit = async (reviewId: string, comment: string) => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment })
      });

      if (response.ok) {
        const newResponse = await response.json();
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, responses: [...review.responses, newResponse] }
            : review
        ));
      }
    } catch (error) {
      console.error('Response submission error:', error);
    }
  };

  const handlePrint = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownloadPDF = () => {
    setShowPrintView(true);
    setTimeout(() => {
      alert('💡 In het print venster: kies "Opslaan als PDF" als bestemming om te downloaden!');
      setTimeout(() => {
        window.print();
      }, 300);
    }, 100);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: inspiration.title || 'Inspiratie',
          text: inspiration.description || '',
          url: url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link gekopieerd naar klembord!');
    }
  };

  const mainPhoto = inspiration.photos.find(p => p.isMain) || inspiration.photos[0];
  const otherPhotos = inspiration.photos.filter(p => !p.isMain && p !== mainPhoto);
  
  // Prepare photos for PhotoCarousel
  const allPhotos = inspiration.photos.map(photo => ({
    id: photo.id,
    fileUrl: photo.url,
    sortOrder: photo.isMain ? 0 : photo.idx || 999
  })).sort((a, b) => a.sortOrder - b.sortOrder);
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  // Group step photos by step number
  type StepPhoto = NonNullable<typeof inspiration.stepPhotos>[0];
  const stepPhotosMap = (inspiration.stepPhotos || []).reduce((acc, photo) => {
    if (!acc[photo.stepNumber]) {
      acc[photo.stepNumber] = [];
    }
    acc[photo.stepNumber]!.push(photo);
    return acc;
  }, {} as Record<number, StepPhoto[]>);

  // Group growth photos by phase
  type GrowthPhoto = NonNullable<typeof inspiration.growthPhotos>[0];
  const growthPhases = (inspiration.growthPhotos || []).reduce((acc, photo) => {
    if (!acc[photo.phaseNumber]) {
      acc[photo.phaseNumber] = [];
    }
    acc[photo.phaseNumber]!.push(photo);
    return acc;
  }, {} as Record<number, GrowthPhoto[]>);

  const sortedPhases = Object.keys(growthPhases).sort((a, b) => Number(a) - Number(b));
  const PHASE_NAMES = [
    '🌱 Zaaien/Planten',
    '🌿 Kiemen',
    '🌾 Groeien',
    '🌺 Bloeien',
    '🍅 Oogsten'
  ];

  const difficultyLabels: Record<string, string> = {
    EASY: 'Makkelijk',
    MEDIUM: 'Gemiddeld',
    HARD: 'Moeilijk'
  };

  const isRecipe = inspiration.category === 'CHEFF';
  const isGarden = inspiration.category === 'GROWN';
  const isDesign = inspiration.category === 'DESIGNER';

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 12mm;
        }
        
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body * {
            visibility: hidden;
          }
          
          #printable-content,
          #printable-content * {
            visibility: visible;
          }
          
          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-avoid-break {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-50">
        {/* Header - No print */}
        <div className="no-print bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton 
                fallbackUrl="/inspiratie"
                label="Terug naar Inspiratie"
                variant="minimal"
              />
              {/* Inspiration Badge - Clear indicator this is inspiration page */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-2 border-purple-300 shadow-lg">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold text-sm">✨ Inspiratie Pagina</span>
              </div>
              {/* Link to Product Page if available */}
              {productId && (
                <Link
                  href={`/product/${productId}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-2 border-emerald-300 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="font-bold text-sm">🛒 Bekijk als Product</span>
                </Link>
              )}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delen</span>
              </button>
              <button
                onClick={() => setShowPrintView(!showPrintView)}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">{showPrintView ? 'Sluit' : 'Print/PDF'} weergave</span>
              </button>
              {showPrintView && (
                <>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download PDF</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-secondary-600 to-secondary-700 text-white rounded-lg hover:from-secondary-700 hover:to-secondary-800 transition-all shadow-md hover:shadow-lg"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Printen</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* TEST: Always show this section to verify rendering */}
          <div className="bg-yellow-200 p-4 mb-4 border-4 border-yellow-600">
            <p className="font-bold text-yellow-900">TEST: Recipe Content Section</p>
            <p>isRecipe: {String(isRecipe)}</p>
            <p>category: {inspiration.category}</p>
            <p>hasIngredients: {String(!!inspiration.ingredients)}</p>
            <p>ingredients.length: {inspiration.ingredients?.length || 0}</p>
            <p>hasInstructions: {String(!!inspiration.instructions)}</p>
            <p>instructions.length: {inspiration.instructions?.length || 0}</p>
          </div>
          
          {/* Image Gallery - Slideshow/Carousel (Default View) */}
          {!showPrintView && (
            <div className="relative mx-auto w-full max-w-4xl px-0 sm:px-4 lg:px-6 mb-8">
              {/* Photo Carousel */}
              {allPhotos && allPhotos.length > 0 ? (
                <div className="relative">
                  <PhotoCarousel
                    photos={allPhotos}
                    className="rounded-3xl overflow-hidden shadow-2xl"
                    showThumbnails={true}
                    autoPlay={false}
                  />
                  
                  {/* Inspiration Badge - Overlay on carousel */}
                  <div className="absolute top-6 left-6 z-20 pointer-events-none">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-2 border-white/30 backdrop-blur-sm shadow-lg pointer-events-auto">
                      <Sparkles className="w-5 h-5" />
                      <span className="font-bold text-sm">✨ Inspiratie</span>
                    </div>
                  </div>

                  {/* Category Badge - Overlay on carousel */}
                  {inspiration.category && (
                    <div className="absolute top-6 right-6 z-20 pointer-events-none">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 backdrop-blur-sm shadow-lg pointer-events-auto ${
                        isRecipe ? 'bg-orange-100 text-orange-800 border-orange-200' :
                        isGarden ? 'bg-green-100 text-green-800 border-green-200' :
                        isDesign ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {isRecipe && <ChefHat className="w-5 h-5" />}
                        {isGarden && <Sprout className="w-5 h-5" />}
                        {isDesign && <Palette className="w-5 h-5" />}
                        <span className="font-bold text-sm">
                          {isRecipe ? 'Recept' : isGarden ? 'Kweken' : isDesign ? 'Design' : 'Inspiratie'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[5/3] lg:max-h-[520px] rounded-3xl overflow-hidden bg-white shadow-2xl flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <ChefHat className="w-32 h-32 text-gray-300" />
                </div>
              )}
            </div>
          )}

          {/* Print View - Only shown when showPrintView is true */}
          {showPrintView && (
            <div id="printable-content">
              {/* Title Card */}
              <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden mb-8 print-avoid-break border-4 border-primary-800 relative">
                <div className="p-8 sm:p-12">
                  <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-wide text-primary-900">
                    {inspiration.title || 'Inspiratie'}
                  </h1>
                  
                  {inspiration.subcategory && (
                    <p className="text-center text-xl sm:text-2xl mb-6 font-light text-primary-700">
                      {inspiration.subcategory}
                    </p>
                  )}

                  {/* Meta Info */}
                  {isRecipe && (inspiration.prepTime || inspiration.servings || inspiration.difficulty) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mt-8">
                      {inspiration.prepTime && inspiration.prepTime > 0 && (
                        <div className="border-2 border-amber-200 rounded-lg p-4 bg-gradient-to-b from-white to-amber-50">
                          <div className="text-xs uppercase tracking-wider text-amber-600 mb-2 font-semibold">Bereidingstijd</div>
                          <div className="flex items-center justify-center space-x-2">
                            <Clock className="w-5 h-5 text-amber-600" />
                            <span className="text-lg font-bold text-gray-800">{inspiration.prepTime} min</span>
                          </div>
                        </div>
                      )}
                      
                      {inspiration.servings && inspiration.servings > 0 && (
                        <div className="border-2 border-amber-200 rounded-lg p-4 bg-gradient-to-b from-white to-amber-50">
                          <div className="text-xs uppercase tracking-wider text-amber-600 mb-2 font-semibold">Porties</div>
                          <div className="flex items-center justify-center space-x-2">
                            <Users className="w-5 h-5 text-amber-600" />
                            <span className="text-lg font-bold text-gray-800">{inspiration.servings} personen</span>
                          </div>
                        </div>
                      )}

                      {inspiration.difficulty && (
                        <div className="border-2 border-amber-200 rounded-lg p-4 bg-gradient-to-b from-white to-amber-50">
                          <div className="text-xs uppercase tracking-wider text-amber-600 mb-2 font-semibold">Moeilijkheidsgraad</div>
                          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                            inspiration.difficulty === 'EASY' ? 'bg-green-100 text-green-800 border-2 border-green-400' :
                            inspiration.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400' :
                            'bg-red-100 text-red-800 border-2 border-red-400'
                          }`}>
                            {difficultyLabels[inspiration.difficulty] || inspiration.difficulty}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Author Info */}
                  <div className="mt-8 pt-6 border-t-2 border-gray-200">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="text-xs uppercase tracking-wider text-gray-600 font-semibold">Gemaakt door</div>
                      {inspiration.user.profileImage ? (
                        <Image
                          src={inspiration.user.profileImage}
                          alt={getDisplayName(inspiration.user)}
                          width={40}
                          height={40}
                          className="rounded-full border-2 border-gray-500"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center border-2 border-gray-500">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                      <span className="font-bold text-gray-800">
                        {getDisplayName(inspiration.user)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Featured Image for Print */}
              {mainPhoto && (
                <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden mb-8 print-avoid-break border-4 border-primary-700 relative">
                  <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                    <Image
                      src={mainPhoto.url}
                      alt={inspiration.title || 'Inspiratie foto'}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 90vw"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {inspiration.description && (
            <div className="bg-white rounded-none sm:rounded-2xl shadow-xl p-8 sm:p-10 mb-8 print-avoid-break border-2 border-gray-300">
              <div className="flex items-center mb-6">
                <div className="h-px bg-gray-300 flex-grow"></div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 px-4">
                  Over dit {isRecipe ? 'Recept' : isGarden ? 'Kweekproject' : isDesign ? 'Design' : 'Item'}
                </h2>
                <div className="h-px bg-gray-300 flex-grow"></div>
              </div>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-justify text-lg">
                  {inspiration.description}
                </p>
              </div>
            </div>
          )}

          {/* Recipe Content */}
          {isRecipe && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Ingredients */}
              {inspiration.ingredients && inspiration.ingredients.length > 0 && (
                <div className="bg-white rounded-none sm:rounded-2xl shadow-xl p-8 print-avoid-break border-2 border-amber-300">
                  <div className="flex items-center mb-6">
                    <div className="h-px bg-amber-300 flex-grow"></div>
                    <h2 className="text-2xl font-bold text-amber-900 px-4 flex items-center">
                      <Utensils className="w-6 h-6 mr-2 text-amber-600" />
                      Ingrediënten
                    </h2>
                    <div className="h-px bg-amber-300 flex-grow"></div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
                    <ul className="space-y-3">
                      {inspiration.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start gap-3 group">
                          <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 group-hover:bg-amber-600 transition-colors">
                            {index + 1}
                          </span>
                          <span className="text-gray-800 text-lg leading-relaxed">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {inspiration.instructions && inspiration.instructions.length > 0 && (
                <div className="bg-white rounded-none sm:rounded-2xl shadow-xl p-8 print-avoid-break border-2 border-amber-300">
                  <div className="flex items-center mb-6">
                    <div className="h-px bg-amber-300 flex-grow"></div>
                    <h2 className="text-2xl font-bold text-amber-900 px-4 flex items-center">
                      <Flame className="w-6 h-6 mr-2 text-orange-600" />
                      Bereidingswijze
                    </h2>
                    <div className="h-px bg-amber-300 flex-grow"></div>
                  </div>
                  
                  <div className="space-y-6">
                    {inspiration.instructions.map((instruction, index) => {
                      const stepNumber = index + 1;
                      const currentStepPhotos = stepPhotosMap[stepNumber] || [];
                      
                      return (
                        <div key={index} className="bg-gradient-to-br from-white to-amber-50 border-2 border-amber-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                              {stepNumber}
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-800 leading-relaxed text-lg mb-3">{instruction}</p>
                              
                              {/* Step Photos */}
                              {currentStepPhotos.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                  {currentStepPhotos.map((photo) => (
                                    <div key={photo.id} className="relative group">
                                      <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-amber-300 shadow-md">
                                        <Image
                                          src={photo.url}
                                          alt={`Stap ${stepNumber} foto`}
                                          fill
                                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
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

          {/* Additional Photos */}
          {otherPhotos.length > 0 && (
            <div className="bg-white rounded-none sm:rounded-2xl shadow-xl p-6 sm:p-8 mb-6 print:mb-4 print:p-5 print-avoid-break border-2 border-gray-300">
              <div className="flex items-center mb-5 print:mb-4">
                <div className="h-px bg-gray-300 flex-grow"></div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 px-4 print:text-xl">
                  📸 Foto's
                </h2>
                <div className="h-px bg-gray-300 flex-grow"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:gap-3">
                {otherPhotos.map((photo, index) => (
                  <div 
                    key={photo.id} 
                    className="relative group bg-gray-50 p-2 border-2 border-gray-300 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-105 print:p-1.5"
                  >
                    <div className="relative w-full h-40 bg-white print:h-32">
                      <Image
                        src={photo.url}
                        alt={`Foto ${index + 1}`}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROWN Category - Growth Photos */}
          {isGarden && sortedPhases.length > 0 && (
            <div className="bg-white rounded-none sm:rounded-2xl shadow-xl p-8 mb-8 print-avoid-break border-2 border-green-300">
              <div className="flex items-center mb-6">
                <div className="h-px bg-green-300 flex-grow"></div>
                <h2 className="text-2xl font-bold text-green-900 px-4 flex items-center">
                  <Sprout className="w-6 h-6 mr-2 text-green-600" />
                  Groeifases
                </h2>
                <div className="h-px bg-green-300 flex-grow"></div>
              </div>
              
              <div className="space-y-8">
                {sortedPhases.map((phaseKey) => {
                  const phaseNumber = Number(phaseKey);
                  const phasePhotos = growthPhases[phaseNumber] || [];
                  return (
                    <div key={phaseNumber} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                      <h3 className="text-xl font-bold text-green-900 mb-4">
                        {PHASE_NAMES[phaseNumber - 1] || `Fase ${phaseNumber}`}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {phasePhotos.map((photo) => (
                          <div key={photo.id} className="relative group">
                            <div className="relative w-full h-40 rounded-lg overflow-hidden border-2 border-green-300 shadow-md">
                              <Image
                                src={photo.url}
                                alt={photo.description || `Fase ${phaseNumber} foto`}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                sizes="(max-width: 768px) 50vw, 33vw"
                              />
                            </div>
                            {photo.description && (
                              <p className="text-sm text-gray-600 mt-2">{photo.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GROWN Category - Plant Info */}
          {isGarden && (inspiration.plantType || inspiration.plantDate || inspiration.harvestDate || inspiration.growthDuration || inspiration.sunlight || inspiration.waterNeeds || inspiration.location || inspiration.soilType) && (
            <div className="bg-white rounded-none sm:rounded-2xl shadow-xl p-8 mb-8 print-avoid-break border-2 border-green-300">
              <div className="flex items-center mb-6">
                <div className="h-px bg-green-300 flex-grow"></div>
                <h2 className="text-2xl font-bold text-green-900 px-4 flex items-center">
                  <Sprout className="w-6 h-6 mr-2 text-green-600" />
                  Plant Informatie
                </h2>
                <div className="h-px bg-green-300 flex-grow"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {inspiration.plantType && (
                  <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <div className="text-sm font-semibold text-green-700 mb-1">Plant Type</div>
                    <div className="text-lg font-bold text-gray-800">{inspiration.plantType}</div>
                  </div>
                )}
                {inspiration.plantDate && (
                  <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <div className="text-sm font-semibold text-green-700 mb-1">Plant Datum</div>
                    <div className="text-lg font-bold text-gray-800">{inspiration.plantDate}</div>
                  </div>
                )}
                {inspiration.harvestDate && (
                  <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <div className="text-sm font-semibold text-green-700 mb-1">Oogst Datum</div>
                    <div className="text-lg font-bold text-gray-800">{inspiration.harvestDate}</div>
                  </div>
                )}
                {inspiration.growthDuration && (
                  <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <div className="text-sm font-semibold text-green-700 mb-1">Groeiduur</div>
                    <div className="text-lg font-bold text-gray-800">{inspiration.growthDuration} dagen</div>
                  </div>
                )}
                {inspiration.sunlight && (
                  <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <div className="text-sm font-semibold text-green-700 mb-1">Zonlicht</div>
                    <div className="text-lg font-bold text-gray-800">{inspiration.sunlight}</div>
                  </div>
                )}
                {inspiration.waterNeeds && (
                  <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <div className="text-sm font-semibold text-green-700 mb-1">Waterbehoefte</div>
                    <div className="text-lg font-bold text-gray-800">{inspiration.waterNeeds}</div>
                  </div>
                )}
                {inspiration.location && (
                  <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <div className="text-sm font-semibold text-green-700 mb-1">Locatie</div>
                    <div className="text-lg font-bold text-gray-800">{inspiration.location}</div>
                  </div>
                )}
                {inspiration.soilType && (
                  <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <div className="text-sm font-semibold text-green-700 mb-1">Grondsoort</div>
                    <div className="text-lg font-bold text-gray-800">{inspiration.soilType}</div>
                  </div>
                )}
              </div>
              {inspiration.notes && (
                <div className="mt-6 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                  <div className="text-sm font-semibold text-green-700 mb-2">Notities</div>
                  <div className="text-gray-800 whitespace-pre-wrap">{inspiration.notes}</div>
                </div>
              )}
            </div>
          )}

          {/* DESIGNER Category - Materials */}
          {isDesign && inspiration.materials && inspiration.materials.length > 0 && (
            <div className="bg-white rounded-none sm:rounded-2xl shadow-xl p-8 mb-8 print-avoid-break border-2 border-purple-300">
              <div className="flex items-center mb-6">
                <div className="h-px bg-purple-300 flex-grow"></div>
                <h2 className="text-2xl font-bold text-purple-900 px-4 flex items-center">
                  <Palette className="w-6 h-6 mr-2 text-purple-600" />
                  Materialen
                </h2>
                <div className="h-px bg-purple-300 flex-grow"></div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <ul className="space-y-3">
                  {inspiration.materials.map((material, index) => (
                    <li key={index} className="flex items-start gap-3 group">
                      <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 group-hover:bg-purple-600 transition-colors">
                        {index + 1}
                      </span>
                      <span className="text-gray-800 text-lg leading-relaxed">{material}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {inspiration.dimensions && (
                <div className="mt-6 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                  <div className="text-sm font-semibold text-purple-700 mb-1">Afmetingen</div>
                  <div className="text-lg font-bold text-gray-800">{inspiration.dimensions}</div>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {inspiration.tags && inspiration.tags.length > 0 && (
            <div className="bg-white rounded-none sm:rounded-2xl shadow-xl p-8 sm:p-10 mb-8 print-avoid-break border-2 border-gray-300">
              <div className="flex items-center mb-8">
                <div className="h-px bg-gray-300 flex-grow"></div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 px-4 flex items-center">
                  <BookOpen className="w-7 h-7 mr-3 text-gray-600" />
                  Kenmerken
                </h2>
                <div className="h-px bg-gray-300 flex-grow"></div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {inspiration.tags.map((tag, index) => {
                  // If there's a productId, make tags clickable to link to product page
                  if (productId) {
                    return (
                      <Link
                        key={index}
                        href={`/product/${productId}`}
                        className="inline-flex items-center px-5 py-2.5 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 rounded-full text-sm font-bold border-2 border-gray-400 shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                      >
                        <span className="mr-2">📌</span>
                        {tag}
                      </Link>
                    );
                  }
                  // Otherwise, just display as non-clickable
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center px-5 py-2.5 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 rounded-full text-sm font-bold border-2 border-gray-400 shadow-md hover:shadow-lg transition-all hover:scale-105"
                    >
                      <span className="mr-2">📌</span>
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          </div>

          {/* Links Section - All connections and actions */}
          {!showPrintView && (
            <div className="mt-8 bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
              <div className="flex items-center mb-6">
                <div className="h-px bg-gray-300 flex-grow"></div>
                <h2 className="text-2xl font-bold text-gray-900 px-4 flex items-center">
                  <LinkIcon className="w-6 h-6 mr-2 text-primary-600" />
                  Koppelingen & Acties
                </h2>
                <div className="h-px bg-gray-300 flex-grow"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Link to Product Page */}
                {productId && (
                  <Link
                    href={`/product/${productId}`}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-lg transition-all group"
                  >
                    <div className="p-2 bg-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Bekijk als Product</div>
                      <div className="text-sm text-gray-600">Koop dit item</div>
                    </div>
                  </Link>
                )}
                
                {/* Link to User Profile */}
                <Link
                  href={`/user/${inspiration.user.username || inspiration.user.id}`}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all group"
                >
                  <div className="p-2 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Bekijk Profiel</div>
                    <div className="text-sm text-gray-600">{getDisplayName(inspiration.user)}</div>
                  </div>
                </Link>
                
                {/* Download PDF Button */}
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all group"
                >
                  <div className="p-2 bg-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Download PDF</div>
                    <div className="text-sm text-gray-600">Bewaar offline</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Reviews Section - Always visible on normal view */}
          {!showPrintView && (
            <div className="mt-8 bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Reviews ({reviews.length})
                    {averageRating > 0 && (
                      <span className="ml-2 text-yellow-500">
                        {averageRating.toFixed(1)} ⭐
                      </span>
                    )}
                  </h2>
                  {session?.user && (
                    <button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      {showReviewForm ? 'Annuleren' : 'Review schrijven'}
                    </button>
                  )}
                </div>
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <div className="p-6 border-b bg-gray-50">
                  <ReviewForm
                    productId={inspiration.id}
                    onSubmit={async (reviewData) => {
                      await handleReviewSubmit(
                        reviewData.rating,
                        reviewData.comment,
                        reviewData.title,
                        [] // Images not implemented yet for inspiration reviews
                      );
                    }}
                    onCancel={() => setShowReviewForm(false)}
                    isSubmitting={submittingReview}
                  />
                </div>
              )}

              {/* Reviews List */}
              <div className="divide-y">
                {reviews.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nog geen reviews. Wees de eerste!</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <ReviewItem
                      key={review.id}
                      review={review}
                      onResponseSubmit={handleResponseSubmit}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
