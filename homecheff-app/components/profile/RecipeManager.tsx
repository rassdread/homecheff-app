"use client";

import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Eye, EyeOff, Clock, Users, ChefHat, Camera, Save, X, Grid, List, ShoppingCart } from "lucide-react";
import RecipePhotoUpload from "./RecipePhotoUpload";
import RecipeStepPhotos from "./RecipeStepPhotos";

type RecipePhoto = {
  id: string;
  url: string;
  isMain: boolean;
  stepNumber?: number;
  description?: string;
};

type StepPhoto = {
  id: string;
  url: string;
  stepNumber: number;
  description?: string;
};

type RecipePhotoUnion = RecipePhoto | StepPhoto;

type Recipe = {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number | null; // in minutes
  servings: number | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null;
  category: string | null;
  tags: string[];
  photos: RecipePhoto[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
};

type RecipeFormData = {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  servings: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  tags: string[];
  isPrivate: boolean;
  photos: RecipePhotoUnion[];
};

const DIFFICULTY_LEVELS = [
  { value: 'EASY', label: 'Makkelijk', color: 'text-green-600 bg-green-100' },
  { value: 'MEDIUM', label: 'Gemiddeld', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'HARD', label: 'Moeilijk', color: 'text-red-600 bg-red-100' }
];

const RECIPE_CATEGORIES = [
  'Hoofdgerecht', 'Voorgerecht', 'Dessert', 'Snack', 'Soep', 'Salade',
  'Pasta', 'Rijst', 'Vlees', 'Vis', 'Vegetarisch', 'Veganistisch',
  'Glutenvrij', 'Aziatisch', 'Mediterraans', 'Italiaans', 'Frans',
  'Spaans', 'Duits', 'Nederlands', 'Fusion', 'Street Food', 'Brunch'
];

const COMMON_TAGS = [
  'Snel', 'Gezond', 'Budget', 'Comfort Food', 'Feest', 'Weekend',
  'Werklunch', 'Meal Prep', 'One Pot', 'Oven', 'Grill', 'Slow Cooker',
  'Kruidig', 'Zoet', 'Zout', 'Zuur', 'Romig', 'Knapperig'
];

interface RecipeManagerProps {
  isActive?: boolean;
}

export default function RecipeManager({ isActive = true }: RecipeManagerProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Auto-hide message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Clear message when component becomes inactive
  useEffect(() => {
    if (!isActive && message) {
      setMessage(null);
    }
  }, [isActive, message]);
  
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    ingredients: [''],
    instructions: [''],
    prepTime: '',
    servings: '',
    difficulty: 'EASY',
    category: '',
    tags: [],
    isPrivate: true,
    photos: []
  });

  const mainPhotos = formData.photos.filter(photo => !photo.stepNumber);

  // Load recipes on component mount
  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile/dishes');
      if (response.ok) {
        const data = await response.json();
        const dishes = data.items || [];
        
        
        // Transform dishes to recipes
        const recipes: Recipe[] = dishes.map((dish: any) => ({
          id: dish.id,
          title: dish.title || '',
          description: dish.description || '',
          ingredients: dish.ingredients || [],
          instructions: dish.instructions || [],
          prepTime: dish.prepTime ?? null,
          servings: dish.servings ?? null,
          difficulty: dish.difficulty || 'EASY',
          category: dish.category || '',
          tags: dish.tags || [],
          photos: dish.photos?.map((photo: any) => ({
            id: photo.id,
            url: photo.url,
            isMain: photo.isMain || false,
            stepNumber: photo.stepNumber,
            description: photo.description
          })) || [],
          isPrivate: dish.status === 'PRIVATE',
          createdAt: dish.createdAt,
          updatedAt: dish.updatedAt
        }));
        
        setRecipes(recipes);
      } else {
        console.error('Failed to load recipes');
        setRecipes([]);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async () => {
    try {
      const recipeData = {
        ...formData,
        prepTime: parseInt(formData.prepTime),
        servings: parseInt(formData.servings),
        ingredients: formData.ingredients.filter(ing => ing.trim() !== ''),
        instructions: formData.instructions.filter(inst => inst.trim() !== ''),
        photos: formData.photos
      };

      // Separate main photos from step photos
      const mainPhotos = recipeData.photos.filter(photo => !photo.stepNumber);
      const stepPhotos = recipeData.photos.filter(photo => photo.stepNumber !== undefined);

      const payload = {
        title: recipeData.title,
        description: recipeData.description,
        status: recipeData.isPrivate ? 'PRIVATE' : 'PUBLISHED',
        photos: mainPhotos.map((photo, index) => ({
          url: photo.url,
          idx: index,
            isMain: ('isMain' in photo ? photo.isMain : false) || index === 0
        })),
        stepPhotos: stepPhotos.map((photo, index) => ({
          url: photo.url,
          stepNumber: photo.stepNumber,
          idx: index,
          description: photo.description || ''
        })),
        category: 'CHEFF', // Default category for recipes
        subcategory: recipeData.category,
        priceCents: null,
        deliveryMode: null,
        place: null,
        lat: null,
        lng: null,
        stock: 0,
        maxStock: null,
        // Add recipe-specific data
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        prepTime: recipeData.prepTime,
        servings: recipeData.servings,
        difficulty: recipeData.difficulty,
        tags: recipeData.tags
      };

      // Use PATCH for updating existing recipe, POST for creating new one
      const isEditing = editingRecipe !== null;
      const url = isEditing ? `/api/profile/dishes/${editingRecipe.id}` : '/api/profile/dishes';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Reset form
        setFormData({
          title: '',
          description: '',
          ingredients: [''],
          instructions: [''],
          prepTime: '',
          servings: '',
          difficulty: 'EASY',
          category: '',
          tags: [],
          isPrivate: true,
          photos: []
        });
        setShowForm(false);
        setEditingRecipe(null);
        setMessage({ type: 'success', text: isEditing ? 'Recept bijgewerkt!' : 'Recept opgeslagen!' });
        
        // Reload recipes
        loadRecipes();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: errorData.error || 'Fout bij opslaan van recept' });
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      setMessage({ type: 'error', text: 'Fout bij opslaan van recept' });
    }
  };

  const handleSellRecipe = (recipe: Recipe) => {
    console.log('handleSellRecipe called with recipe:', recipe);
    
    // Store recipe data in sessionStorage for the product form to use
    const recipeData = {
      title: recipe.title,
      description: recipe.description || '',
      ingredients: recipe.ingredients,
      photos: recipe.photos.filter(photo => !photo.stepNumber), // Only main photos
      prepTime: recipe.prepTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      category: recipe.category,
      tags: recipe.tags
    };
    
    console.log('Prepared recipe data for sessionStorage:', recipeData);
    
    const jsonData = JSON.stringify(recipeData);
    console.log('JSON data to store:', jsonData);
    
    // Store in both sessionStorage and localStorage as backup
    sessionStorage.setItem('recipeToProductData', jsonData);
    localStorage.setItem('recipeToProductData', jsonData);
    
    // Verify data was stored
    const storedData = sessionStorage.getItem('recipeToProductData');
    console.log('Data stored in sessionStorage:', storedData);
    
    // Navigate to product creation form
    console.log('Navigating to product form...');
    window.location.href = '/sell/new?fromRecipe=true';
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('Weet je zeker dat je dit recept wilt verwijderen?')) return;
    
    try {
      const response = await fetch(`/api/profile/dishes/${recipeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Recept verwijderd!' });
        loadRecipes(); // Reload recipes to update the list
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: errorData.error || 'Fout bij verwijderen van recept' });
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      setMessage({ type: 'error', text: 'Fout bij verwijderen van recept' });
    }
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
    }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Mijn Recepten</h3>
          <p className="text-sm text-gray-500">Bewaar je favoriete recepten met foto's</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuw Recept
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Zoek in recepten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">Alle categorieën</option>
          {RECIPE_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recipe Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingRecipe ? 'Recept Bewerken' : 'Nieuw Recept'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingRecipe(null);
                    setFormData({
                      title: '',
                      description: '',
                      ingredients: [''],
                      instructions: [''],
                      prepTime: '',
                      servings: '',
                      difficulty: 'EASY',
                      category: '',
                      tags: [],
                      isPrivate: true,
                      photos: []
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
      {/* Message Display - Only show when component is active */}
      {message && isActive && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receptnaam *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Bijv. Pasta Carbonara"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Selecteer categorie</option>
                    {RECIPE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschrijving
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Korte beschrijving van het recept..."
                />
              </div>

              {/* Recipe Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bereidingstijd (min)
                  </label>
                  <input
                    type="number"
                    value={formData.prepTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, prepTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aantal personen
                  </label>
                  <input
                    type="number"
                    value={formData.servings}
                    onChange={(e) => setFormData(prev => ({ ...prev, servings: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moeilijkheidsgraad
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {DIFFICULTY_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.tags.includes(tag)
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingrediënten
                </label>
                <div className="space-y-2">
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => updateIngredient(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Bijv. 400g spaghetti"
                      />
                      {formData.ingredients.length > 1 && (
                        <button
                          onClick={() => removeIngredient(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addIngredient}
                    className="flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ingrediënt toevoegen
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bereidingswijze
                </label>
                <div className="space-y-3">
                  {formData.instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <textarea
                          value={instruction}
                          onChange={(e) => updateInstruction(index, e.target.value)}
                          rows={2}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Beschrijf deze stap..."
                        />
                        {formData.instructions.length > 1 && (
                          <button
                            onClick={() => removeInstruction(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addInstruction}
                    className="flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Stap toevoegen
                  </button>
                </div>
              </div>

              {/* Step-by-step Photos */}
              <div>
                <RecipeStepPhotos
                  steps={formData.instructions.filter(inst => inst.trim() !== '')}
                  photos={formData.photos.filter(photo => photo.stepNumber !== undefined) as any}
                  onPhotosChange={(newStepPhotos: any) => {
                    setFormData(prev => {
                      const mainPhotos = prev.photos.filter(photo => !photo.stepNumber);
                      const photosArray = Array.isArray(newStepPhotos) 
                        ? newStepPhotos
                        : newStepPhotos(prev.photos.filter(photo => photo.stepNumber !== undefined));
                      return { 
                        ...prev, 
                        photos: [...mainPhotos, ...photosArray]
                      };
                    });
                  }}
                  maxPhotosPerStep={2}
                  maxTotalPhotos={10}
                />
              </div>

              {/* Main Recipe Photo */}
              <div>
                <RecipePhotoUpload
                  photos={formData.photos.filter(photo => {
                    return !photo.stepNumber;
                  }).map(photo => ({
                    ...photo,
                    isMain: 'isMain' in photo ? photo.isMain : false
                  }))}
                  onPhotosChange={(newMainPhotos: any) => {
                    setFormData(prev => {
                      const stepPhotos = prev.photos.filter(photo => photo.stepNumber !== undefined);
                      const photosArray = Array.isArray(newMainPhotos) 
                        ? newMainPhotos
                        : newMainPhotos(prev.photos.filter(photo => !photo.stepNumber));
                      return {
                        ...prev,
                        photos: [...photosArray, ...stepPhotos]
                      };
                    });
                  }}
                  maxPhotos={3}
                />
              </div>

              {/* Privacy Setting */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="isPrivate" className="text-sm text-gray-700">
                  Privé recept (alleen voor jou zichtbaar)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingRecipe(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveRecipe}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingRecipe ? 'Bijwerken' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Grid/List */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12">
          <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen recepten</h3>
          <p className="text-gray-500 mb-4">Begin met het toevoegen van je eerste recept</p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            Eerste recept toevoegen
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {filteredRecipes.map(recipe => (
            <div
              key={recipe.id}
              className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow ${
                viewMode === 'list' ? 'flex' : ''
              }`}
            >
              {/* Recipe Image */}
              <div className={`${viewMode === 'list' ? 'w-48 h-32' : 'h-48'} bg-gray-100 flex items-center justify-center`}>
                {recipe.photos.length > 0 ? (
                  <img
                    src={recipe.photos[0].url}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-12 h-12 text-gray-400" />
                )}
              </div>

              {/* Recipe Content */}
              <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 line-clamp-1">{recipe.title}</h4>
                  <div className="flex items-center gap-1">
                    {recipe.isPrivate ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {recipe.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{recipe.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  {recipe.prepTime && recipe.prepTime > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {recipe.prepTime} min
                    </div>
                  )}
                  {recipe.servings && recipe.servings > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {recipe.servings} pers.
                    </div>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    DIFFICULTY_LEVELS.find(d => d.value === recipe.difficulty)?.color || 'text-gray-600 bg-gray-100'
                  }`}>
                    {DIFFICULTY_LEVELS.find(d => d.value === recipe.difficulty)?.label}
                  </span>
                </div>

                {recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {recipe.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {recipe.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{recipe.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(recipe.createdAt).toLocaleDateString('nl-NL')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        // Load full recipe data including step photos
                        try {
                          const response = await fetch(`/api/profile/dishes/${recipe.id}`);
                          if (response.ok) {
                            const data = await response.json();
                            const fullRecipe = data.item;
                            
                            setEditingRecipe(fullRecipe);
                            setFormData({
                              title: fullRecipe.title,
                              description: fullRecipe.description || '',
                              ingredients: fullRecipe.ingredients || [],
                              instructions: fullRecipe.instructions || [],
                              prepTime: fullRecipe.prepTime ? fullRecipe.prepTime.toString() : '',
                              servings: fullRecipe.servings ? fullRecipe.servings.toString() : '',
                              difficulty: fullRecipe.difficulty || 'EASY',
                              category: fullRecipe.category || '',
                              tags: fullRecipe.tags || [],
                              isPrivate: fullRecipe.status === 'PRIVATE',
                              photos: fullRecipe.photos || []
                            });
                            setShowForm(true);
                          } else {
                            console.error('Failed to load recipe details');
                            // Fallback to basic recipe data
                            setEditingRecipe(recipe);
                            setFormData({
                              title: recipe.title,
                              description: recipe.description || '',
                              ingredients: recipe.ingredients,
                              instructions: recipe.instructions,
                              prepTime: recipe.prepTime ? recipe.prepTime.toString() : '',
                              servings: recipe.servings ? recipe.servings.toString() : '',
                              difficulty: recipe.difficulty || 'EASY',
                              category: recipe.category || '',
                              tags: recipe.tags || [],
                              isPrivate: recipe.isPrivate,
                              photos: recipe.photos
                            });
                            setShowForm(true);
                          }
                        } catch (error) {
                          console.error('Error loading recipe:', error);
                          // Fallback to basic recipe data
                          setEditingRecipe(recipe);
                          setFormData({
                            title: recipe.title,
                            description: recipe.description || '',
                            ingredients: recipe.ingredients,
                            instructions: recipe.instructions,
                            prepTime: recipe.prepTime ? recipe.prepTime.toString() : '',
                            servings: recipe.servings ? recipe.servings.toString() : '',
                            difficulty: recipe.difficulty || 'EASY',
                            category: recipe.category || '',
                            tags: recipe.tags || [],
                            isPrivate: recipe.isPrivate,
                            photos: recipe.photos
                          });
                          setShowForm(true);
                        }
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSellRecipe(recipe)}
                      className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                      title="Recept verkopen als product"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecipe(recipe.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}