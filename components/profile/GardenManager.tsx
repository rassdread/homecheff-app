"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Edit3, Trash2, Calendar, Droplet, Sun, Grid, List, Sprout, ShoppingCart } from "lucide-react";
import GardenPhotoUpload from "./GardenPhotoUpload";
import GardenGrowthPhotos from "./GardenGrowthPhotos";
import VideoUploader from "@/components/ui/VideoUploader";
import { useInspiratieFormOpener } from "@/hooks/useInspiratieFormOpener";
import { useTranslation } from '@/hooks/useTranslation';

type GardenPhoto = {
  id: string;
  url: string;
  isMain: boolean;
  phaseNumber?: number;
  description?: string;
  idx?: number;
};

type GrowthPhoto = {
  id: string;
  url: string;
  phaseNumber: number;
  description?: string;
  idx?: number;
};

type GardenPhotoUnion = GardenPhoto | GrowthPhoto;

type GardenProject = {
  id: string;
  title: string;
  description?: string;
  plantType: string | null;
  plantDate: string | null;
  harvestDate: string | null;
  growthDuration: number | null; // in days
  sunlight: 'FULL' | 'PARTIAL' | 'SHADE' | null;
  waterNeeds: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  location: 'INDOOR' | 'OUTDOOR' | 'GREENHOUSE' | 'BALCONY' | null;
  soilType: string | null;
  plantDistance: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null;
  tags: string[];
  photos: GardenPhoto[];
  growthPhotos?: GrowthPhoto[]; // Separate growth photos array
  video?: {
    url: string;
    thumbnail?: string | null;
    duration?: number | null;
  } | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type GardenFormData = {
  title: string;
  description: string;
  plantType: string;
  plantDate: string;
  harvestDate: string;
  growthDuration: string;
  sunlight: 'FULL' | 'PARTIAL' | 'SHADE';
  waterNeeds: 'HIGH' | 'MEDIUM' | 'LOW';
  location: 'INDOOR' | 'OUTDOOR' | 'GREENHOUSE' | 'BALCONY';
  soilType: string;
  plantDistance: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  notes: string;
  photos: GardenPhotoUnion[];
  video?: {
    url: string;
    thumbnail?: string | null;
    duration?: number | null;
  } | null;
};

const DIFFICULTY_LEVELS = [
  { value: 'EASY', label: 'Makkelijk', color: 'text-green-600 bg-green-100', icon: '🌱' },
  { value: 'MEDIUM', label: 'Gemiddeld', color: 'text-yellow-600 bg-yellow-100', icon: '🌿' },
  { value: 'HARD', label: 'Gevorderd', color: 'text-red-600 bg-red-100', icon: '🌳' }
];

const PLANT_TYPES = [
  'Groenten', 'Fruit', 'Kruiden', 'Bloemen', 'Kamerplanten', 'Tuinplanten',
  'Moestuin', 'Struiken', 'Bomen', 'Zaden', 'Stekken'
];

const SUNLIGHT_OPTIONS = [
  { value: 'FULL', label: 'Vol zon', icon: '☀️', description: '6+ uur direct zonlicht' },
  { value: 'PARTIAL', label: 'Half schaduw', icon: '⛅', description: '3-6 uur zonlicht' },
  { value: 'SHADE', label: 'Schaduw', icon: '🌥️', description: '< 3 uur zonlicht' }
];

const WATER_OPTIONS = [
  { value: 'HIGH', label: 'Veel', icon: '💧💧💧', description: 'Dagelijks water' },
  { value: 'MEDIUM', label: 'Matig', icon: '💧💧', description: '2-3x per week' },
  { value: 'LOW', label: 'Weinig', icon: '💧', description: '1x per week' }
];

const LOCATION_OPTIONS = [
  { value: 'INDOOR', label: 'Binnen', icon: '🏠' },
  { value: 'OUTDOOR', label: 'Buiten', icon: '🌳' },
  { value: 'GREENHOUSE', label: 'Serre', icon: '🏡' },
  { value: 'BALCONY', label: 'Balkon', icon: '🪴' }
];

const SOIL_TYPES = [
  'Potgrond', 'Tuinaarde', 'Compost', 'Zaai- en stekgrond', 
  'Cactusgrond', 'Orchideeëngrond', 'Universele potgrond'
];

const COMMON_TAGS = [
  'Biologisch', 'Lokaal', 'Eetbaar', 'Medicijn', 'Zeldzaam',
  'Seizoensgebonden', 'Makkelijk', 'Snel groeiend', 'Winterhard',
  'Droogte resistent', 'Schaduw tolerant', 'Insect vriendelijk'
];

const GROWTH_PHASES = [
  { name: '🌱 Zaaien/Planten', description: 'Begin van je kweekproces' },
  { name: '🌿 Kiemen', description: 'Eerste groene scheuten verschijnen' },
  { name: '🌾 Groeien', description: 'Actieve groei en ontwikkeling' },
  { name: '🌺 Bloeien', description: 'Bloemen of vruchten verschijnen' },
  { name: '🍅 Oogsten', description: 'Eindresultaat en oogst' }
];

interface GardenManagerProps {
  isActive?: boolean;
  userId?: string;
  isPublic?: boolean;
  hideAddButton?: boolean; // Hide the add button when used in overview mode
  autoOpenForm?: boolean; // Automatically open form when component mounts
}

export default function GardenManager({ isActive = true, userId, isPublic = false, hideAddButton = false, autoOpenForm = false }: GardenManagerProps) {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<GardenProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<GardenProject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
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
  
  const [formData, setFormData] = useState<GardenFormData>({
    title: '',
    description: '',
    plantType: '',
    plantDate: '',
    harvestDate: '',
    growthDuration: '',
    sunlight: 'PARTIAL',
    waterNeeds: 'MEDIUM',
    location: 'OUTDOOR',
    soilType: '',
    plantDistance: '',
    difficulty: 'EASY',
    tags: [],
    notes: '',
    photos: [],
    video: null
  });

  const [growthPhotos, setGrowthPhotos] = useState<GrowthPhoto[]>([]);

  const mainPhotos = formData.photos.filter(photo => !photo.phaseNumber);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-load photo and open form using custom hook
  useInspiratieFormOpener({
    isActive,
    expectedLocation: 'tuin',
    componentName: 'GardenManager',
    setShowForm,
    setFormData
  });

  // Auto-open form if autoOpenForm prop is set
  useEffect(() => {
    if (autoOpenForm && !showForm) {
      setShowForm(true);
    }
  }, [autoOpenForm, showForm]);

  // Prevent aggressive scrolling on mobile when inputs are focused
  useEffect(() => {
    if (!showForm || typeof window === 'undefined') return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') && window.innerWidth < 768) {
        // On mobile, wait for keyboard and then scroll smoothly to center the input
        setTimeout(() => {
          const rect = target.getBoundingClientRect();
          const scrollContainer = document.querySelector('[data-garden-form]') as HTMLElement;
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

    const formContainer = document.querySelector('[data-garden-form]');
    if (formContainer) {
      formContainer.addEventListener('focusin', handleFocusIn as EventListener, { passive: true });
      return () => {
        formContainer.removeEventListener('focusin', handleFocusIn as EventListener);
      };
    }
  }, [showForm]);

  // Load photo from sessionStorage or localStorage when form opens
  useEffect(() => {
    if (!showForm) return;
    
    console.log('=== GardenManager: Form opened, checking for photo ===');
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
      const mainPhotos = formData.photos.filter(photo => !photo.phaseNumber);
      let retryInterval: NodeJS.Timeout | null = null;
      
      if (inspiratiePhoto && (mainPhotos.length === 0 || (!formData.video && isVideo))) {
        if (isVideo) {
          console.log('Video found, adding to form...');
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
            const existingPhasePhotos = (prev.photos || []).filter((p: any) => p.phaseNumber !== undefined);
            return {
              ...prev,
              photos: [newPhoto, ...existingPhasePhotos]
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
        retryInterval = setInterval(() => {
          attempts++;
          const photo = getPhoto();
          const isVideo = photo?.startsWith('data:video/') || false;
          if (photo && (formData.photos.filter(p => !p.phaseNumber).length === 0 || (!formData.video && isVideo))) {
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
                const existingPhasePhotos = (prev.photos || []).filter((p: any) => p.phaseNumber !== undefined);
                return {
                  ...prev,
                  photos: [newPhoto, ...existingPhasePhotos]
                };
              });
            }
          if (retryInterval) clearInterval(retryInterval);
          
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
          if (retryInterval) clearInterval(retryInterval);
        }
      }, 200);
    }
    
    return () => {
      if (retryInterval) clearInterval(retryInterval);
    };
  }, [showForm]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const apiUrl = userId ? `/api/profile/garden?userId=${userId}` : '/api/profile/garden';

      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];

        // Log all items to see what's coming from the API
        items.forEach((item: any, index: number) => {

        });
        
        // Transform items to projects
        const gardenProjects: GardenProject[] = items
          .filter((item: any) => {
            if (item.category !== 'GROWN') {

              return false;
            }
            
            if (isPublic) {
              const shouldShow = item.status === 'PUBLISHED';

              return shouldShow;
            }
            
            // In private mode (Mijn Tuin tab), toon ALLE kweken

            return true;
          })
          .map((item: any) => ({
            id: item.id,
            title: item.title || '',
            description: item.description || '',
            plantType: item.plantType || null,
            plantDate: item.plantDate || null,
            harvestDate: item.harvestDate || null,
            growthDuration: item.growthDuration ?? null,
            sunlight: item.sunlight || null,
            waterNeeds: item.waterNeeds || null,
            location: item.location || null,
            soilType: item.soilType || null,
            plantDistance: item.plantDistance || null,
            difficulty: item.difficulty || 'EASY',
            tags: item.tags || [],
            photos: item.photos?.map((photo: any) => ({
              id: photo.id,
              url: photo.url,
              isMain: photo.isMain || false,
              phaseNumber: undefined,
              description: undefined
            })) || [],
            growthPhotos: item.growthPhotos?.map((growthPhoto: any) => ({
              id: growthPhoto.id,
              url: growthPhoto.url,
              phaseNumber: growthPhoto.phaseNumber,
              description: growthPhoto.description,
              idx: growthPhoto.idx || 0
            })) || [],
            video: item.video || null,
            notes: item.notes || '',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          }));

        setProjects(gardenProjects);
      } else {
        console.error('❌ Failed to load garden projects - HTTP', response.status);
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Error response:', errorText);
        setProjects([]);
      }
    } catch (error) {
      console.error('❌ Error loading garden projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    try {
      // Client-side validation with detailed messages
      const errors: string[] = [];
      
      if (!formData.title.trim()) {
        errors.push('Plant naam is verplicht');
      }
      
      const photoCount = formData.photos.filter(photo => !photo.phaseNumber).length;
      if (photoCount === 0) {
        errors.push('Minimaal 1 hoofdfoto is verplicht');
      }
      
      // Show all validation errors
      if (errors.length > 0) {
        setMessage({ 
          type: 'error', 
          text: t('garden.cannotSave', { errors: errors.join(', ') })
        });
        
        // Scroll to top of modal to show error
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) {
          modal.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        return;
      }

      const projectData = {
        ...formData,
        growthDuration: formData.growthDuration ? parseInt(formData.growthDuration) : null,
        photos: formData.photos
      };

      // Use main photos from formData and growth photos from state
      const mainPhotos = projectData.photos.filter(photo => !photo.phaseNumber);

      const payload = {
        title: projectData.title,
        description: projectData.description,
        status: 'PUBLISHED',
        photos: mainPhotos.map((photo, index) => ({
          url: photo.url,
          idx: index,
          isMain: ('isMain' in photo ? photo.isMain : false) || index === 0
        })),
        growthPhotos: growthPhotos.map((photo) => ({
          url: photo.url,
          phaseNumber: photo.phaseNumber,
          idx: photo.idx || 0,
          description: photo.description || ''
        })),
        category: 'GROWN', // Category for garden projects
        subcategory: projectData.plantType,
        priceCents: null,
        deliveryMode: null,
        place: null,
        lat: null,
        lng: null,
        stock: 0,
        maxStock: null,
        // Add garden-specific data
        plantType: projectData.plantType,
        plantDate: projectData.plantDate || null,
        harvestDate: projectData.harvestDate || null,
        growthDuration: projectData.growthDuration,
        sunlight: projectData.sunlight,
        waterNeeds: projectData.waterNeeds,
        location: projectData.location,
        soilType: projectData.soilType,
        plantDistance: projectData.plantDistance,
        difficulty: projectData.difficulty,
        tags: projectData.tags,
        notes: projectData.notes,
        // Always include video field - send null if deleted, object if present
        video: formData.video ? {
          url: formData.video.url,
          thumbnail: formData.video.thumbnail || null,
          duration: formData.video.duration || null
        } : null
      };

      // Use PATCH for updating existing project, POST for creating new one
      const isEditing = editingProject !== null;
      const url = isEditing ? `/api/profile/garden/${editingProject.id}` : '/api/profile/garden';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();

        // Reset form
        setFormData({
          title: '',
          description: '',
          plantType: '',
          plantDate: '',
          harvestDate: '',
          growthDuration: '',
          sunlight: 'PARTIAL',
          waterNeeds: 'MEDIUM',
          location: 'OUTDOOR',
          soilType: '',
          plantDistance: '',
          difficulty: 'EASY',
          tags: [],
          notes: '',
          photos: [],
          video: null
        });
        setGrowthPhotos([]); // Reset growth photos
        setShowForm(false);
        setEditingProject(null);
        setMessage({ type: 'success', text: isEditing ? t('garden.updated') : t('garden.saved') });
        
        // Reload projects

        await loadProjects();

      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Garden API error:', response.status, errorData);
        setMessage({ type: 'error', text: errorData.error || t('garden.saveError', { status: response.status }) });
      }
    } catch (error) {
      console.error('❌ Error saving garden project:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : t('garden.unknownError') });
    }
  };

  const handleSellGardenProject = (project: GardenProject) => {

    // Store garden project data in sessionStorage for the product form to use
    const gardenData = {
      title: project.title,
      description: project.description || '',
      photos: project.photos, // Only main photos (no phaseNumber)
      growthPhotos: (project.growthPhotos || []).map(photo => ({
        url: photo.url,
        phaseNumber: photo.phaseNumber,
        description: photo.description || '',
        idx: photo.idx || 0
      })), // Include growth phase photos with descriptions from separate array
      plantType: project.plantType,
      plantDate: project.plantDate,
      harvestDate: project.harvestDate,
      growthDuration: project.growthDuration,
      sunlight: project.sunlight,
      waterNeeds: project.waterNeeds,
      location: project.location,
      soilType: project.soilType,
      plantDistance: project.plantDistance,
      difficulty: project.difficulty,
      tags: project.tags,
      notes: project.notes
    };

    const jsonData = JSON.stringify(gardenData);

    // Store in both sessionStorage and localStorage as backup
    sessionStorage.setItem('gardenToProductData', jsonData);
    localStorage.setItem('gardenToProductData', jsonData);
    
    // Verify data was stored
    const storedData = sessionStorage.getItem('gardenToProductData');

    // Navigate to product creation form

    window.location.href = '/sell/new?fromGarden=true';
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm(t('errors.confirmDeleteGardenProject'))) return;
    
    try {
      const response = await fetch(`/api/profile/garden/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: t('garden.deleted') });
        loadProjects();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: errorData.error || t('garden.deleteError') });
      }
    } catch (error) {
      console.error('Error deleting garden project:', error);
      setMessage({ type: 'error', text: t('garden.deleteError') });
    }
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !selectedType || project.plantType === selectedType;
      return matchesSearch && matchesType;
    });
  }, [projects, searchQuery, selectedType]);
  
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
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" />
            Mijn Tuin
          </h3>
          <p className="text-sm text-gray-500">{t('garden.documentProjects')}</p>
        </div>
        {!isPublic && !hideAddButton && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuwe Kweek
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t('common.searchInGarden')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">{t('garden.allTypes')}</option>
          {PLANT_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
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

      {/* Project Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-hidden" style={{ touchAction: 'pan-y' }}>
          <div className="absolute inset-0 overflow-y-auto overscroll-contain" style={{ touchAction: 'pan-y' }}>
            <div className="min-h-full flex items-start sm:items-center justify-center p-0 sm:p-4">
              <div className="bg-white rounded-none sm:rounded-xl max-w-4xl w-full min-h-full sm:min-h-0 sm:max-h-[90vh] sm:my-auto overflow-y-auto overscroll-contain" style={{ touchAction: 'pan-y pinch-zoom', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', overscrollBehaviorY: 'auto' }} data-garden-form>
                <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-200 z-10 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Sprout className="w-6 h-6 text-emerald-600" />
                      {editingProject ? t('garden.editGarden') : t('garden.newGarden')}
                    </h2>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingProject(null);
                        setFormData({
                          title: '',
                          description: '',
                          plantType: '',
                          plantDate: '',
                          harvestDate: '',
                          growthDuration: '',
                          sunlight: 'PARTIAL',
                          waterNeeds: 'MEDIUM',
                          location: 'OUTDOOR',
                          soilType: '',
                          plantDistance: '',
                          difficulty: 'EASY',
                          tags: [],
                          notes: '',
                          photos: [],
                          video: null
                        });
                        setGrowthPhotos([]); // Reset growth photos when closing
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-6">
                  {/* Message Display */}
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

                  {/* Main Photos */}
                  <div>
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Hoofdfoto's <span className="text-red-500">*</span>
                      </span>
                      {formData.photos.filter(photo => !photo.phaseNumber).length === 0 && (
                        <p className="text-xs text-red-600 mt-1">⚠️ Minimaal 1 foto verplicht</p>
                      )}
                    </div>
                    <GardenPhotoUpload
                      photos={formData.photos.filter(photo => {
                        return !photo.phaseNumber;
                      }).map(photo => ({
                        ...photo,
                        isMain: 'isMain' in photo ? photo.isMain : false
                      }))}
                      onPhotosChange={(newMainPhotos: any) => {
                        setFormData(prev => {
                          const phasePhotos = prev.photos.filter(photo => photo.phaseNumber !== undefined);
                          const photosArray = Array.isArray(newMainPhotos) 
                            ? newMainPhotos
                            : newMainPhotos(prev.photos.filter(photo => !photo.phaseNumber));
                          return {
                            ...prev,
                            photos: [...photosArray, ...phasePhotos]
                          };
                        });
                      }}
                      maxPhotos={5}
                    />
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plant/Kweek Naam <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation ${
                          !formData.title.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder={t('common.exampleGarden')}
                        required
                      />
                      {!formData.title.trim() && (
                        <p className="text-xs text-red-600 mt-1">⚠️ {t('common.requiredField')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plant Type
                      </label>
                      <select
                        value={formData.plantType}
                        onChange={(e) => setFormData(prev => ({ ...prev, plantType: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation"
                      >
                        <option value="">Selecteer type</option>
                        {PLANT_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation resize-none"
                      placeholder={t('common.shortGrowDescription')}
                    />
                  </div>

                  {/* Timing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📅 Zaai/Plant Datum
                      </label>
                      <input
                        type="date"
                        value={formData.plantDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, plantDate: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🎯 Verwachte Oogst
                      </label>
                      <input
                        type="date"
                        value={formData.harvestDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, harvestDate: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ⏱️ Groeiduur (dagen)
                      </label>
                      <input
                        type="number"
                        value={formData.growthDuration}
                        onChange={(e) => setFormData(prev => ({ ...prev, growthDuration: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation"
                        placeholder="60"
                      />
                    </div>
                  </div>

                  {/* Care Requirements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ☀️ Zonlicht
                      </label>
                      <div className="space-y-2">
                        {SUNLIGHT_OPTIONS.map(option => (
                          <label
                            key={option.value}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                              formData.sunlight === option.value
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-gray-300 hover:border-emerald-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="sunlight"
                              value={option.value}
                              checked={formData.sunlight === option.value}
                              onChange={(e) => setFormData(prev => ({ ...prev, sunlight: e.target.value as any }))}
                              className="sr-only"
                            />
                            <span className="text-2xl mr-3">{option.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        💧 Water Behoefte
                      </label>
                      <div className="space-y-2">
                        {WATER_OPTIONS.map(option => (
                          <label
                            key={option.value}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                              formData.waterNeeds === option.value
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-gray-300 hover:border-emerald-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="waterNeeds"
                              value={option.value}
                              checked={formData.waterNeeds === option.value}
                              onChange={(e) => setFormData(prev => ({ ...prev, waterNeeds: e.target.value as any }))}
                              className="sr-only"
                            />
                            <span className="text-xl mr-3">{option.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Location & Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🌍 Locatie
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {LOCATION_OPTIONS.map(option => (
                          <label
                            key={option.value}
                            className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                              formData.location === option.value
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-gray-300 hover:border-emerald-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="location"
                              value={option.value}
                              checked={formData.location === option.value}
                              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value as any }))}
                              className="sr-only"
                            />
                            <span className="text-2xl mr-2">{option.icon}</span>
                            <span className="text-sm font-medium">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🎚️ Moeilijkheidsgraad
                      </label>
                      <div className="space-y-2">
                        {DIFFICULTY_LEVELS.map(level => (
                          <label
                            key={level.value}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                              formData.difficulty === level.value
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-gray-300 hover:border-emerald-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="difficulty"
                              value={level.value}
                              checked={formData.difficulty === level.value}
                              onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                              className="sr-only"
                            />
                            <span className="text-2xl mr-3">{level.icon}</span>
                            <span className="font-medium text-gray-900">{level.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Soil & Distance */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🌱 Grondsoort
                      </label>
                      <select
                        value={formData.soilType}
                        onChange={(e) => setFormData(prev => ({ ...prev, soilType: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation"
                      >
                        <option value="">Selecteer grondsoort</option>
                        {SOIL_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📏 Plantafstand
                      </label>
                      <input
                        type="text"
                        value={formData.plantDistance}
                        onChange={(e) => setFormData(prev => ({ ...prev, plantDistance: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation"
                        placeholder={t('common.exampleDimensionsGarden')}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🏷️ Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_TAGS.map(tag => (
                        <button
                          key={tag}
                          type="button"
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

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📔 Notities / Tips
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base touch-manipulation resize-none"
                      placeholder={t('common.personalExperiencesNotes')}
                    />
                  </div>

                  {/* Growth Phase Photos */}
                  <div>
                    <GardenGrowthPhotos
                      phases={GROWTH_PHASES}
                      photos={growthPhotos}
                      onPhotosChange={setGrowthPhotos}
                      maxPhotosPerPhase={5}
                      maxTotalPhotos={25}
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white p-4 sm:p-6 border-t border-gray-200 flex justify-end gap-3 shadow-sm">
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingProject(null);
                      setGrowthPhotos([]); // Reset growth photos when canceling
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {t('garden.cancel')}
                  </button>
                  <button
                    onClick={handleSaveProject}
                    disabled={!formData.title.trim() || formData.photos.filter(photo => !photo.phaseNumber).length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      !formData.title.trim() ? t('garden.plantNameRequired') :
                      formData.photos.filter(photo => !photo.phaseNumber).length === 0 ? t('garden.minPhotoRequired') :
                      t('garden.saveGarden')
                    }
                  >
                    <Sprout className="w-4 h-4" />
                    {editingProject ? t('garden.update') : t('garden.save')}
                  </button>
                </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <Sprout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('garden.noProjectsYet')}</h3>
          <p className="text-gray-500 mb-4">{t('garden.startDocumenting')}</p>
          {!isPublic && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              {t('garden.addFirstGarden')}
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {filteredProjects.map(project => (
            <div
              key={project.id}
              className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${
                viewMode === 'list' ? 'flex' : ''
              }`}
              onClick={() => window.location.href = `/garden/${project.id}`}
            >
              {/* Project Image */}
              <div className={`${viewMode === 'list' ? 'w-48 h-32' : 'h-48'} bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center relative group-hover:opacity-95 transition-opacity`}>
                {project.photos.length > 0 ? (
                  <img
                    src={project.photos[0].url}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Sprout className="w-12 h-12 text-emerald-400" />
                )}
                
              </div>

              {/* Project Content */}
              <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 line-clamp-1">{project.title}</h4>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                )}

                {/* Quick Info */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
                  {project.sunlight && (
                    <div className="flex items-center gap-1">
                      <Sun className="w-3 h-3" />
                      {SUNLIGHT_OPTIONS.find(o => o.value === project.sunlight)?.label}
                    </div>
                  )}
                  {project.waterNeeds && (
                    <div className="flex items-center gap-1">
                      <Droplet className="w-3 h-3" />
                      {WATER_OPTIONS.find(o => o.value === project.waterNeeds)?.label}
                    </div>
                  )}
                  {project.plantDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(project.plantDate).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>

                {project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-200"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{project.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {!isPublic && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {new Date(project.createdAt).toLocaleDateString('nl-NL')}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Load and edit project
                          setEditingProject(project);
                          const mainPhotos = project.photos || [];
                          const growthPhotosData = project.growthPhotos || [];
                          
                          setFormData({
                            title: project.title,
                            description: project.description || '',
                            plantType: project.plantType || '',
                            plantDate: project.plantDate || '',
                            harvestDate: project.harvestDate || '',
                            growthDuration: project.growthDuration ? project.growthDuration.toString() : '',
                            sunlight: project.sunlight || 'PARTIAL',
                            waterNeeds: project.waterNeeds || 'MEDIUM',
                            location: project.location || 'OUTDOOR',
                            soilType: project.soilType || '',
                            plantDistance: project.plantDistance || '',
                            difficulty: project.difficulty || 'EASY',
                            tags: project.tags || [],
                            notes: project.notes || '',
                            photos: mainPhotos,
                            video: project.video || null
                          });
                          
                          setGrowthPhotos(growthPhotosData as GrowthPhoto[]);
                          setShowForm(true);
                          
                          // Restore scroll after opening edit form (especially important if video exists)
                          setTimeout(() => {
                            const restoreScroll = () => {
                              const userAgent = navigator.userAgent.toLowerCase();
                              const isChrome = /chrome/.test(userAgent) && !/edg|opr/.test(userAgent);
                              const isEdge = /edg/.test(userAgent);
                              
                              const scrollContainers = document.querySelectorAll('[data-recipe-form], [data-garden-form], [data-design-form], [data-quickadd-form], [data-edit-product-form], [data-compact-chef-form], [data-compact-garden-form], [data-compact-designer-form]');
                              scrollContainers.forEach((container) => {
                                const el = container as HTMLElement;
                                if (!el) return;
                                
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
                                    // Force explicit height
                                    el.style.height = `${el.scrollHeight}px`;
                                    el.style.maxHeight = `${el.scrollHeight}px`;
                                    el.style.minHeight = `${el.scrollHeight}px`;
                                    
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
                          }, 100);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={t('common.edit')}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSellGardenProject(project);
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                        title={t('common.putGardenForSale')}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

