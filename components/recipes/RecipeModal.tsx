'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Users, ChefHat, Star, ArrowLeft, ArrowRight, Download, Share2, Printer, Camera } from 'lucide-react';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';

interface RecipePhoto {
  id: string;
  url: string;
  idx: number;
  isMain: boolean;
  stepNumber?: number;
  description?: string;
  label?: string; // Added for photo labels
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
  const { t } = useTranslation();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [fullRecipe, setFullRecipe] = useState<Recipe | null>(recipe);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load full recipe if ingredients/instructions are empty
  useEffect(() => {
    if (isOpen && recipe && (!recipe.ingredients.length || !recipe.instructions.length)) {
      loadFullRecipe(recipe.id);
    } else if (isOpen && recipe) {
      setFullRecipe(recipe);
    }
  }, [isOpen, recipe]);

  const loadFullRecipe = async (recipeId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (response.ok) {
        const data = await response.json();
        setFullRecipe(data.recipe);
      } else {
        setError(t('recipes.couldNotLoad'));
        setFullRecipe(recipe);
      }
    } catch (err) {
      console.error('Error loading recipe:', err);
      setError('Kon recept niet laden');
      setFullRecipe(recipe);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !fullRecipe) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-500">{t('recipes.loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6">
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {t('recipes.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const downloadRecipe = () => {
    const recipeText = `
${fullRecipe.title}

${fullRecipe.description || ''}

📋 ${t('recipes.ingredients')} (${fullRecipe.servings || 1} ${t('recipes.people')}):
${fullRecipe.ingredients.map((ingredient, index) => `${index + 1}. ${ingredient}`).join('\n')}

👨‍🍳 ${t('recipes.preparation')}:
${fullRecipe.instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

⏱️  ${t('recipes.prepTimeLabel')} ${fullRecipe.prepTime || t('recipes.notSpecified')} ${t('recipes.minutes')}
👥  ${t('recipes.servingsLabel')} ${fullRecipe.servings || t('recipes.notSpecified')}
⭐  ${t('recipes.difficultyLabel')} ${difficultyLabels[fullRecipe.difficulty as keyof typeof difficultyLabels] || t('recipes.notSpecified')}

${fullRecipe.tags.length > 0 ? `🏷️  ${t('recipes.tagsLabel')} ${fullRecipe.tags.join(', ')}` : ''}

---
{t('recipes.sharedVia')}
    `.trim();

    const blob = new Blob([recipeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fullRecipe.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || t('recipes.title').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printRecipe = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${fullRecipe.title}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            .ingredients, .instructions { margin: 20px 0; }
            .ingredients li, .instructions li { margin: 8px 0; }
            .meta { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .meta div { margin: 5px 0; }
            .tags { margin-top: 20px; }
            .tag { display: inline-block; background: #e5e7eb; padding: 4px 8px; border-radius: 4px; margin: 2px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>${fullRecipe.title}</h1>
          ${fullRecipe.description ? `<p><em>${fullRecipe.description}</em></p>` : ''}
          
          <div class="meta">
            <div><strong>⏱️ ${t('recipes.prepTimeLabel')}</strong> ${fullRecipe.prepTime || t('recipes.notSpecified')} ${t('recipes.minutes')}</div>
            <div><strong>👥 ${t('recipes.servingsLabel')}</strong> ${fullRecipe.servings || t('recipes.notSpecified')}</div>
            <div><strong>⭐ ${t('recipes.difficultyLabel')}</strong> ${difficultyLabels[fullRecipe.difficulty as keyof typeof difficultyLabels] || t('recipes.notSpecified')}</div>
          </div>

          <h2>📋 ${t('recipes.ingredients')}</h2>
          <ul class="ingredients">
            ${fullRecipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
          </ul>

          <h2>👨‍🍳 ${t('recipes.preparation')}</h2>
          <ol class="instructions">
            ${fullRecipe.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
          </ol>

          ${fullRecipe.tags.length > 0 ? `
            <div class="tags">
              <strong>🏷️ ${t('recipes.tagsLabel')}</strong><br>
              ${fullRecipe.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}

          <hr>
          <p><em>${t('recipes.sharedVia')}</em></p>
        </body>
        </html>
      `;
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Debug: Log the recipe photos structure
  const mainPhotos = fullRecipe.photos.filter(photo => photo.isMain || !photo.stepNumber);
  const stepPhotos = fullRecipe.photos.filter(photo => photo.stepNumber);
  // Debug: Check if photos have valid URLs
  mainPhotos.forEach((photo, index) => {
  });
  stepPhotos.forEach((photo, index) => {
  });

  // Create combined photos array with proper labels
  const allPhotos = [
    // Add main photos with "Hoofdfoto" label
    ...mainPhotos.map(photo => ({
      ...photo,
      label: t('recipes.mainPhoto')
    })),
    // Add step photos with their descriptions as labels
    ...stepPhotos.map(photo => {
      // Get the step description from the instructions array
      const stepNumber = photo.stepNumber!; // We know it exists due to filter
      const stepDescription = fullRecipe.instructions[stepNumber - 1] || photo.description || `${t('recipes.step')} ${stepNumber}`;
      return {
        ...photo,
        label: stepDescription
      };
    })
  ];
  // Fallback to mainPhotos if allPhotos is empty (for backwards compatibility)
  const displayPhotos = allPhotos.length > 0 ? allPhotos : mainPhotos.map(photo => ({
    ...photo,
      label: t('recipes.mainPhoto')
  }));
  const nextPhoto = () => {
    const totalPhotos = displayPhotos.length || fullRecipe.photos.length;
    setCurrentPhotoIndex((prev) => (prev + 1) % totalPhotos);
  };

  const prevPhoto = () => {
    const totalPhotos = displayPhotos.length || fullRecipe.photos.length;
    setCurrentPhotoIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
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
            <h2 className="text-2xl font-bold text-gray-900">{fullRecipe.title || t('common.recipeWithoutTitle')}</h2>
            <div className="flex items-center gap-2">
              {/* Action Buttons */}
              <button
                onClick={downloadRecipe}
                className="flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title={t('common.downloadRecipe')}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{t('common.download')}</span>
              </button>
              <button
                onClick={printRecipe}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title={t('recipes.printRecipe')}
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="p-6">
              {/* Recipe Header with Meta Info */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-4 mb-4">
                {fullRecipe.prepTime && (
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">{fullRecipe.prepTime} min</span>
                  </div>
                )}
                {fullRecipe.servings && (
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">{fullRecipe.servings} personen</span>
                  </div>
                )}
                {fullRecipe.difficulty && (
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                      <ChefHat className="w-4 h-4 text-gray-600" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[fullRecipe.difficulty as keyof typeof difficultyColors]}`}>
                      {difficultyLabels[fullRecipe.difficulty as keyof typeof difficultyLabels]}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {fullRecipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                  {fullRecipe.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
                </div>

              {/* Description */}
              {fullRecipe.description && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('recipes.overRecipe')}</h3>
                  <p className="text-gray-700 leading-relaxed text-lg">{fullRecipe.description}</p>
                </div>
              )}

              {/* Main Recipe Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Ingredients */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-emerald-600" />
                    {t('recipes.ingredientsTitle')}
                  </h3>
                  <ul className="space-y-3">
                    {fullRecipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-emerald-600" />
                    {t('recipes.instructionsTitle')}
                  </h3>
                  <div className="space-y-6">
                    {fullRecipe.instructions.map((instruction, index) => {
                      const stepNumber = index + 1;
                      const currentStepPhotos = stepPhotos.filter(photo => photo.stepNumber === stepNumber);
                      
                      return (
                        <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                            {stepNumber}
                          </div>
                          <div className="flex-1">
                              <p className="text-gray-700 leading-relaxed mb-4 text-lg">{instruction}</p>
                            
                              {/* Step Photos - Responsive voor portret mode */}
                            {currentStepPhotos.length > 0 && (
                                <div className="mt-4">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {currentStepPhotos.map((photo) => (
                                      <div key={photo.id} className="relative group">
                                        <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-amber-300 shadow-md">
                                    <Image
                                      src={photo.url}
                                      alt={`${t('recipes.step')} ${stepNumber} ${t('recipes.photo')}`}
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
              </div>

              {/* Photo Gallery Section */}
              {(displayPhotos.length > 0 || fullRecipe.photos.length > 0) && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-600" />
                    Foto's ({displayPhotos.length || fullRecipe.photos.length})
                  </h3>
                  
                  {/* Main Photo Display */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4 shadow-lg">
                    {displayPhotos.length > 0 && displayPhotos[currentPhotoIndex]?.url ? (
                      <>
                        <img
                          src={displayPhotos[currentPhotoIndex].url}
                          alt={fullRecipe.title || t('recipes.recipePhoto')}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Image failed to load:', displayPhotos[currentPhotoIndex].url);
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => {
                          }}
                        />
                      </>
                    ) : fullRecipe.photos.length > 0 && fullRecipe.photos[currentPhotoIndex]?.url ? (
                      <>
                        <img
                          src={fullRecipe.photos[currentPhotoIndex].url}
                          alt={fullRecipe.title || t('recipes.recipePhoto')}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Image failed to load:', fullRecipe.photos[currentPhotoIndex].url);
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => {
                          }}
                        />
                        
                        {/* Photo Label */}
                        <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm font-medium">
                          {fullRecipe.photos[currentPhotoIndex].isMain ? t('recipes.mainPhoto') : `${t('recipes.photo')} ${currentPhotoIndex + 1}`}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">{t('recipes.noPhotosAvailable')}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Photo Navigation */}
                    {((displayPhotos.length > 1) || (displayPhotos.length === 0 && fullRecipe.photos.length > 1)) && (
                      <>
                        <button
                          onClick={prevPhoto}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextPhoto}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                        
                        {/* Photo Counter */}
                        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                          {currentPhotoIndex + 1} / {displayPhotos.length || fullRecipe.photos.length}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Photo Thumbnails */}
                  {((displayPhotos.length > 1) || (displayPhotos.length === 0 && fullRecipe.photos.length > 1)) && (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {(displayPhotos.length > 0 ? displayPhotos : fullRecipe.photos).map((photo, index) => (
                        <button
                          key={photo.id}
                          onClick={() => setCurrentPhotoIndex(index)}
                          className={`flex-shrink-0 relative group transition-all ${
                            index === currentPhotoIndex ? 'ring-2 ring-emerald-500 scale-105' : 'hover:scale-105'
                          }`}
                        >
                          <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                            {photo?.url ? (
                              <img
                                src={photo.url}
                                alt={displayPhotos.length > 0 ? photo.label : (photo.isMain ? t('recipes.mainPhoto') : `${t('recipes.photo')} ${index + 1}`)}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Thumbnail failed to load:', photo.url);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Camera className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
