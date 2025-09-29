'use client';

import { useState } from 'react';
import { X, Clock, Users, ChefHat, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface RecipePhoto {
  id: string;
  url: string;
  idx: number;
  isMain: boolean;
  stepNumber?: number;
  description?: string;
}

interface Recipe {
  id: string;
  title: string | null;
  description: string | null;
  prepTime: number | null;
  servings: number | null;
  difficulty: string | null;
  category: string | null;
  tags: string[];
  ingredients: string[];
  instructions: string[];
  photos: RecipePhoto[];
  createdAt: Date;
}

interface RecipeModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

const difficultyLabels = {
  'EASY': 'Makkelijk',
  'MEDIUM': 'Gemiddeld',
  'HARD': 'Moeilijk'
};

const difficultyColors = {
  'EASY': 'bg-green-100 text-green-800',
  'MEDIUM': 'bg-yellow-100 text-yellow-800',
  'HARD': 'bg-red-100 text-red-800'
};

export default function RecipeModal({ recipe, isOpen, onClose }: RecipeModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!isOpen || !recipe) return null;

  const mainPhotos = recipe.photos.filter(photo => photo.isMain || !photo.stepNumber);
  const stepPhotos = recipe.photos.filter(photo => photo.stepNumber);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % mainPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + mainPhotos.length) % mainPhotos.length);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">{recipe.title || 'Recept zonder titel'}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="p-6">
              {/* Recipe Info */}
              <div className="flex flex-wrap gap-4 mb-6">
                {recipe.prepTime && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-5 h-5" />
                    <span>{recipe.prepTime} min</span>
                  </div>
                )}
                {recipe.servings && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-5 h-5" />
                    <span>{recipe.servings} personen</span>
                  </div>
                )}
                {recipe.difficulty && (
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-gray-600" />
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${difficultyColors[recipe.difficulty as keyof typeof difficultyColors]}`}>
                      {difficultyLabels[recipe.difficulty as keyof typeof difficultyLabels]}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {recipe.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Photos */}
              {mainPhotos.length > 0 && (
                <div className="mb-8">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={mainPhotos[currentPhotoIndex].url}
                      alt={recipe.title || 'Recept foto'}
                      fill
                      className="object-cover"
                    />
                    
                    {/* Photo Navigation */}
                    {mainPhotos.length > 1 && (
                      <>
                        <button
                          onClick={prevPhoto}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextPhoto}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                        
                        {/* Photo Indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {mainPhotos.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentPhotoIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentPhotoIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {recipe.description && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Beschrijving</h3>
                  <p className="text-gray-700 leading-relaxed">{recipe.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ingredients */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingrediënten</h3>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Bereidingswijze</h3>
                  <ol className="space-y-4">
                    {recipe.instructions.map((instruction, index) => (
                      <li key={index} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <p className="text-gray-700 leading-relaxed">{instruction}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Step Photos */}
              {stepPhotos.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Stap-voor-stap foto's</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {stepPhotos.map((photo, index) => (
                      <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={photo.url}
                          alt={`Stap ${photo.stepNumber}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                        {photo.description && (
                          <div className="p-2 bg-white bg-opacity-90 absolute bottom-0 left-0 right-0">
                            <p className="text-xs text-gray-700">{photo.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
