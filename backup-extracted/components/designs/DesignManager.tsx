"use client";

import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Eye, EyeOff, Grid, List, Palette, ShoppingCart, Camera } from "lucide-react";
import DesignPhotoUpload from "./DesignPhotoUpload";

type DesignPhoto = {
  id: string;
  url: string;
  isMain: boolean;
  description?: string;
  idx?: number;
};

type Design = {
  id: string;
  title: string;
  description?: string;
  materials: string[];
  dimensions: string | null;
  category: string | null;
  subcategory: string | null;
  tags: string[];
  photos: DesignPhoto[];
  notes?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
};

type DesignFormData = {
  title: string;
  description: string;
  materials: string[];
  dimensions: string;
  category: string;
  subcategory: string;
  tags: string[];
  notes: string;
  isPrivate: boolean;
  photos: DesignPhoto[];
};

const DESIGN_CATEGORIES = [
  'Handgemaakt', 'Kunst', 'Decoratie', 'Meubels', 'Textiel',
  'Keramiek', 'Houtwerk', 'Metaalwerk', 'Glaswerk', 'Juwelen',
  'Accessoires', 'Kleding', 'Fotografie', 'Illustraties'
];

const COMMON_TAGS = [
  'Handgemaakt', 'Uniek', 'Vintage', 'Modern', 'Minimalistisch',
  'Kleurrijk', 'Natuurlijk', 'Duurzaam', 'Recycled', 'Luxe',
  'Op maat', 'Limited Edition', 'Geschikt voor cadeau'
];

interface DesignManagerProps {
  isActive?: boolean;
  userId?: string;
  isPublic?: boolean;
}

