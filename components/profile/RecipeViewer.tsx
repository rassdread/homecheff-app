"use client";

import { useState, useEffect } from "react";
import { X, Clock, Users, ChefHat, Printer } from "lucide-react";
import Image from "next/image";
import { useTranslation } from '@/hooks/useTranslation';

type RecipePhoto = {
  id: string;
  url: string;
  isMain: boolean;
  stepNumber?: number;
  description?: string;
  label?: string; // Added for photo labels
};

type Recipe = {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number | null;
  servings: number | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null;
  category: string | null;
  tags: string[];
  photos: RecipePhoto[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
};

const DIFFICULTY_LEVELS = [
  { value: 'EASY', label: 'Makkelijk', color: 'text-green-600 bg-green-100' },
  { value: 'MEDIUM', label: 'Gemiddeld', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'HARD', label: 'Moeilijk', color: 'text-red-600 bg-red-100' }
];

interface RecipeViewerProps {
  recipeId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function RecipeViewer({ recipeId, isOpen, onClose }: RecipeViewerProps) {
  const { t } = useTranslation();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && recipeId) {
      loadRecipe();
    }
  }, [isOpen, recipeId]);

  const loadRecipe = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (response.ok) {
        const data = await response.json();
        const stepPhotosList = data.recipe.photos?.filter((p: any) => p.stepNumber) || [];
        setRecipe(data.recipe);
      } else {
        const fallbackResponse = await fetch(`/api/profile/dishes/${recipeId}`);
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          const stepPhotosList = data.item.photos?.filter((p: any) => p.stepNumber) || [];
          setRecipe(data.item);
        } else {
          setError('Kon recept niet laden');
        }
      }
    } catch (err) {
      console.error('Error loading recipe:', err);
      setError('Kon recept niet laden');
    } finally {
      setLoading(false);
    }
  };

  const mainPhoto = recipe?.photos.find(p => p.isMain || !p.stepNumber);
  
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:relative print:inset-auto print:bg-white print:p-0">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-none print:rounded-none print:shadow-none">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 print:border-b-2 print:border-gray-300">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 print:text-3xl">Recept Details</h2>
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={t('common.print')}
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 print:p-8">
          {loading ? (
            <div className="text-center py-12 print:hidden">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Recept laden...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500 print:hidden">
              <ChefHat className="w-12 h-12 mx-auto mb-4 text-red-300" />
              <p>{error}</p>
            </div>
          ) : recipe ? (
            <div id="printable-recipe" className="space-y-6 print:space-y-4">
              {/* Recipe Header */}
              <div className="text-center print:text-left">
                <h3 className="text-3xl font-bold text-gray-900 mb-4 print:text-4xl print:mb-3">{recipe.title}</h3>
                
                {/* Recipe Meta */}
                <div className="flex flex-wrap justify-center gap-4 mb-6 print:justify-start print:gap-6 print:mb-4">
                  {recipe.prepTime && recipe.prepTime > 0 && (
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">{recipe.prepTime} min</span>
                    </div>
                  )}
                  {recipe.servings && recipe.servings > 0 && (
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">{recipe.servings} personen</span>
                    </div>
                  )}
                  {recipe.difficulty && (
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                      <ChefHat className="w-4 h-4 text-gray-600" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        DIFFICULTY_LEVELS.find(d => d.value === recipe.difficulty)?.color || 'text-gray-600 bg-gray-100'
                      }`}>
                        {DIFFICULTY_LEVELS.find(d => d.value === recipe.difficulty)?.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {recipe.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {recipe.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                {recipe.description && (
                  <div className="max-w-2xl mx-auto">
                    <p className="text-lg text-gray-700 leading-relaxed">{recipe.description}</p>
                  </div>
                )}
              </div>

              {/* Main Recipe Photo - Compacter */}
              {mainPhoto && (
                <div className="mb-6 print:mb-4">
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden print:rounded-lg">
                    <Image
                      src={mainPhoto.url}
                      alt={recipe.title}
                      width={800}
                      height={450}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Main Recipe Content - 2 Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:gap-8">
                {/* Ingredients */}
                {recipe.ingredients && recipe.ingredients.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-5 print:bg-white print:border-2 print:border-gray-300 print:p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2 print:text-2xl print:mb-5">
                      <ChefHat className="w-5 h-5 text-emerald-600 print:w-6 print:h-6" />
                      Ingrediënten
                    </h4>
                    <ul className="space-y-2 print:space-y-2.5">
                      {recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0 print:w-2.5 print:h-2.5"></span>
                          <span className="text-gray-700 text-base print:text-base">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Instructions - Volle breedte */}
                {recipe.instructions && recipe.instructions.length > 0 && (
                  <div className="lg:col-span-2 print:col-span-2">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2 print:text-2xl print:mb-5">
                      <ChefHat className="w-5 h-5 text-emerald-600 print:w-6 print:h-6" />
                      Bereidingswijze ({recipe.instructions.length} stappen)
                    </h4>
                    <div className="space-y-4 print:space-y-3">
                      {recipe.instructions.map((instruction, index) => {
                        const stepNumber = index + 1;
                        const currentStepPhotos = recipe.photos?.filter(photo => photo.stepNumber === stepNumber) || [];
                        
                        if (index === 0) {
                        }
                        
                        return (
                          <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 print:border-gray-300 print:p-4 print:break-inside-avoid">
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-base print:w-9 print:h-9">
                                {stepNumber}
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-700 leading-relaxed text-base print:text-base">{instruction}</p>
                                
                                {/* Step Photos - Responsive voor portret mode */}
                                {currentStepPhotos.length > 0 && (
                                  <div className="mt-3 print:mt-2">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                      {currentStepPhotos.map((photo) => (
                                        <div key={photo.id} className="relative group">
                                          <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-gray-300 shadow-sm print:aspect-square">
                                            <Image
                                              src={photo.url}
                                              alt={`Stap ${stepNumber}`}
                                              fill
                                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                                              sizes="(max-width: 640px) 50vw, 33vw"
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

              {/* Recipe Info - Compacter */}
              <div className="bg-gray-50 rounded-xl p-4 mt-4 print:bg-white print:border print:border-gray-300 print:mt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                  {recipe.category && (
                    <div>
                      <span className="font-medium">Categorie:</span> {recipe.category}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Toegevoegd:</span> {new Date(recipe.createdAt).toLocaleDateString('nl-NL')}
                  </div>
                </div>
              </div>
              
              {/* HomeCheff Branding Footer */}
              <div className="mt-8 pt-6 border-t-2 border-gray-200 print:mt-6 print:pt-4 print:border-t-2 print:border-gray-400">
                <div className="flex flex-col items-center gap-3 print:gap-2">
                  <div className="flex items-center gap-3">
                    {/* HomeCheff Logo SVG */}
                    <div className="w-6 h-6 relative">
                      <svg viewBox="0 0 60 60" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <g>
                          <path d="M15 10 Q20 5 25 10 L30 10 Q35 5 40 10 L40 20 Q40 25 35 25 L20 25 Q15 25 15 20 Z" fill="white" stroke="#1e40af" strokeWidth="2"/>
                          <rect x="22" y="25" width="16" height="30" fill="white" stroke="#1e40af" strokeWidth="2" rx="2"/>
                          <circle cx="30" cy="35" r="5" fill="white" stroke="#1e40af" strokeWidth="2"/>
                          <circle cx="28" cy="33" r="1" fill="#1e40af"/>
                          <circle cx="32" cy="33" r="1" fill="#1e40af"/>
                          <path d="M26 37 Q30 40 34 37" stroke="#1e40af" strokeWidth="1.5" fill="none"/>
                          <circle cx="30" cy="30" r="1" fill="#1e40af"/>
                          <circle cx="30" cy="35" r="1" fill="#1e40af"/>
                          <rect x="5" y="30" width="15" height="3" fill="#22c55e" stroke="#1e40af" strokeWidth="1" rx="1"/>
                          <circle cx="5" cy="31.5" r="3" fill="#22c55e" stroke="#1e40af" strokeWidth="1"/>
                          <circle cx="45" cy="35" r="10" fill="#3b82f6" stroke="#1e40af" strokeWidth="2"/>
                          <path d="M35 35 Q45 30 55 35 M35 35 Q45 40 55 35" stroke="#22c55e" strokeWidth="1.5" fill="none"/>
                          <path d="M45 25 Q50 35 45 45 M45 25 Q40 35 45 45" stroke="#22c55e" strokeWidth="1.5" fill="none"/>
                          <path d="M48 20 Q50 15 52 20 M50 18 Q52 13 54 18 M52 16 Q54 11 56 16" stroke="white" strokeWidth="2" fill="none"/>
                        </g>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                        HomeCheff
                      </span>
                      <span className="text-xs text-gray-500 -mt-1">
                        Lokale Culinaire Parels
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 font-medium">
                      Gemaakt op HomeCheff
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Deel je culinaire passie met de wereld
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 print:text-gray-600">
                    www.homecheff.nl
                  </div>
                </div>
              </div>
              
              {/* Print styling - Consistent with other viewers */}
              <style jsx global>{`
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
                }
              `}</style>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
