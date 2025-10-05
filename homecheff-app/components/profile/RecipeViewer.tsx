"use client";

import { useState, useEffect } from "react";
import { X, Clock, Users, ChefHat, Camera, ArrowLeft, ArrowRight, Download, Share2, Printer } from "lucide-react";
import Image from "next/image";

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
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen && recipeId) {
      loadRecipe();
    }
  }, [isOpen, recipeId]);

  const loadRecipe = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try the new public recipes endpoint first
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (response.ok) {
        const data = await response.json();
        setRecipe(data.recipe);
      } else {
        // Fallback to the old endpoint for private recipes
        const fallbackResponse = await fetch(`/api/profile/dishes/${recipeId}`);
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
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

  // Create combined photos array with proper labels
  const allPhotos = recipe ? [
    // Add main photos with "Hoofdfoto" label
    ...recipe.photos.filter(photo => photo.isMain || !photo.stepNumber).map(photo => ({
      ...photo,
      label: 'Hoofdfoto'
    })),
    // Add step photos with their descriptions as labels
    ...recipe.photos.filter(photo => photo.stepNumber).map(photo => {
      // Get the step description from the instructions array
      const stepNumber = photo.stepNumber!; // We know it exists due to filter
      const stepDescription = recipe.instructions[stepNumber - 1] || photo.description || `Stap ${stepNumber}`;
      return {
        ...photo,
        label: stepDescription
      };
    })
  ] : [];

  // Fallback to original photos if allPhotos is empty (for backwards compatibility)
  const displayPhotos = allPhotos.length > 0 ? allPhotos : (recipe?.photos || []).map(photo => ({
    ...photo,
    label: 'Hoofdfoto'
  }));

  const nextImage = () => {
    if (displayPhotos.length > 0) {
      setSelectedImageIndex((prev) => 
        prev < displayPhotos.length - 1 ? prev + 1 : 0
      );
    }
  };

  const prevImage = () => {
    if (displayPhotos.length > 0) {
      setSelectedImageIndex((prev) => 
        prev > 0 ? prev - 1 : displayPhotos.length - 1
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Recept Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Recept laden...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <ChefHat className="w-12 h-12 mx-auto mb-4 text-red-300" />
              <p>{error}</p>
            </div>
          ) : recipe ? (
            <div className="space-y-8">
              {/* Recipe Header */}
              <div className="text-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{recipe.title}</h3>
                
                {/* Recipe Meta */}
                <div className="flex flex-wrap justify-center gap-4 mb-6">
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

              {/* Recipe Photos */}
              {displayPhotos.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-gray-900">Foto's</h4>
                  <div className="relative">
                    <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                      <Image
                        src={displayPhotos[selectedImageIndex].url}
                        alt={`${recipe.title} - ${displayPhotos[selectedImageIndex].label}`}
                        width={800}
                        height={450}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Photo Label */}
                      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {displayPhotos[selectedImageIndex].label}
                      </div>
                    </div>
                    
                    {displayPhotos.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                        
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                          {displayPhotos.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImageIndex(index)}
                              className={`w-3 h-3 rounded-full transition-all ${
                                index === selectedImageIndex 
                                  ? 'bg-white' 
                                  : 'bg-white bg-opacity-50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnail Gallery */}
                  {displayPhotos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {displayPhotos.map((photo, index) => (
                        <button
                          key={photo.id}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 relative group ${
                            index === selectedImageIndex 
                              ? 'ring-2 ring-primary-500' 
                              : 'border-2 border-gray-200'
                          }`}
                        >
                          <div className="w-20 h-20 rounded-lg overflow-hidden">
                            <Image
                              src={photo.url}
                              alt={`${recipe.title} - ${photo.label}`}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 rounded-b-lg">
                            <span className="truncate block">{photo.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Main Recipe Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ingredients */}
                {recipe.ingredients && recipe.ingredients.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-emerald-600" />
                      Ingrediënten
                    </h4>
                    <ul className="space-y-3">
                      {recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-gray-700">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Instructions */}
                {recipe.instructions && recipe.instructions.length > 0 && (
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-emerald-600" />
                      Bereidingswijze
                    </h4>
                    <div className="space-y-6">
                      {recipe.instructions.map((instruction, index) => {
                        const stepNumber = index + 1;
                        const currentStepPhotos = recipe.photos?.filter(photo => photo.stepNumber === stepNumber) || [];
                        
                        return (
                          <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="flex gap-4">
                              <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                                {stepNumber}
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-700 leading-relaxed mb-4 text-lg">{instruction}</p>
                                
                                {/* Step Photos */}
                                {currentStepPhotos.length > 0 && (
                                  <div className="mt-4">
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                      {currentStepPhotos.map((photo) => (
                                        <div key={photo.id} className="flex-shrink-0">
                                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                                            <Image
                                              src={photo.url}
                                              alt={`Stap ${stepNumber} foto`}
                                              width={96}
                                              height={96}
                                              className="w-full h-full object-cover"
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

              {/* Recipe Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
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
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
