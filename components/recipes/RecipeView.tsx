"use client";

import { useState } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { useRouter } from 'next/navigation';
import { 
  Clock, Users, ChefHat, ArrowLeft, Printer,
  Share2, Edit3, Utensils, Flame, Timer,
  BookOpen, Heart, Star, Download, MessageCircle
} from 'lucide-react';
import Image from 'next/image';
import BackButton from '@/components/navigation/BackButton';
import StartChatButton from '@/components/chat/StartChatButton';
import { useTranslation } from '@/hooks/useTranslation';
import { useAffiliateLink } from '@/hooks/useAffiliateLink';

type RecipePhoto = {
  id: string;
  url: string;
  isMain?: boolean;
  stepNumber?: number;
  description?: string | null;
  idx: number;
};

type RecipeData = {
  id: string;
  title: string | null;
  description: string | null;
  ingredients: string[];
  instructions: string[];
  prepTime: number | null;
  servings: number | null;
  difficulty: string | null;
  category: string | null;
  tags: string[];
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  photos: RecipePhoto[];
  stepPhotos: RecipePhoto[];
  video: {
    url: string;
    thumbnail?: string | null;
    duration?: number | null;
  } | null;
  user: {
    id: string;
    username: string | null;
    name: string | null;
    profileImage: string | null;
  };
};

type RecipeViewProps = {
  recipe: RecipeData;
  isOwner: boolean;
  ownerPermissions?: {
    downloadPermission: 'EVERYONE' | 'FANS_ONLY' | 'FAN_OF_ONLY' | 'ASK_PERMISSION' | 'NOBODY';
    printPermission: 'EVERYONE' | 'FANS_ONLY' | 'FAN_OF_ONLY' | 'ASK_PERMISSION' | 'NOBODY';
  };
  currentUser?: {
    id?: string;
    isFanOfOwner?: boolean;
  };
};