export default function DesignManager({ isActive = true, userId, isPublic = false }: DesignManagerProps) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Laad opgeslagen form data uit localStorage bij initialisatie
  const getInitialFormData = (): DesignFormData => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('designFormDraft');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed;
        } catch (e) {
          console.error('Error parsing saved design draft:', e);
        }
      }
    }
    return {
      title: '',
      description: '',
      materials: [''],
      dimensions: '',
      category: '',
      subcategory: '',
      tags: [],
      notes: '',
      isPrivate: true,
      photos: []
    };
  };

  const [formData, setFormData] = useState<DesignFormData>(getInitialFormData());
  const [hasDraft, setHasDraft] = useState(false);

  // Check for draft on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('designFormDraft');
      setHasDraft(!!draft);
    }
  }, []);

  // Auto-save form data to localStorage
  useEffect(() => {
    if (showForm && (formData.title || formData.description || formData.photos.length > 0)) {
      localStorage.setItem('designFormDraft', JSON.stringify(formData));
      setHasDraft(true);
    }
  }, [formData, showForm]);

  // Waarschuw bij verlaten pagina met niet-opgeslagen data
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (showForm && (formData.title || formData.description || formData.photos.length > 0)) {
        e.preventDefault();
        e.returnValue = 'Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je wilt afsluiten?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showForm, formData]);

  // Auto-hide message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (!isActive && message) {
      setMessage(null);
    }
  }, [isActive, message]);

  useEffect(() => {
    loadDesigns();
  }, []);

  // Check for inspiratie photo from + button flow
  useEffect(() => {
    const inspiratiePhoto = sessionStorage.getItem('inspiratiePhoto');
    const inspiratieLocation = sessionStorage.getItem('inspiratieLocation');
    
    if (inspiratiePhoto && inspiratieLocation === 'atelier' && isActive) {
      // Auto-open form with photo
      setShowForm(true);
      setFormData(prev => ({
        ...prev,
        photos: [{
          id: `inspiratie-${Date.now()}`,
          url: inspiratiePhoto,
          isMain: true
        }]
      }));
      
      // Clear sessionStorage
      sessionStorage.removeItem('inspiratiePhoto');
      sessionStorage.removeItem('inspiratieLocation');
    }
  }, [isActive]);

  const loadDesigns = async () => {
    try {
      setLoading(true);
      const apiUrl = userId ? `/api/profile/dishes?userId=${userId}` : '/api/profile/dishes';
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        items.forEach((item: any, index: number) => {
        });
        
        // Filter for DESIGNER category
        const designItems: Design[] = items
          .filter((item: any) => {
            if (item.category !== 'DESIGNER') {
              return false;
            }
            
            if (isPublic) {
              const shouldShow = item.status === 'PUBLISHED';
              return shouldShow;
            }
            
            // In private mode (Mijn Designs tab), toon ALLE designs (zowel PRIVATE als PUBLISHED)
            // Alleen producten die actief te koop zijn worden in de "Live" tab getoond
            return true;
          })
          .map((item: any) => ({
            id: item.id,
            title: item.title || '',
            description: item.description || '',
            materials: Array.isArray(item.materials) ? item.materials : [],
            dimensions: item.dimensions || null,
            category: item.category || null,
            subcategory: item.subcategory || null,
            tags: Array.isArray(item.tags) ? item.tags : [],
            photos: item.photos?.map((photo: any) => ({
              id: photo.id,
              url: photo.url,
              isMain: photo.isMain || false,
              description: photo.description
            })) || [],
            notes: item.notes || '',
            isPrivate: item.status === 'PRIVATE',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          }));
        setDesigns(designItems);
      } else {
        console.error('❌ Failed to load designs - HTTP', response.status);
        setDesigns([]);
      }
    } catch (error) {
      console.error('❌ Error loading designs:', error);
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDesign = async () => {
    try {
      const errors: string[] = [];
      
      if (!formData.title.trim()) {
        errors.push('Titel is verplicht');
      }
      
      if (formData.photos.length === 0) {
        errors.push('Minimaal 1 foto is verplicht');
      }
      
      if (errors.length > 0) {
        setMessage({ 
          type: 'error', 
          text: '⚠️ Kan niet opslaan: ' + errors.join(', ')
        });
        
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) {
          modal.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
      const designData = {
        title: formData.title,
        description: formData.description,
        status: formData.isPrivate ? 'PRIVATE' : 'PUBLISHED',
        photos: formData.photos.map((photo, index) => ({
          url: photo.url,
          idx: index,
          isMain: photo.isMain || index === 0
        })),
        category: 'DESIGNER',
        subcategory: formData.subcategory || null,
        materials: formData.materials.filter(m => m.trim() !== ''),
        dimensions: formData.dimensions || null,
        tags: formData.tags,
        notes: formData.notes,
        priceCents: null,
        deliveryMode: null,
        place: null,
        lat: null,
        lng: null,
        stock: 0,
        maxStock: null
      };
      const isEditing = editingDesign !== null;
      const url = isEditing ? `/api/profile/dishes/${editingDesign.id}` : '/api/profile/dishes';
      const method = isEditing ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(designData)
      });
      if (response.ok) {
        const result = await response.json();
        // Clear localStorage draft
        localStorage.removeItem('designFormDraft');
        setHasDraft(false);
        
        // Reset form
        const emptyForm = {
          title: '',
          description: '',
          materials: [''],
          dimensions: '',
          category: '',
          subcategory: '',
          tags: [],
          notes: '',
          isPrivate: true,
          photos: []
        };
        setFormData(emptyForm);
        setShowForm(false);
        setEditingDesign(null);
        setMessage({ type: 'success', text: isEditing ? '✅ Design bijgewerkt!' : '✅ Design opgeslagen!' });
        await loadDesigns();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Design API error:', response.status, errorData);
        setMessage({ type: 'error', text: errorData.error || `Fout bij opslaan (${response.status})` });
      }
    } catch (error) {
      console.error('❌ Error saving design:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Onbekende fout bij opslaan' });
    }
  };

  const handleSellDesign = (design: Design) => {
    const designData = {
      title: design.title,
      description: design.description || '',
      photos: design.photos,
      materials: design.materials,
      dimensions: design.dimensions,
      category: design.category,
      subcategory: design.subcategory,
      tags: design.tags,
      notes: design.notes
    };
    
    sessionStorage.setItem('designToProductData', JSON.stringify(designData));
    localStorage.setItem('designToProductData', JSON.stringify(designData));
    
    window.location.href = '/sell/new?fromDesign=true';
  };

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Weet je zeker dat je dit design wilt verwijderen?')) return;
    
    try {
      const response = await fetch(`/api/profile/dishes/${designId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Design verwijderd!' });
        loadDesigns();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: errorData.error || 'Fout bij verwijderen' });
      }
    } catch (error) {
      console.error('Error deleting design:', error);
      setMessage({ type: 'error', text: 'Fout bij verwijderen' });
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

  const addMaterial = () => {
    setFormData(prev => ({ ...prev, materials: [...prev.materials, ''] }));
  };

  const updateMaterial = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((m, i) => i === index ? value : m)
    }));
  };

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = design.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         design.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || design.subcategory === selectedCategory;
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
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-yellow-600" />
            Mijn Designs
          </h3>
          <p className="text-sm text-gray-500">Beheer je creatieve werken en designs</p>
        </div>
        {!isPublic && (
          <div className="flex gap-2">
            {hasDraft && (
              <button
                onClick={() => {
                  const draft = localStorage.getItem('designFormDraft');
                  if (draft) {
                    setFormData(JSON.parse(draft));
                    setShowForm(true);
                    setMessage({ type: 'success', text: '📝 Draft hersteld!' });
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md animate-pulse"
                title="Je hebt een niet-opgeslagen design"
              >
                <span className="text-lg">💾</span>
                <span className="hidden sm:inline">Herstel Draft</span>
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nieuw Design
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Zoek in je designs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
        >
          <option value="">Alle categorieën</option>
          {DESIGN_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 ${viewMode === 'list' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Design Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Palette className="w-6 h-6 text-yellow-600" />
                  {editingDesign ? 'Design Bewerken' : 'Nieuw Design'}
                </h2>
                <button
                  onClick={() => {
                    if (formData.title || formData.description || formData.photos.length > 0) {
                      const shouldClose = confirm('Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je wilt sluiten?');
                      if (!shouldClose) return;
                    }
                    
                    localStorage.removeItem('designFormDraft');
                    setHasDraft(false);
                    setShowForm(false);
                    setEditingDesign(null);
                    setFormData({
                      title: '',
                      description: '',
                      materials: [''],
                      dimensions: '',
                      category: '',
                      subcategory: '',
                      tags: [],
                      notes: '',
                      isPrivate: true,
                      photos: []
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Auto-save indicator */}
              {showForm && hasDraft && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <span className="text-lg">💾</span>
                    <span>Je werk wordt automatisch opgeslagen als draft</span>
                  </div>
                </div>
              )}
              
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
                    Titel <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                      !formData.title.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Bijv. Handgemaakte Keramische Vaas"
                    required
                  />
                  {!formData.title.trim() && (
                    <p className="text-xs text-red-600 mt-1">⚠️ Verplicht veld</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categorie
                  </label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="">Selecteer categorie</option>
                    {DESIGN_CATEGORIES.map(cat => (
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Vertel over je creatie..."
                />
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📏 Afmetingen
                </label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Bijv. 30cm x 20cm x 15cm"
                />
              </div>

              {/* Materials */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎨 Materialen & Technieken
                </label>
                <div className="space-y-2">
                  {formData.materials.map((material, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={material}
                        onChange={(e) => updateMaterial(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="Bijv. Keramiek, handgevormd"
                      />
                      {formData.materials.length > 1 && (
                        <button
                          onClick={() => removeMaterial(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addMaterial}
                    className="flex items-center gap-2 px-3 py-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Materiaal toevoegen
                  </button>
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
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
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
                  📝 Maker's Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Persoonlijke notities, verhaal achter het design..."
                />
              </div>

              {/* Photos */}
              <div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Foto's <span className="text-red-500">*</span>
                  </span>
                  {formData.photos.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">⚠️ Minimaal 1 foto verplicht</p>
                  )}
                </div>
                <DesignPhotoUpload
                  photos={formData.photos}
                  onPhotosChange={(newPhotos: any) => {
                    setFormData(prev => ({
                      ...prev,
                      photos: typeof newPhotos === 'function' ? newPhotos(prev.photos) : newPhotos
                    }));
                  }}
                  maxPhotos={10}
                />
              </div>

              {/* Privacy Setting */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <label htmlFor="isPrivate" className="text-sm text-gray-700">
                  🔒 Privé design (alleen voor jou zichtbaar)
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  if (formData.title || formData.description || formData.photos.length > 0) {
                    const shouldCancel = confirm('Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je wilt annuleren?');
                    if (!shouldCancel) return;
                  }
                  
                  localStorage.removeItem('designFormDraft');
                  setShowForm(false);
                  setEditingDesign(null);
                  setFormData({
                    title: '',
                    description: '',
                    materials: [''],
                    dimensions: '',
                    category: '',
                    subcategory: '',
                    tags: [],
                    notes: '',
                    isPrivate: true,
                    photos: []
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveDesign}
                disabled={!formData.title.trim() || formData.photos.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Palette className="w-4 h-4" />
                {editingDesign ? 'Bijwerken' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Designs Grid/List */}
      {filteredDesigns.length === 0 ? (
        <div className="text-center py-12">
          <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen designs</h3>
          <p className="text-gray-500 mb-4">Begin met het toevoegen van je eerste creatie</p>
          {!isPublic && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Eerste design toevoegen
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {filteredDesigns.map(design => (
            <div
              key={design.id}
              className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${
                viewMode === 'list' ? 'flex' : ''
              }`}
              onClick={() => window.location.href = `/design/${design.id}`}
            >
              {/* Design Image */}
              <div className={`${viewMode === 'list' ? 'w-48 h-32' : 'h-48'} bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center relative group-hover:opacity-95 transition-opacity`}>
                {design.photos.length > 0 ? (
                  <img
                    src={design.photos[0].url}
                    alt={design.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Palette className="w-12 h-12 text-yellow-400" />
                )}
                
                {/* Privacy indicator */}
                <div className="absolute top-2 right-2">
                  {design.isPrivate ? (
                    <div className="bg-gray-800 bg-opacity-75 text-white p-1 rounded-full">
                      <EyeOff className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="bg-yellow-600 bg-opacity-75 text-white p-1 rounded-full">
                      <Eye className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              {/* Design Content */}
              <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 line-clamp-1">{design.title}</h4>
                </div>

                {design.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{design.description}</p>
                )}

                {/* Quick Info */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
                  {design.subcategory && (
                    <div className="flex items-center gap-1">
                      <Palette className="w-3 h-3" />
                      {design.subcategory}
                    </div>
                  )}
                  {design.dimensions && (
                    <div className="flex items-center gap-1">
                      📏 {design.dimensions}
                    </div>
                  )}
                </div>

                {design.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {design.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-200"
                      >
                        {tag}
                      </span>
                    ))}
                    {design.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{design.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {!isPublic && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {new Date(design.createdAt).toLocaleDateString('nl-NL')}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDesign(design);
                          setFormData({
                            title: design.title,
                            description: design.description || '',
                            materials: design.materials.length > 0 ? design.materials : [''],
                            dimensions: design.dimensions || '',
                            category: design.category || '',
                            subcategory: design.subcategory || '',
                            tags: design.tags || [],
                            notes: design.notes || '',
                            isPrivate: design.isPrivate,
                            photos: design.photos
                          });
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
                          handleSellDesign(design);
                        }}
                        className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                        title="Design te koop aanbieden"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDesign(design.id);
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

