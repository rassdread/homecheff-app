"use client";

import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Eye, EyeOff, Calendar, Droplet, Sun, Grid, List, Sprout, ShoppingCart } from "lucide-react";
import GardenPhotoUpload from "./GardenPhotoUpload";
import GardenGrowthPhotos from "./GardenGrowthPhotos";

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
  notes?: string;
  isPrivate: boolean;
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
  isPrivate: boolean;
  photos: GardenPhotoUnion[];
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
}

export default function GardenManager({ isActive = true, userId, isPublic = false }: GardenManagerProps) {
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
    isPrivate: true,
    photos: []
  });

  const [growthPhotos, setGrowthPhotos] = useState<GrowthPhoto[]>([]);

  const mainPhotos = formData.photos.filter(photo => !photo.phaseNumber);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const apiUrl = userId ? `/api/profile/garden?userId=${userId}` : '/api/profile/garden';
      console.log('🔍 Loading garden projects from:', apiUrl, '| isPublic:', isPublic);
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        console.log(`📦 Received ${items.length} items from API`);
        
        // Log all items to see what's coming from the API
        items.forEach((item: any, index: number) => {
          console.log(`Item ${index}:`, {
            id: item.id,
            title: item.title,
            category: item.category,
            status: item.status,
            photosCount: item.photos?.length || 0
          });
        });
        
        // Transform items to projects
        const gardenProjects: GardenProject[] = items
          .filter((item: any) => {
            if (item.category !== 'GROWN') {
              console.log(`❌ Filtering out item "${item.title}" - wrong category: ${item.category}`);
              return false;
            }
            
            if (isPublic) {
              const shouldShow = item.status === 'PUBLISHED';
              console.log(`${shouldShow ? '✅' : '❌'} Public mode - item "${item.title}" status: ${item.status}`);
              return shouldShow;
            }
            
            // In private mode (Mijn Tuin tab), toon ALLE kweken
            console.log(`✅ Private mode - "${item.title}" status: ${item.status} - showing in Mijn Tuin`);
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
            photos: [
              ...(item.photos?.map((photo: any) => ({
                id: photo.id,
                url: photo.url,
                isMain: photo.isMain || false,
                phaseNumber: undefined,
                description: undefined
              })) || []),
              ...(item.growthPhotos?.map((growthPhoto: any) => ({
                id: growthPhoto.id,
                url: growthPhoto.url,
                isMain: false,
                phaseNumber: growthPhoto.phaseNumber,
                description: growthPhoto.description
              })) || [])
            ],
            notes: item.notes || '',
            isPrivate: item.status === 'PRIVATE',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          }));
        
        console.log(`✅ Loaded ${gardenProjects.length} garden projects after filtering`);
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
          text: '⚠️ Kan niet opslaan: ' + errors.join(', ')
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

      console.log('🌱 Saving garden project with payload:', {
        title: projectData.title,
        category: 'GROWN',
        status: projectData.isPrivate ? 'PRIVATE' : 'PUBLISHED',
        photosCount: mainPhotos.length,
        growthPhotosCount: growthPhotos.length,
        isEditing: editingProject !== null
      });

      const payload = {
        title: projectData.title,
        description: projectData.description,
        status: projectData.isPrivate ? 'PRIVATE' : 'PUBLISHED',
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
        notes: projectData.notes
      };

      console.log('📤 Full payload being sent:', JSON.stringify(payload, null, 2));

      // Use PATCH for updating existing project, POST for creating new one
      const isEditing = editingProject !== null;
      const url = isEditing ? `/api/profile/garden/${editingProject.id}` : '/api/profile/garden';
      const method = isEditing ? 'PATCH' : 'POST';

      console.log(`📡 Sending ${method} request to ${url}`);

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('✅ Garden API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Garden project saved successfully:', result);
        
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
          isPrivate: true,
          photos: []
        });
        setGrowthPhotos([]); // Reset growth photos
        setShowForm(false);
        setEditingProject(null);
        setMessage({ type: 'success', text: isEditing ? '✅ Kweek bijgewerkt!' : '✅ Kweek opgeslagen!' });
        
        // Reload projects
        console.log('🔄 Reloading projects...');
        await loadProjects();
        console.log('✅ Projects reloaded');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Garden API error:', response.status, errorData);
        setMessage({ type: 'error', text: errorData.error || `Fout bij opslaan van kweek (${response.status})` });
      }
    } catch (error) {
      console.error('❌ Error saving garden project:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Onbekende fout bij opslaan van kweek' });
    }
  };

  const handleSellGardenProject = (project: GardenProject) => {
    console.log('handleSellGardenProject called with project:', project);
    
    // Store garden project data in sessionStorage for the product form to use
    const gardenData = {
      title: project.title,
      description: project.description || '',
      photos: project.photos.filter(photo => !photo.phaseNumber), // Only main photos
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
    
    console.log('Prepared garden data for sessionStorage:', gardenData);
    
    const jsonData = JSON.stringify(gardenData);
    console.log('JSON data to store:', jsonData);
    
    // Store in both sessionStorage and localStorage as backup
    sessionStorage.setItem('gardenToProductData', jsonData);
    localStorage.setItem('gardenToProductData', jsonData);
    
    // Verify data was stored
    const storedData = sessionStorage.getItem('gardenToProductData');
    console.log('Data stored in sessionStorage:', storedData);
    
    // Navigate to product creation form
    console.log('Navigating to product form...');
    window.location.href = '/sell/new?fromGarden=true';
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Weet je zeker dat je deze kweek wilt verwijderen?')) return;
    
    try {
      const response = await fetch(`/api/profile/garden/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Kweek verwijderd!' });
        loadProjects();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: errorData.error || 'Fout bij verwijderen van kweek' });
      }
    } catch (error) {
      console.error('Error deleting garden project:', error);
      setMessage({ type: 'error', text: 'Fout bij verwijderen van kweek' });
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || project.plantType === selectedType;
    return matchesSearch && matchesType;
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
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" />
            Mijn Tuin
          </h3>
          <p className="text-sm text-gray-500">Documenteer je kweekprojecten en groei</p>
        </div>
        {!isPublic && (
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
            placeholder="Zoek in je tuin..."
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
          <option value="">Alle types</option>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Sprout className="w-6 h-6 text-emerald-600" />
                  {editingProject ? 'Kweek Bewerken' : 'Nieuwe Kweek'}
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
                      isPrivate: true,
                      photos: []
                    });
                    setGrowthPhotos([]); // Reset growth photos when closing
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      !formData.title.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Bijv. Erfgoed Tomaten"
                    required
                  />
                  {!formData.title.trim() && (
                    <p className="text-xs text-red-600 mt-1">⚠️ Verplicht veld</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plant Type
                  </label>
                  <select
                    value={formData.plantType}
                    onChange={(e) => setFormData(prev => ({ ...prev, plantType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Korte beschrijving van je kweek..."
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Bijv. 30cm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Persoonlijke ervaringen, tips en aantekeningen..."
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
                  🔒 Privé kweek (alleen voor jou zichtbaar)
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingProject(null);
                  setGrowthPhotos([]); // Reset growth photos when canceling
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveProject}
                disabled={!formData.title.trim() || formData.photos.filter(photo => !photo.phaseNumber).length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  !formData.title.trim() ? 'Plant naam is verplicht' :
                  formData.photos.filter(photo => !photo.phaseNumber).length === 0 ? 'Minimaal 1 foto verplicht' :
                  'Kweek opslaan'
                }
              >
                <Sprout className="w-4 h-4" />
                {editingProject ? 'Bijwerken' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <Sprout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen kweekprojecten</h3>
          <p className="text-gray-500 mb-4">Begin met het documenteren van je eerste kweek</p>
          {!isPublic && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Eerste kweek toevoegen
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
                
                {/* Privacy indicator */}
                <div className="absolute top-2 right-2">
                  {project.isPrivate ? (
                    <div className="bg-gray-800 bg-opacity-75 text-white p-1 rounded-full">
                      <EyeOff className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="bg-emerald-600 bg-opacity-75 text-white p-1 rounded-full">
                      <Eye className="w-4 h-4" />
                    </div>
                  )}
                </div>
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
                          const mainPhotos = (project.photos || []).filter(photo => !photo.phaseNumber);
                          const growthPhotosData = (project.photos || []).filter(photo => photo.phaseNumber);
                          
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
                            isPrivate: project.isPrivate,
                            photos: mainPhotos
                          });
                          
                          setGrowthPhotos(growthPhotosData as GrowthPhoto[]);
                          setShowForm(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Bewerken"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSellGardenProject(project);
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Kweek te koop aanbieden"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Verwijderen"
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