export default function RecipeView({ recipe, isOwner, ownerPermissions, currentUser }: RecipeViewProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { addAffiliateToUrl, isAffiliate } = useAffiliateLink();

  // Check download permission
  const canDownload = () => {
    if (isOwner) return true; // Owner can always download
    if (!ownerPermissions || !currentUser?.id) return false;
    
    const permission = ownerPermissions.downloadPermission || 'EVERYONE';
    if (permission === 'EVERYONE') return true;
    if (permission === 'NOBODY') return false;
    if (permission === 'FANS_ONLY' || permission === 'FAN_OF_ONLY') {
      return currentUser.isFanOfOwner === true;
    }
    if (permission === 'ASK_PERMISSION') return false; // Would need to request permission
    return false;
  };

  // Check print permission
  const canPrint = () => {
    if (isOwner) return true; // Owner can always print
    if (!ownerPermissions || !currentUser?.id) return false;
    
    const permission = ownerPermissions.printPermission || 'EVERYONE';
    if (permission === 'EVERYONE') return true;
    if (permission === 'NOBODY') return false;
    if (permission === 'FANS_ONLY' || permission === 'FAN_OF_ONLY') {
      return currentUser.isFanOfOwner === true;
    }
    if (permission === 'ASK_PERMISSION') return false; // Would need to request permission
    return false;
  };

  const mainPhoto = recipe.photos.find(p => p.isMain) || recipe.photos[0];
  const otherPhotos = recipe.photos.filter(p => !p.isMain);

  // Group step photos by step number
  const stepPhotosMap = recipe.stepPhotos.reduce((acc, photo) => {
    if (!acc[photo.stepNumber!]) {
      acc[photo.stepNumber!] = [];
    }
    acc[photo.stepNumber!].push(photo);
    return acc;
  }, {} as Record<number, RecipePhoto[]>);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Trigger print dialog with a hint to save as PDF
    alert(t('common.printDialogHint'));
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleShare = async () => {
    const baseUrl = window.location.href;
    const url = addAffiliateToUrl(baseUrl);
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title || 'Recept',
          text: recipe.description || '',
          url: url,
        });
        // Show notification if affiliate
        if (isAffiliate) {
          setTimeout(() => {
            alert('Je affiliate link is automatisch meegestuurd!');
          }, 500);
        }
      } catch (err) {

      }
    } else {
      navigator.clipboard.writeText(url);
      if (isAffiliate) {
        alert('Link gekopieerd met je affiliate code!');
      } else {
        alert(t('errors.linkCopied'));
      }
    }
  };

  const difficultyLabels: Record<string, string> = {
    EASY: 'Makkelijk',
    MEDIUM: 'Gemiddeld',
    HARD: 'Moeilijk'
  };

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 15mm;
        }
        
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body * {
            visibility: hidden;
          }
          
          #printable-recipe,
          #printable-recipe * {
            visibility: visible;
          }
          
          #printable-recipe {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-page-break {
            page-break-before: always;
            margin-top: 0;
            padding-top: 0;
          }
          
          .print-avoid-break {
            page-break-inside: avoid;
          }
          
          .culinary-border {
            border: 3px double #006D52 !important;
          }
        }
        
        /* Vintage culinary styling */
        .culinary-frame {
          position: relative;
          background: linear-gradient(to bottom, #fffbf5, #fef8f0);
        }
        
        .culinary-corner {
          position: absolute;
          width: 40px;
          height: 40px;
          border-color: #006D52;
        }
        
        .culinary-corner-tl {
          top: 0;
          left: 0;
          border-top: 3px double currentColor;
          border-left: 3px double currentColor;
        }
        
        .culinary-corner-tr {
          top: 0;
          right: 0;
          border-top: 3px double currentColor;
          border-right: 3px double currentColor;
        }
        
        .culinary-corner-bl {
          bottom: 0;
          left: 0;
          border-bottom: 3px double currentColor;
          border-left: 3px double currentColor;
        }
        
        .culinary-corner-br {
          bottom: 0;
          right: 0;
          border-bottom: 3px double currentColor;
          border-right: 3px double currentColor;
        }
        
        /* Elegant cookbook typography */
        .cookbook-title {
          font-family: 'Georgia', 'Garamond', serif;
          letter-spacing: 0.05em;
        }
        
        .cookbook-subtitle {
          font-family: 'Georgia', 'Garamond', serif;
          font-style: italic;
        }
        
        /* Vintage paper texture */
        .vintage-paper {
          background-image: 
            repeating-linear-gradient(
              0deg,
              rgba(0, 109, 82, 0.03) 0px,
              rgba(0, 109, 82, 0.03) 1px,
              transparent 1px,
              transparent 2px
            );
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-50">
        {/* Header - No print */}
        <div className="no-print bg-white border-b border-primary-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <BackButton 
              fallbackUrl="/profile?tab=recipes"
              label={t('common.backToKitchen')}
              variant="minimal"
              className="text-primary-700 hover:text-primary-900"
            />

            <div className="flex items-center space-x-2 sm:space-x-3">
              {isOwner && (
                <button
                  onClick={() => router.push(`/profile?tab=recipes&edit=${recipe.id}`)}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm text-primary-700 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition-all hover:shadow-md"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.edit')}</span>
                </button>
              )}
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md relative group"
                title={isAffiliate ? "Deel dit recept - je affiliate link wordt automatisch meegestuurd" : t('common.share')}
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('common.share')}</span>
                {isAffiliate && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" title="Affiliate link wordt meegestuurd"></span>
                )}
              </button>
              {canDownload() && (
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.pdf')}</span>
                </button>
              )}
              {canPrint() && (
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-secondary-600 to-secondary-700 text-white rounded-lg hover:from-secondary-700 hover:to-secondary-800 transition-all shadow-md hover:shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Printen</span>
                </button>
              )}
              {!isOwner && (
                <StartChatButton
                  sellerId={recipe.user.id}
                  sellerName={recipe.user.name || getDisplayName(recipe.user)}
                  productId={recipe.id}
                  showSuccessMessage={true}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg"
                />
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Printable */}
        <div id="printable-recipe" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Vintage Cookbook Header Card */}
          <div className="culinary-frame vintage-paper bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden mb-8 print-avoid-break border-4 border-primary-800 culinary-border relative">
            {/* Decorative corners */}
            <div className="culinary-corner culinary-corner-tl"></div>
            <div className="culinary-corner culinary-corner-tr"></div>
            <div className="culinary-corner culinary-corner-bl"></div>
            <div className="culinary-corner culinary-corner-br"></div>
            
            {/* Decorative top border */}
            <div className="bg-gradient-to-r from-primary-800 via-primary-700 to-primary-800 h-3"></div>
            
            <div className="p-8 sm:p-12">
              {/* Culinary decoration */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center space-x-3 text-primary-700">
                  <Utensils className="w-6 h-6 opacity-60" />
                  <ChefHat className="w-7 h-7 opacity-80" />
                  <Utensils className="w-6 h-6 opacity-60" />
                </div>
              </div>

              {/* Main Title with vintage typography */}
              <h1 className="cookbook-title text-center text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-900 mb-4 tracking-wide">
                {recipe.title || 'Recept'}
              </h1>
              
              {/* Category subtitle */}
              {recipe.category && (
                <p className="cookbook-subtitle text-center text-xl sm:text-2xl text-primary-700 mb-6 font-light">
                  {recipe.category}
                </p>
              )}

              {/* Decorative divider line */}
              <div className="flex items-center justify-center my-6">
                <div className="h-px bg-gradient-to-r from-transparent via-primary-600 to-transparent w-full max-w-md"></div>
                <ChefHat className="w-8 h-8 mx-4 text-primary-600 flex-shrink-0" />
                <div className="h-px bg-gradient-to-r from-transparent via-primary-600 to-transparent w-full max-w-md"></div>
              </div>

              {/* Recipe Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mt-8">
                {/* Prep Time */}
                {recipe.prepTime && recipe.prepTime > 0 && (
                  <div className="border-2 border-amber-200 rounded-lg p-4 bg-gradient-to-b from-white to-amber-50">
                    <div className="text-xs uppercase tracking-wider text-amber-600 mb-2 font-semibold">Bereidingstijd</div>
                    <div className="flex items-center justify-center space-x-2">
                      <Clock className="w-5 h-5 text-amber-600" />
                      <span className="text-lg font-bold text-gray-800">{recipe.prepTime} min</span>
                    </div>
                  </div>
                )}
                
                {/* Servings */}
                {recipe.servings && recipe.servings > 0 && (
                  <div className="border-2 border-amber-200 rounded-lg p-4 bg-gradient-to-b from-white to-amber-50">
                    <div className="text-xs uppercase tracking-wider text-amber-600 mb-2 font-semibold">Porties</div>
                    <div className="flex items-center justify-center space-x-2">
                      <Users className="w-5 h-5 text-amber-600" />
                      <span className="text-lg font-bold text-gray-800">{recipe.servings} personen</span>
                    </div>
                  </div>
                )}

                {/* Difficulty */}
                {recipe.difficulty && (
                  <div className="border-2 border-amber-200 rounded-lg p-4 bg-gradient-to-b from-white to-amber-50">
                    <div className="text-xs uppercase tracking-wider text-amber-600 mb-2 font-semibold">Moeilijkheidsgraad</div>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                      recipe.difficulty === 'EASY' ? 'bg-green-100 text-green-800 border-2 border-green-400' :
                      recipe.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400' :
                      'bg-red-100 text-red-800 border-2 border-red-400'
                    }`}>
                      {difficultyLabels[recipe.difficulty] || recipe.difficulty}
                    </div>
                  </div>
                )}
              </div>

              {/* Chef Info */}
              <div className="mt-8 pt-6 border-t-2 border-amber-200">
                <div className="flex items-center justify-center space-x-3">
                  <div className="text-xs uppercase tracking-wider text-amber-600 font-semibold">Gemaakt door</div>
                  {recipe.user.profileImage ? (
                    <Image
                      src={recipe.user.profileImage}
                      alt={recipe.user.name || getDisplayName(recipe.user)}
                      width={40}
                      height={40}
                      className="rounded-full border-2 border-amber-500"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center border-2 border-amber-500">
                      <ChefHat className="w-5 h-5 text-amber-700" />
                    </div>
                  )}
                  <span className="font-bold text-gray-800">
                    {recipe.user.name || getDisplayName(recipe.user)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Decorative bottom border */}
            <div className="bg-gradient-to-r from-amber-800 via-orange-700 to-amber-800 h-3"></div>
          </div>

          {/* Featured Image */}
          {mainPhoto && (
            <div className="culinary-frame bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden mb-8 print-avoid-break border-4 border-amber-700 relative">
              <div className="culinary-corner culinary-corner-tl"></div>
              <div className="culinary-corner culinary-corner-tr"></div>
              <div className="culinary-corner culinary-corner-bl"></div>
              <div className="culinary-corner culinary-corner-br"></div>
              
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <Image
                  src={mainPhoto.url}
                  alt={recipe.title || 'Recept foto'}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Vintage photo label */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <p className="cookbook-subtitle text-white text-lg text-center">
                    {recipe.title}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Video */}
          {recipe.video && recipe.video.url && (
            <div className="culinary-frame bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden mb-8 print-avoid-break border-4 border-amber-700 relative no-print">
              <div className="culinary-corner culinary-corner-tl"></div>
              <div className="culinary-corner culinary-corner-tr"></div>
              <div className="culinary-corner culinary-corner-bl"></div>
              <div className="culinary-corner culinary-corner-br"></div>
              
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <video
                  src={recipe.video.url}
                  controls
                  className="w-full h-full object-cover"
                  poster={recipe.video.thumbnail || undefined}
                  preload="metadata"
                  playsInline
                  webkit-playsinline="true"
                >
                  Je browser ondersteunt geen video element.
                </video>
                {/* Video label */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="cookbook-subtitle text-white text-base text-center">
                    Video: {recipe.title}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {recipe.description && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-2xl shadow-xl p-8 sm:p-10 mb-8 print-avoid-break border-2 border-amber-300">
              <div className="flex items-center mb-6">
                <div className="h-px bg-amber-300 flex-grow"></div>
                <h2 className="cookbook-title text-2xl sm:text-3xl font-bold text-amber-900 px-4">
                  Over dit Recept
                </h2>
                <div className="h-px bg-amber-300 flex-grow"></div>
              </div>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-justify cookbook-subtitle text-lg">
                  {recipe.description}
                </p>
              </div>
            </div>
          )}

          {/* Main Recipe Content - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Ingredients */}
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div className="vintage-paper bg-white rounded-none sm:rounded-2xl shadow-xl p-8 print-avoid-break border-2 border-amber-300">
                <div className="flex items-center mb-6">
                  <div className="h-px bg-amber-300 flex-grow"></div>
                  <h2 className="cookbook-title text-2xl font-bold text-amber-900 px-4 flex items-center">
                    <Utensils className="w-6 h-6 mr-2 text-amber-600" />
                    Ingrediënten
                  </h2>
                  <div className="h-px bg-amber-300 flex-grow"></div>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
                  <ul className="space-y-3">
                    {recipe.ingredients.map((ingredient, index) => (
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
            {recipe.instructions && recipe.instructions.length > 0 && (
              <div className="vintage-paper bg-white rounded-none sm:rounded-2xl shadow-xl p-8 print-avoid-break border-2 border-amber-300">
                <div className="flex items-center mb-6">
                  <div className="h-px bg-amber-300 flex-grow"></div>
                  <h2 className="cookbook-title text-2xl font-bold text-amber-900 px-4 flex items-center">
                    <Flame className="w-6 h-6 mr-2 text-orange-600" />
                    Bereidingswijze
                  </h2>
                  <div className="h-px bg-amber-300 flex-grow"></div>
                </div>
                
                <div className="space-y-6">
                  {recipe.instructions.map((instruction, index) => {
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
                            
                            {/* Step Photos - Responsive voor portret mode */}
                            {currentStepPhotos.length > 0 && (
                              <div className="mt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {currentStepPhotos.map((photo) => (
                                    <div key={photo.id} className="relative group">
                                      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-amber-300 shadow-md">
                                        <Image
                                          src={photo.url}
                                          alt={`Stap ${stepNumber} foto`}
                                          fill
                                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                                          sizes="(max-width: 640px) 100vw, 50vw"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
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

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="vintage-paper bg-white rounded-none sm:rounded-2xl shadow-xl p-8 sm:p-10 mb-8 print-avoid-break border-2 border-amber-300">
              <div className="flex items-center mb-8">
                <div className="h-px bg-amber-300 flex-grow"></div>
                <h2 className="cookbook-title text-2xl sm:text-3xl font-bold text-amber-900 px-4 flex items-center">
                  <BookOpen className="w-7 h-7 mr-3 text-amber-600" />
                  Kenmerken
                </h2>
                <div className="h-px bg-amber-300 flex-grow"></div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {recipe.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-800 rounded-full text-sm font-bold border-2 border-amber-400 shadow-md hover:shadow-lg transition-all hover:scale-105"
                  >
                    <span className="mr-2">📌</span>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer - Cookbook Signature */}
          <div className="text-center mt-12 mb-8 print-avoid-break">
            <div className="inline-flex items-center justify-center space-x-4 text-amber-600 opacity-60">
              <Utensils className="w-6 h-6" />
              <div className="text-center">
                <p className="cookbook-subtitle text-lg text-amber-800">
                  Gemaakt met liefde en passie
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  HomeCheff Keuken
                </p>
              </div>
              <ChefHat className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

