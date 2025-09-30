"use client";

import { useState, useEffect } from "react";
import { X, Clock, Users, ChefHat, Camera, ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";

type RecipePhoto = {
  id: string;
  url: string;
  isMain: boolean;
  stepNumber?: number;
  description?: string;
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
      const response = await fetch(`/api/profile/dishes/${recipeId}`);
      if (response.ok) {
        const data = await response.json();
        setRecipe(data.item);
      } else {
        setError('Kon recept niet laden');
      }
    } catch (err) {
      console.error('Error loading recipe:', err);
      setError('Kon recept niet laden');
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (recipe?.photos) {
      setSelectedImageIndex((prev) => 
        prev < recipe.photos.length - 1 ? prev + 1 : 0
      );
    }
  };

  const prevImage = () => {
    if (recipe?.photos) {
      setSelectedImageIndex((prev) => 
        prev > 0 ? prev - 1 : recipe.photos.length - 1
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
            <div className="space-y-6">
              {/* Recipe Header */}
              <div className="text-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h3>
                {recipe.description && (
                  <p className="text-lg text-gray-600 mb-4">{recipe.description}</p>
                )}
                
                {/* Recipe Meta */}
                <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-6">
                  {recipe.prepTime && recipe.prepTime > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {recipe.prepTime} min
                    </div>
                  )}
                  {recipe.servings && recipe.servings > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {recipe.servings} personen
                    </div>
                  )}
                  {recipe.difficulty && (
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      DIFFICULTY_LEVELS.find(d => d.value === recipe.difficulty)?.color || 'text-gray-600 bg-gray-100'
                    }`}>
                      {DIFFICULTY_LEVELS.find(d => d.value === recipe.difficulty)?.label}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {recipe.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {recipe.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Recipe Photos */}
              {recipe.photos && recipe.photos.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-gray-900">Foto's</h4>
                  <div className="relative">
                    <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                      <Image
                        src={recipe.photos[selectedImageIndex].url}
                        alt={`${recipe.title} - Foto ${selectedImageIndex + 1}`}
                        width={800}
                        height={450}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {recipe.photos.length > 1 && (
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
                          {recipe.photos.map((_, index) => (
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
                  {recipe.photos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {recipe.photos.map((photo, index) => (
                        <button
                          key={photo.id}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            index === selectedImageIndex 
                              ? 'border-primary-500' 
                              : 'border-gray-200'
                          }`}
                        >
                          <Image
                            src={photo.url}
                            alt={`${recipe.title} - Thumbnail ${index + 1}`}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Ingredients */}
              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-gray-900">Ingrediënten</h4>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <ul className="space-y-2">
                      {recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-gray-700">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {recipe.instructions && recipe.instructions.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-gray-900">Bereidingswijze</h4>
                  <div className="space-y-4">
                    {recipe.instructions.map((instruction, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-700 leading-relaxed">{instruction}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
