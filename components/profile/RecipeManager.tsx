"use client";

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Plus, Edit3, Trash2, Clock, Users, ChefHat, Camera, Save, X, Grid, List, ShoppingCart, PlayCircle } from "lucide-react";
import { useInspiratieFormOpener } from "@/hooks/useInspiratieFormOpener";
import { useTranslation } from '@/hooks/useTranslation';

// Lazy load heavy components for better performance
const RecipePhotoUpload = dynamic(() => import("./RecipePhotoUpload"), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

const RecipeStepPhotos = dynamic(() => import("./RecipeStepPhotos"), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

const VideoUploader = dynamic(() => import("@/components/ui/VideoUploader"), {
  loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

type RecipePhoto = {
  id: string;
  url: string;
  isMain: boolean;
  stepNumber?: number;
  description?: string;
  idx?: number;
};

type StepPhoto = {
  id: string;
  url: string;
  stepNumber: number;
  description?: string;
  idx?: number;
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
  video?: {
    url: string;
    thumbnail?: string | null;
    duration?: number | null;
  } | null;
  status?: 'PUBLIC' | 'PRIVATE';
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
  allowDownload: boolean;
  allowPrint: boolean;
  photos: RecipePhotoUnion[];
  video?: {
    url: string;
    thumbnail?: string | null;
    duration?: number | null;
  } | null;
};

// These will be defined inside the component to access t()

interface RecipeManagerProps {
  isActive?: boolean;
  userId?: string;
  isPublic?: boolean;
  hideAddButton?: boolean; // Hide the add button when used in overview mode
  autoOpenForm?: boolean; // Automatically open form when component mounts
}

export default function RecipeManager({ isActive = true, userId, isPublic = false, hideAddButton = false, autoOpenForm = false }: RecipeManagerProps) {
  const { t, getTranslationObject } = useTranslation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Get difficulty levels with translations
  const DIFFICULTY_LEVELS = [
    { value: 'EASY', label: t('recipe.difficultyLevels.EASY'), color: 'text-green-600 bg-green-100' },
    { value: 'MEDIUM', label: t('recipe.difficultyLevels.MEDIUM'), color: 'text-yellow-600 bg-yellow-100' },
    { value: 'HARD', label: t('recipe.difficultyLevels.HARD'), color: 'text-red-600 bg-red-100' }
  ];

  // Get recipe categories from translations - ensure it's an array
  const recipeCategoriesObj = getTranslationObject('recipe.categories');
  const RECIPE_CATEGORIES = Array.isArray(recipeCategoriesObj) ? recipeCategoriesObj : [];

  // Get common tags from translations - ensure it's an array
  const recipeTagsObj = getTranslationObject('recipe.tags');
  const COMMON_TAGS = Array.isArray(recipeTagsObj) ? recipeTagsObj : [];

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
    allowDownload: true,
    allowPrint: true,
    photos: [],
    video: null
  });

  const [stepPhotos, setStepPhotos] = useState<StepPhoto[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  const mainPhotos = formData.photos.filter(photo => !photo.stepNumber);

  // Load recipes on component mount
  useEffect(() => {
    loadRecipes();
  }, []);

  // Auto-load photo and open form using custom hook
  useInspiratieFormOpener({
    isActive,
    expectedLocation: 'keuken',
    componentName: 'RecipeManager',
    setShowForm,
    setFormData
  });

  // Auto-open form if autoOpenForm prop is set
  useEffect(() => {
    if (autoOpenForm && !showForm) {
      setShowForm(true);
    }
  }, [autoOpenForm, showForm]);

  // Prevent background scroll when form is open (Chrome-specific fix)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = /chrome/.test(userAgent) && !/edg|opr/.test(userAgent);
    const isEdge = /edg/.test(userAgent);

    // Only apply this fix for Chrome/Edge
    if (!isChrome && !isEdge) return;

    if (showForm) {
      // Save current scroll position
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      // Find all scrollable containers on the page (except the form itself)
      const allElements = document.querySelectorAll('*');
      const scrollableElements: Array<{ element: HTMLElement; originalStyles: { overflow: string; touchAction: string; position: string } }> = [];
      
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        // Skip the form itself and its children
        if (htmlEl.closest('[data-recipe-form]')) return;
        
        const style = window.getComputedStyle(htmlEl);
        const isScrollable = 
          style.overflow === 'auto' || 
          style.overflow === 'scroll' || 
          style.overflowY === 'auto' || 
          style.overflowY === 'scroll' ||
          style.overflowX === 'auto' || 
          style.overflowX === 'scroll';
        
        if (isScrollable && htmlEl.scrollHeight > htmlEl.clientHeight) {
          scrollableElements.push({
            element: htmlEl,
            originalStyles: {
              overflow: htmlEl.style.overflow || '',
              touchAction: htmlEl.style.touchAction || '',
              position: htmlEl.style.position || ''
            }
          });
          
          // Block scrolling on this element
          htmlEl.style.overflow = 'hidden';
          htmlEl.style.touchAction = 'none';
        }
      });
      
      // Prevent background scroll in Chrome
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = `-${scrollX}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      
      // Also prevent scroll on html element
      const html = document.documentElement;
      const originalHtmlOverflow = html.style.overflow;
      const originalHtmlTouchAction = html.style.touchAction;
      html.style.overflow = 'hidden';
      html.style.touchAction = 'none';
      
      // Prevent wheel events on window
      const preventWheel = (e: WheelEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-recipe-form]')) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      
      // Prevent touchmove events on window (except on form)
      const preventTouchMove = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-recipe-form]')) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      
      window.addEventListener('wheel', preventWheel, { passive: false, capture: true });
      window.addEventListener('touchmove', preventTouchMove, { passive: false, capture: true });
      
      return () => {
        // Restore all scrollable elements
        scrollableElements.forEach(({ element, originalStyles }) => {
          element.style.overflow = originalStyles.overflow;
          element.style.touchAction = originalStyles.touchAction;
          element.style.position = originalStyles.position;
        });
        
        // Restore body
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        
        // Restore html
        html.style.overflow = originalHtmlOverflow;
        html.style.touchAction = originalHtmlTouchAction;
        
        // Remove event listeners
        window.removeEventListener('wheel', preventWheel, { capture: true });
        window.removeEventListener('touchmove', preventTouchMove, { capture: true });
        
        // Restore scroll position
        window.scrollTo(scrollX, scrollY);
      };
    }
  }, [showForm]);

  // Chrome-specific scroll fix when form opens
  useEffect(() => {
    if (!showForm || typeof window === 'undefined') return;

    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = /chrome/.test(userAgent) && !/edg|opr/.test(userAgent);
    const isEdge = /edg/.test(userAgent);

    // Chrome needs help recognizing the scroll container
    const activateScroll = () => {
      const scrollContainer = document.querySelector('[data-recipe-form]') as HTMLElement;
      if (!scrollContainer) return;

      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobile = window.innerWidth < 768;

      // CRITICAL FIX: In portrait mode on mobile, force explicit height
      if (isPortrait && isMobile) {
        const vh = window.innerHeight;
        scrollContainer.style.maxHeight = `${vh}px`;
        scrollContainer.style.height = `${vh}px`;
        scrollContainer.style.minHeight = '0';
        // Remove any conflicting height styles
        scrollContainer.style.removeProperty('min-height');
      }

      // Ensure scroll properties are set
      scrollContainer.style.overflowY = 'auto';
      scrollContainer.style.overflowX = 'hidden';
      scrollContainer.style.touchAction = 'pan-y';
      (scrollContainer.style as any).WebkitOverflowScrolling = 'touch';
      scrollContainer.style.willChange = 'scroll-position';

      // Force Chrome to recognize scroll
      if (scrollContainer.scrollHeight > scrollContainer.clientHeight) {
        // Multiple attempts to activate scroll
        const attempts = [0, 50, 100, 200, 500];
        attempts.forEach((delay) => {
          setTimeout(() => {
            const currentScroll = scrollContainer.scrollTop;
            scrollContainer.scrollTop = currentScroll + 0.1;
            requestAnimationFrame(() => {
              scrollContainer.scrollTop = currentScroll;
              void scrollContainer.offsetHeight; // Force reflow
            });
          }, delay);
        });
      }
    };

    if (isChrome || isEdge) {
      // Activate immediately and after delays
      activateScroll();
      setTimeout(activateScroll, 100);
      setTimeout(activateScroll, 300);
      
      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobile = window.innerWidth < 768;
      // Extra attempts for portrait mode
      if (isPortrait && isMobile) {
        setTimeout(activateScroll, 500);
        setTimeout(activateScroll, 800);
      }

      // Listen for orientation changes to re-activate scroll
      const handleOrientationChange = () => {
        setTimeout(activateScroll, 100);
        setTimeout(activateScroll, 300);
      };

      window.addEventListener('orientationchange', handleOrientationChange);
      window.addEventListener('resize', handleOrientationChange);

      return () => {
        window.removeEventListener('orientationchange', handleOrientationChange);
        window.removeEventListener('resize', handleOrientationChange);
      };
    }
  }, [showForm]);

  // Prevent aggressive scrolling on mobile when inputs are focused
  useEffect(() => {
    if (!showForm || typeof window === 'undefined') return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') && window.innerWidth < 768) {
        // On mobile, wait for keyboard and then scroll smoothly to center the input
        setTimeout(() => {
          const rect = target.getBoundingClientRect();
          const scrollContainer = document.querySelector('[data-recipe-form]') as HTMLElement;
          const viewportHeight = window.innerHeight;
          
          if (scrollContainer && rect.bottom > viewportHeight * 0.7) {
            // Only scroll if input is in lower part of screen
            const containerRect = scrollContainer.getBoundingClientRect();
            const scrollTop = scrollContainer.scrollTop;
            const targetTop = rect.top - containerRect.top + scrollTop;
            // Center the input with some padding for keyboard
            const centerPosition = targetTop - (viewportHeight * 0.3);
            
            scrollContainer.scrollTo({
              top: Math.max(0, centerPosition),
              behavior: 'smooth'
            });
          }
        }, 350); // Wait for keyboard animation
      }
    };

    const formContainer = document.querySelector('[data-recipe-form]');
    if (formContainer) {
      formContainer.addEventListener('focusin', handleFocusIn as EventListener, { passive: true });
      return () => {
        formContainer.removeEventListener('focusin', handleFocusIn as EventListener);
      };
    }
  }, [showForm]);

  // Load photo from sessionStorage or localStorage when form opens
  useEffect(() => {
    if (showForm) {
      console.log('=== RecipeManager: Form opened, checking for photo ===');
      console.log('All sessionStorage keys:', Object.keys(sessionStorage));
      console.log('All localStorage keys:', Object.keys(localStorage));
      
      // Check both sessionStorage and localStorage (backup)
      const getPhoto = () => {
        return sessionStorage.getItem('inspiratiePhoto') 
          || sessionStorage.getItem('quickAddPhoto')
          || localStorage.getItem('pendingInspiratiePhoto');
      };
      
      const inspiratiePhoto = getPhoto();
      const isVideo = inspiratiePhoto?.startsWith('data:video/') || false;
      const mainPhotos = formData.photos.filter(photo => !photo.stepNumber);
      
      if (inspiratiePhoto && (mainPhotos.length === 0 || (!formData.video && isVideo))) {
        if (isVideo) {
          console.log('Video found, adding to form...');
          // For videos, we need to upload it first to get a proper URL
          // For now, we'll set it as a data URL and let VideoUploader handle it
          setFormData(prev => ({
            ...prev,
            video: {
              url: inspiratiePhoto,
              thumbnail: null,
              duration: null
            }
          }));
        } else {
          console.log('Photo found, adding to form...');
          const newPhoto = {
            id: `temp-${Date.now()}`,
            url: inspiratiePhoto,
            isMain: true
          };
          
          setFormData(prev => {
            const existingStepPhotos = (prev.photos || []).filter((p: any) => p.stepNumber !== undefined);
            return {
              ...prev,
              photos: [newPhoto, ...existingStepPhotos]
            };
          });
        }
        
        // Clean up after a delay
        setTimeout(() => {
          sessionStorage.removeItem('inspiratiePhoto');
          sessionStorage.removeItem('inspiratieLocation');
          sessionStorage.removeItem('quickAddPhoto');
          localStorage.removeItem('pendingInspiratiePhoto');
          localStorage.removeItem('pendingInspiratieLocation');
        }, 2000);
      } else if (!inspiratiePhoto) {
        // Retry a few times in case photo is being written
        let attempts = 0;
        const retry = setInterval(() => {
          attempts++;
          const photo = getPhoto();
          const isVideo = photo?.startsWith('data:video/') || false;
          if (photo && (formData.photos.filter(p => !p.stepNumber).length === 0 || (!formData.video && isVideo))) {
            if (isVideo) {
              console.log(`Retry ${attempts}: Video found, adding to form...`);
              setFormData(prev => ({
                ...prev,
                video: {
                  url: photo,
                  thumbnail: null,
                  duration: null
                }
              }));
            } else {
              console.log(`Retry ${attempts}: Photo found, adding to form...`);
              const newPhoto = {
                id: `temp-${Date.now()}-retry${attempts}`,
                url: photo,
                isMain: true
              };
              setFormData(prev => {
                const existingStepPhotos = (prev.photos || []).filter((p: any) => p.stepNumber !== undefined);
                return {
                  ...prev,
                  photos: [newPhoto, ...existingStepPhotos]
                };
              });
            }
            clearInterval(retry);
            
            // Clean up
            setTimeout(() => {
              sessionStorage.removeItem('inspiratiePhoto');
              sessionStorage.removeItem('inspiratieLocation');
              sessionStorage.removeItem('quickAddPhoto');
              localStorage.removeItem('pendingInspiratiePhoto');
              localStorage.removeItem('pendingInspiratieLocation');
            }, 2000);
          } else if (attempts >= 10) {
            console.log('No photo found after 10 attempts');
            clearInterval(retry);
          }
        }, 200);
      }
    }
  }, [showForm]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const apiUrl = userId ? `/api/profile/dishes?userId=${userId}` : '/api/profile/dishes';
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        const dishes = data.items || [];

        // Transform dishes to recipes
        const recipes: Recipe[] = dishes
          .filter((dish: any) => {
            if (dish.category !== 'CHEFF') return false;
            
            if (isPublic) {
              return dish.status === 'PUBLISHED' && dish.ingredients && dish.instructions;
            }
            
            // In private mode (Mijn Recepten tab), toon ALLE recepten
            return true;
          })
          .map((dish: any) => ({
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
            photos: [
              ...(dish.photos?.map((photo: any) => ({
                id: photo.id,
                url: photo.url,
                isMain: photo.isMain || false,
                stepNumber: undefined,
                description: undefined
              })) || []),
              ...(dish.stepPhotos?.map((stepPhoto: any) => ({
                id: stepPhoto.id,
                url: stepPhoto.url,
                isMain: false,
                stepNumber: stepPhoto.stepNumber,
                description: stepPhoto.description
              })) || [])
            ],
            video: dish.video || null,
            status: dish.status || 'PUBLIC',
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
      // Validation
      if (!formData.title || formData.title.trim() === '') {
        setMessage({ type: 'error', text: t('recipe.titleRequired') });
        return;
      }

      const filteredIngredients = formData.ingredients.filter(ing => ing.trim() !== '');
      const filteredInstructions = formData.instructions.filter(inst => inst.trim() !== '');

      if (filteredIngredients.length === 0) {
        setMessage({ type: 'error', text: t('recipe.ingredientRequired') });
        return;
      }

      if (filteredInstructions.length === 0) {
        setMessage({ type: 'error', text: t('recipe.instructionRequired') });
        return;
      }

      const recipeData = {
        ...formData,
        prepTime: formData.prepTime && formData.prepTime.trim() !== '' ? parseInt(formData.prepTime) : null,
        servings: formData.servings && formData.servings.trim() !== '' ? parseInt(formData.servings) : null,
        ingredients: filteredIngredients,
        instructions: filteredInstructions,
        photos: formData.photos
      };

      // Use main photos from formData and step photos from state
      const mainPhotos = recipeData.photos.filter(photo => !photo.stepNumber);

      const payload = {
        title: recipeData.title,
        description: recipeData.description,
        status: isPrivate ? 'PRIVATE' : 'PUBLISHED',
        photos: mainPhotos.map((photo, index) => ({
          url: photo.url,
          idx: index,
            isMain: ('isMain' in photo ? photo.isMain : false) || index === 0
        })),
        stepPhotos: stepPhotos.map((photo) => ({
          url: photo.url,
          stepNumber: photo.stepNumber,
          idx: photo.idx || 0,
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
        tags: recipeData.tags,
        // Always include video field - send null if deleted, object if present
        video: formData.video ? {
          url: formData.video.url,
          thumbnail: formData.video.thumbnail || null,
          duration: formData.video.duration || null
        } : null
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
          allowDownload: true,
          allowPrint: true,
          photos: [],
          video: null
        });
        setCustomCategory('');
        setShowCustomCategoryInput(false);
        setIsPrivate(false);
        setShowForm(false);
        setEditingRecipe(null);
        setMessage({ type: 'success', text: isEditing ? t('recipe.updated') : t('recipe.saved') });
        
        // Reload recipes
        loadRecipes();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: errorData.error || t('recipe.saveError') });
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      setMessage({ type: 'error', text: t('recipe.saveError') });
    }
  };

  const handleSellRecipe = (recipe: Recipe) => {

    // Store recipe data in sessionStorage for the product form to use
    const mainPhotos = recipe.photos.filter(photo => !photo.stepNumber); // Only main photos
    const recipeData = {
      title: recipe.title,
      description: recipe.description || '',
      ingredients: recipe.ingredients,
      photos: mainPhotos,
      prepTime: recipe.prepTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      category: recipe.category,
      tags: recipe.tags
    };

    const jsonData = JSON.stringify(recipeData);

    // Store in both sessionStorage and localStorage as backup
    sessionStorage.setItem('recipeToProductData', jsonData);
    localStorage.setItem('recipeToProductData', jsonData);
    
    // Verify data was stored
    const storedData = sessionStorage.getItem('recipeToProductData');

    // If there are more than 5 photos, go to photo selection page first
    // Otherwise go directly to the form
    if (mainPhotos.length > 5) {
      window.location.href = '/sell/select-photos?source=recipe';
    } else {
      window.location.href = '/sell/new?fromRecipe=true';
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm(t('errors.confirmDeleteRecipe'))) return;
    
    try {
      const response = await fetch(`/api/profile/dishes/${recipeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: t('recipe.deleted') });
        loadRecipes(); // Reload recipes to update the list
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: errorData.error || t('recipe.deleteError') });
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      setMessage({ type: 'error', text: t('recipe.deleteError') });
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
          <h3 className="text-lg font-semibold text-gray-900">{t('recipe.myRecipes')}</h3>
          <p className="text-sm text-gray-500">{t('recipe.myRecipesDesc')}</p>
        </div>
        {!isPublic && !hideAddButton && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('recipe.newRecipe')}
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t('common.searchInRecipes')}
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
          <option value="">{t('recipe.allCategories')}</option>
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-hidden" 
          style={{ 
            touchAction: typeof window !== 'undefined' && /chrome/.test(navigator.userAgent.toLowerCase()) && !/edg|opr/.test(navigator.userAgent.toLowerCase()) 
              ? 'none' // Chrome: block all touch events on overlay
              : 'pan-y', // Other browsers: allow vertical pan
            position: 'fixed',
            overscrollBehavior: 'contain'
          }}
          onTouchMove={(e) => {
            // Chrome-specific: prevent background scroll
            const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
            const isChrome = /chrome/.test(userAgent) && !/edg|opr/.test(userAgent);
            const isEdge = /edg/.test(userAgent);
            
            if (isChrome || isEdge) {
              // Only allow touch events on the form itself, not on the overlay
              const target = e.target as HTMLElement;
              if (!target.closest('[data-recipe-form]')) {
                e.preventDefault();
                e.stopPropagation();
              }
            }
          }}
        >
          {/* For Chrome: absolute parent should NOT be scrollable, inner div is scroll container */}
          <div 
            className="absolute inset-0" 
            style={{ 
              touchAction: typeof window !== 'undefined' && /chrome/.test(navigator.userAgent.toLowerCase()) && !/edg|opr/.test(navigator.userAgent.toLowerCase())
                ? 'none' // Chrome: block touch on parent container
                : 'pan-y', // Other browsers: allow vertical pan
              overflow: 'visible',
              pointerEvents: 'auto' // Allow clicks
            }}
          >
            <div className="min-h-full flex items-start sm:items-center justify-center p-0 sm:p-4">
              <div 
                className="bg-white rounded-none sm:rounded-xl max-w-4xl w-full sm:min-h-0 sm:max-h-[90vh] sm:my-auto overflow-y-auto overscroll-contain" 
                style={{ 
                  touchAction: 'pan-y pinch-zoom', 
                  WebkitOverflowScrolling: 'touch',
                  // Chrome-specific: ensure scroll container is recognized
                  willChange: 'scroll-position',
                  // Force Chrome to recognize this as scrollable
                  position: 'relative' as any,
                  // Portrait mode fix: ensure container can scroll
                  overscrollBehavior: 'contain',
                  overscrollBehaviorY: 'auto',
                  // CRITICAL: In portrait mode on mobile, set explicit max-height based on viewport
                  ...(typeof window !== 'undefined' && window.innerWidth < 768 && window.innerHeight > window.innerWidth ? {
                    maxHeight: `${window.innerHeight}px`,
                    height: `${window.innerHeight}px`
                  } : {})
                }} 
                data-recipe-form
                ref={(el) => {
                  // Chrome-specific fix: Force scroll recognition when modal opens
                  if (el) {
                    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
                    const isChrome = /chrome/.test(userAgent) && !/edg|opr/.test(userAgent);
                    const isEdge = /edg/.test(userAgent);
                    const isPortrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
                    
                    // In portrait mode, force explicit height
                    if (isPortrait && window.innerWidth < 768) {
                      const vh = window.innerHeight;
                      el.style.maxHeight = `${vh}px`;
                      el.style.height = `${vh}px`;
                      el.style.minHeight = '0';
                    }
                    
                    if ((isChrome || isEdge) && el.scrollHeight > el.clientHeight) {
                      // Force Chrome to recognize scroll container
                      requestAnimationFrame(() => {
                        // Small scroll movement to activate
                        const currentScroll = el.scrollTop;
                        el.scrollTop = currentScroll + 0.1;
                        requestAnimationFrame(() => {
                          el.scrollTop = currentScroll;
                          // Force reflow
                          void el.offsetHeight;
                        });
                      });
                    }
                  }
                }}
              >
                <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-200 z-10 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {editingRecipe ? t('recipe.editRecipe') : t('recipe.newRecipe')}
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
                          allowDownload: true,
                          allowPrint: true,
                          photos: [],
                          video: null
                        });
                        setCustomCategory('');
                        setShowCustomCategoryInput(false);
                        setIsPrivate(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-6 pb-32">
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

              {/* Video Upload */}
              <div>
                <VideoUploader
                  value={formData.video || null}
                  onChange={(video) => {
                    setFormData(prev => ({ ...prev, video: video || null }));
                  }}
                  maxDuration={30}
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

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('recipe.recipeName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation"
                    placeholder={t('common.exampleRecipe')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('recipe.category')}
                  </label>
                  <select
                    value={
                      formData.category && !RECIPE_CATEGORIES.includes(formData.category)
                        ? '__CUSTOM__'
                        : formData.category
                    }
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        // Keep current category if it's custom, otherwise clear
                        if (formData.category && !RECIPE_CATEGORIES.includes(formData.category)) {
                          setCustomCategory(formData.category);
                        } else {
                          setCustomCategory('');
                          setFormData(prev => ({ ...prev, category: '' }));
                        }
                        setShowCustomCategoryInput(true);
                      } else {
                        setFormData(prev => ({ ...prev, category: e.target.value }));
                        setCustomCategory('');
                        setShowCustomCategoryInput(false);
                      }
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation"
                  >
                    <option value="">{t('recipe.selectCategory')}</option>
                    {RECIPE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__CUSTOM__">{t('recipe.customCategory')}</option>
                  </select>
                  {showCustomCategoryInput || (formData.category && !RECIPE_CATEGORIES.includes(formData.category)) ? (
                    <input
                      type="text"
                      value={customCategory || (formData.category && !RECIPE_CATEGORIES.includes(formData.category) ? formData.category : '')}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomCategory(value);
                        setFormData(prev => ({ ...prev, category: value }));
                      }}
                      placeholder={t('recipe.enterCustomCategory')}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  ) : null}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('recipe.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation resize-none"
                  placeholder={t('common.shortRecipeDescription')}
                />
              </div>

              {/* Recipe Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('recipe.prepTime')}
                  </label>
                  <input
                    type="number"
                    value={formData.prepTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, prepTime: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('recipe.servings')}
                  </label>
                  <input
                    type="number"
                    value={formData.servings}
                    onChange={(e) => setFormData(prev => ({ ...prev, servings: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation"
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('recipe.difficulty')}
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation"
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
                  {t('recipe.tags')}
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
                  {t('recipe.ingredients')}
                </label>
                <div className="space-y-2">
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => updateIngredient(index, e.target.value)}
                        className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation"
                        placeholder={t('common.example') + ' 400g spaghetti'}
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
                    {t('recipe.addIngredient')}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('recipe.instructions')}
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
                          className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation resize-none"
                          placeholder={t('common.describeStep')}
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
                    {t('recipe.addStep')}
                  </button>
                </div>
              </div>

              {/* Step-by-step Photos */}
              <div>
                <RecipeStepPhotos
                  steps={formData.instructions.filter(inst => inst.trim() !== '')}
                  photos={stepPhotos}
                  onPhotosChange={setStepPhotos}
                  maxPhotosPerStep={5}
                  maxTotalPhotos={30}
                />
              </div>

                </div>

                <div className="sticky bottom-0 bg-white p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm z-10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      Privé opslaan
                      {isPrivate && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-300">
                          Privé
                        </span>
                      )}
                    </span>
                  </label>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingRecipe(null);
                        setIsPrivate(false);
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {t('recipe.cancel')}
                    </button>
                    <button
                      onClick={handleSaveRecipe}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {editingRecipe ? t('recipe.update') : t('recipe.save')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Grid/List */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12">
          <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('recipe.noRecipes')}</h3>
          <p className="text-gray-500 mb-4">{t('recipe.noRecipesDesc')}</p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            {t('recipe.addFirstRecipe')}
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
              className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                viewMode === 'list' ? 'flex' : ''
              }`}
              onClick={(e) => {
                // Don't navigate if clicking on video controls
                const target = e.target as HTMLElement;
                if (target.closest('video') || target.tagName === 'VIDEO') {
                  return;
                }
                window.location.href = `/recipe/${recipe.id}`;
              }}
            >
              {/* Recipe Image/Video */}
              <div className={`${viewMode === 'list' ? 'w-48 h-32' : 'h-48'} bg-gray-100 flex items-center justify-center relative overflow-hidden`}>
                {recipe.photos.length > 0 || recipe.video ? (
                  <>
                    {recipe.video ? (
                      <div 
                        className="relative w-full h-full"
                        onClick={(e) => {
                          // Prevent navigation when clicking on video
                          e.stopPropagation();
                        }}
                      >
                        <video
                          src={recipe.video.url}
                          poster={recipe.video.thumbnail || recipe.photos[0]?.url}
                          className="w-full h-full object-cover"
                          controls
                          playsInline
                          preload="metadata"
                        />
                      </div>
                    ) : recipe.photos.length > 0 ? (
                      <img
                        src={recipe.photos[0].url}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </>
                ) : (
                  <Camera className="w-12 h-12 text-gray-400" />
                )}
              </div>

              {/* Recipe Content */}
              <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 line-clamp-1">{recipe.title}</h4>
                    {(recipe.status || 'PUBLIC') === 'PRIVATE' && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-300 flex-shrink-0">
                        Privé
                      </span>
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
                      onClick={async (e) => {
                        e.stopPropagation(); // Prevent card click
                        // Load full recipe data including step photos
                        try {
                          // Try the new public recipes endpoint first
                          let response = await fetch(`/api/recipes/${recipe.id}`);
                          let fullRecipe: any;
                          
                          if (response.ok) {
                            const data = await response.json();
                            fullRecipe = data.recipe;
                          } else {
                            // Fallback to the old endpoint for private recipes
                            response = await fetch(`/api/profile/dishes/${recipe.id}`);
                            if (response.ok) {
                              const data = await response.json();
                              fullRecipe = data.item;
                            } else {
                              console.error('Failed to load recipe details');
                              return;
                            }
                          }
                          
                          setEditingRecipe(fullRecipe);
                          // Separate main photos and step photos
                          const mainPhotos = (fullRecipe.photos || []).filter((photo: any) => !photo.stepNumber);
                          const stepPhotos = (fullRecipe.photos || []).filter((photo: any) => photo.stepNumber);
                          
                          const recipeCategory = fullRecipe.category || '';
                          setFormData({
                            title: fullRecipe.title,
                            description: fullRecipe.description || '',
                            ingredients: fullRecipe.ingredients || [],
                            instructions: fullRecipe.instructions || [],
                            prepTime: fullRecipe.prepTime ? fullRecipe.prepTime.toString() : '',
                            servings: fullRecipe.servings ? fullRecipe.servings.toString() : '',
                            difficulty: fullRecipe.difficulty || 'EASY',
                            category: recipeCategory,
                            tags: fullRecipe.tags || [],
                            allowDownload: true,
                            allowPrint: true,
                            photos: mainPhotos,
                            video: fullRecipe.video || null
                          });
                          
                          // Set custom category if it's not in the standard list
                          if (recipeCategory && !RECIPE_CATEGORIES.includes(recipeCategory)) {
                            setCustomCategory(recipeCategory);
                            setShowCustomCategoryInput(true);
                          } else {
                            setCustomCategory('');
                            setShowCustomCategoryInput(false);
                          }
                          
                          setStepPhotos(stepPhotos as StepPhoto[]);
                          setIsPrivate((fullRecipe.status || 'PUBLIC') === 'PRIVATE');
                          setShowForm(true);
                          
                          // Restore scroll after opening edit form (especially important if video exists)
                          setTimeout(() => {
                            const restoreScroll = () => {
                              const scrollContainers = document.querySelectorAll('[data-recipe-form], [data-garden-form], [data-design-form], [data-quickadd-form], [data-edit-product-form], [data-compact-chef-form], [data-compact-garden-form], [data-compact-designer-form]');
                              const isPortrait = window.innerHeight > window.innerWidth;
                              const isMobile = window.innerWidth < 768;
                              
                              scrollContainers.forEach((container) => {
                                const el = container as HTMLElement;
                                if (el) {
                                  // CRITICAL FIX: In portrait mode on mobile, force explicit height
                                  if (isPortrait && isMobile) {
                                    const vh = window.innerHeight;
                                    el.style.maxHeight = `${vh}px`;
                                    el.style.height = `${vh}px`;
                                    el.style.minHeight = '0';
                                  }
                                  
                                  el.style.overflowY = 'auto';
                                  el.style.overflowX = 'hidden';
                                  el.style.touchAction = 'pan-y';
                                  (el.style as any).WebkitOverflowScrolling = 'touch';
                                  void el.offsetHeight; // Force reflow
                                }
                              });
                            };
                            restoreScroll();
                            setTimeout(restoreScroll, 100);
                            setTimeout(restoreScroll, 300);
                            // Extra attempts for portrait mode
                            if (window.innerHeight > window.innerWidth && window.innerWidth < 768) {
                              setTimeout(restoreScroll, 500);
                              setTimeout(restoreScroll, 800);
                            }
                          }, 100);
                        } catch (error) {
                          console.error('Error loading recipe:', error);
                          // Fallback to basic recipe data
                          setEditingRecipe(recipe);
                          // Separate main photos and step photos
                          const mainPhotos = (recipe.photos || []).filter(photo => !photo.stepNumber);
                          const stepPhotos = (recipe.photos || []).filter(photo => photo.stepNumber);
                          
                          const recipeCategory = recipe.category || '';
                          setFormData({
                            title: recipe.title,
                            description: recipe.description || '',
                            ingredients: recipe.ingredients,
                            instructions: recipe.instructions,
                            prepTime: recipe.prepTime ? recipe.prepTime.toString() : '',
                            servings: recipe.servings ? recipe.servings.toString() : '',
                            difficulty: recipe.difficulty || 'EASY',
                            category: recipeCategory,
                            tags: recipe.tags || [],
                            allowDownload: true,
                            allowPrint: true,
                            photos: mainPhotos,
                            video: recipe.video || null
                          });
                          
                          // Set custom category if it's not in the standard list
                          if (recipeCategory && !RECIPE_CATEGORIES.includes(recipeCategory)) {
                            setCustomCategory(recipeCategory);
                            setShowCustomCategoryInput(true);
                          } else {
                            setCustomCategory('');
                            setShowCustomCategoryInput(false);
                          }
                          
                          setStepPhotos(stepPhotos as StepPhoto[]);
                          setIsPrivate((recipe.status || 'PUBLIC') === 'PRIVATE');
                          setShowForm(true);
                          
                          // Restore scroll after opening edit form (especially important if video exists)
                          setTimeout(() => {
                            const restoreScroll = () => {
                              const userAgent = navigator.userAgent.toLowerCase();
                              const isChrome = /chrome/.test(userAgent) && !/edg|opr/.test(userAgent);
                              const isEdge = /edg/.test(userAgent);
                              const isPortrait = window.innerHeight > window.innerWidth;
                              const isMobile = window.innerWidth < 768;
                              
                              const scrollContainers = document.querySelectorAll('[data-recipe-form], [data-garden-form], [data-design-form], [data-quickadd-form], [data-edit-product-form], [data-compact-chef-form], [data-compact-garden-form], [data-compact-designer-form]');
                              scrollContainers.forEach((container) => {
                                const el = container as HTMLElement;
                                if (!el) return;
                                
                                // CRITICAL FIX: In portrait mode on mobile, force explicit height based on viewport
                                if (isPortrait && isMobile) {
                                  const vh = window.innerHeight;
                                  el.style.maxHeight = `${vh}px`;
                                  el.style.height = `${vh}px`;
                                  el.style.minHeight = '0';
                                }
                                
                                el.style.overflowY = 'auto';
                                el.style.overflowX = 'hidden';
                                el.style.touchAction = 'pan-y';
                                (el.style as any).WebkitOverflowScrolling = 'touch';
                                
                                // Chrome-specific VERY aggressive fixes
                                if (isChrome || isEdge) {
                                  // Remove ALL potential blocking styles
                                  el.style.transform = '';
                                  el.style.webkitTransform = '';
                                  el.style.perspective = '';
                                  el.style.backfaceVisibility = '';
                                  
                                  // Force Chrome to recognize scrollable content
                                  if (el.scrollHeight > el.clientHeight) {
                                    // In portrait mode, use viewport height instead of scrollHeight
                                    if (isPortrait && isMobile) {
                                      const vh = window.innerHeight;
                                      el.style.height = `${vh}px`;
                                      el.style.maxHeight = `${vh}px`;
                                      el.style.minHeight = '0';
                                    } else {
                                      // In landscape or desktop, use scrollHeight
                                      el.style.height = `${el.scrollHeight}px`;
                                      el.style.maxHeight = `${el.scrollHeight}px`;
                                      el.style.minHeight = `${el.scrollHeight}px`;
                                    }
                                    
                                    // Force scrollbar to appear (then back to auto)
                                    const originalOverflow = el.style.overflowY;
                                    el.style.overflowY = 'scroll';
                                    void el.offsetHeight;
                                    el.style.overflowY = originalOverflow || 'auto';
                                    void el.offsetHeight;
                                  }
                                  
                                  // Force layout recalculation multiple times
                                  el.style.display = 'none';
                                  void el.offsetHeight;
                                  el.style.display = '';
                                  void el.offsetHeight;
                                  
                                  // Trigger scroll event and movement for Chrome
                                  if (el.scrollHeight > el.clientHeight) {
                                    const scrollEvent = new Event('scroll', { bubbles: true, cancelable: true });
                                    el.dispatchEvent(scrollEvent);
                                    
                                    // Multiple scroll movements
                                    const currentScroll = el.scrollTop;
                                    el.scrollTop = currentScroll + 1;
                                    requestAnimationFrame(() => {
                                      el.scrollTop = currentScroll;
                                      requestAnimationFrame(() => {
                                        el.scrollTop = currentScroll + 0.5;
                                        requestAnimationFrame(() => {
                                          el.scrollTop = currentScroll;
                                        });
                                      });
                                    });
                                  }
                                }
                                
                                void el.offsetHeight; // Force reflow
                              });
                            };
                            restoreScroll();
                            setTimeout(restoreScroll, 100);
                            setTimeout(restoreScroll, 300);
                            setTimeout(restoreScroll, 500); // Extra attempt for Chrome
                            setTimeout(restoreScroll, 800); // Another extra attempt for Chrome
                            // Extra attempts for portrait mode
                            if (window.innerHeight > window.innerWidth && window.innerWidth < 768) {
                              setTimeout(restoreScroll, 1000);
                              setTimeout(restoreScroll, 1500);
                            }
                          }, 100);
                        }
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title={t('common.edit')}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        handleSellRecipe(recipe);
                      }}
                      className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                      title={t('common.putForSale')}
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        handleDeleteRecipe(recipe.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title={t('common.delete')}
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