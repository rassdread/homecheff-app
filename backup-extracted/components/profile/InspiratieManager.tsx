'use client';

import { useState, useEffect } from 'react';
import { Search, Grid, List, Eye, Heart, MessageCircle, Star, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import { getDisplayName } from '@/lib/displayName';

type InspirationItem = {
  id: string;
  title: string | null;
  description: string | null;
  category: 'CHEFF' | 'GROWN' | 'DESIGNER';
  subcategory?: string | null;
  status: string;
  createdAt: string;
  viewCount?: number;
  propsCount?: number;
  reviewCount?: number;
  photos: Array<{
    id: string;
    url: string;
    isMain: boolean;
  }>;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
    displayFullName: boolean;
    displayNameOption: string;
  };
};

interface InspiratieManagerProps {
  isActive: boolean;
  userId?: string;
  isPublic?: boolean;
  categoryFilter?: 'CHEFF' | 'GROWN' | 'DESIGNER'; // Filter by category
}

export default function InspiratieManager({ isActive = true, userId, isPublic = false, categoryFilter }: InspiratieManagerProps) {
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  const loadInspirationItems = async () => {
    try {
      setLoading(true);
      const url = categoryFilter 
        ? `/api/users/${userId}/inspiration?category=${categoryFilter}`
        : `/api/users/${userId}/inspiration`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Filter by category if categoryFilter is provided
        let filteredItems = data.items || [];
        if (categoryFilter) {
          filteredItems = filteredItems.filter((item: InspirationItem) => item.category === categoryFilter);
        }
        setItems(filteredItems);
      } else {
        console.error('Failed to load inspiration items');
      }
    } catch (error) {
      console.error('Error loading inspiration items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadInspirationItems();
    }
  }, [userId, categoryFilter]);

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Weet je zeker dat je dit inspiratie item wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/inspiratie/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Inspiratie item verwijderd!' });
        loadInspirationItems();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: errorData.error || 'Fout bij verwijderen van item' });
      }
    } catch (error) {
      console.error('Error deleting inspiration item:', error);
      setMessage({ type: 'error', text: 'Fout bij verwijderen van item' });
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CHEFF': return '👨‍🍳';
      case 'GROWN': return '🌱';
      case 'DESIGNER': return '🎨';
      default: return '✨';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'CHEFF': return 'Keuken';
      case 'GROWN': return 'Tuin';
      case 'DESIGNER': return 'Atelier';
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brand mx-auto"></div>
        <p className="mt-2 text-gray-600">Inspiratie items laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {categoryFilter ? `Mijn Inspiratie - ${getCategoryName(categoryFilter)}` : 'Mijn Inspiratie'}
          </h3>
          <p className="text-sm text-gray-600">
            {filteredItems.length} inspiratie item{filteredItems.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {!isPublic && (
          <Link
            href="/inspiratie"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-brand text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuwe inspiratie
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Zoek in inspiratie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        
        {!categoryFilter && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Alle categorieën</option>
            <option value="CHEFF">Keuken</option>
            <option value="GROWN">Tuin</option>
            <option value="DESIGNER">Atelier</option>
          </select>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Items Grid/List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen inspiratie</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedCategory 
              ? 'Geen inspiratie items gevonden met de huidige filters.'
              : 'Je hebt nog geen inspiratie items gedeeld.'
            }
          </p>
          {!isPublic && !searchQuery && !selectedCategory && (
            <Link
              href="/inspiratie"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-brand text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Deel je eerste inspiratie
            </Link>
          )}
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow ${
                viewMode === 'list' ? 'flex' : ''
              }`}
            >
              {/* Image */}
              <div className={`relative ${
                viewMode === 'list' ? 'w-48 h-32 flex-shrink-0' : 'h-48'
              }`}>
                {item.photos.length > 0 ? (
                  <SafeImage
                    src={item.photos[0].url}
                    alt={item.title || 'Inspiratie'}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-4xl">{getCategoryIcon(item.category)}</span>
                  </div>
                )}
                
                {/* Category Badge */}
                <div className="absolute top-2 left-2">
                  <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                    {getCategoryName(item.category)}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                    {item.title || 'Naamloos'}
                  </h4>
                  
                  {!isPublic && (
                    <div className="flex items-center gap-1 ml-2">
                      <Link
                        href={`/inspiratie/${item.id}`}
                        className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                        title="Bekijk item"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Verwijder item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {item.description && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {item.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {item.viewCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{item.viewCount}</span>
                    </div>
                  )}
                  {item.propsCount !== undefined && item.propsCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>{item.propsCount}</span>
                    </div>
                  )}
                  {item.reviewCount !== undefined && item.reviewCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      <span>{item.reviewCount}</span>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="mt-2 text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString('nl-NL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
