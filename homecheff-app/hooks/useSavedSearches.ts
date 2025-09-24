import { useState, useEffect } from 'react';

export interface FilterState {
  q: string;
  category: string;
  subcategory: string;
  priceRange: { min: number; max: number };
  radius: number;
  location: string;
  sortBy: string;
  deliveryMode: string;
  dateRange: { from: string; to: string };
  // condition: string; // Verwijderd - alles is nieuw op HomeCheff
  sellerRating: number;
  hasImages: boolean;
  isActive: boolean;
  userRole: string; // Nieuwe filter voor gebruikers rollen
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: Date;
  userId?: string;
}

export const defaultFilters: FilterState = {
  q: '',
  category: 'all',
  subcategory: 'all',
  priceRange: { min: 0, max: 1000 },
  radius: 10,
  location: '',
  sortBy: 'newest',
  deliveryMode: 'all',
  dateRange: { from: '', to: '' },
  // condition: 'all', // Verwijderd - alles is nieuw op HomeCheff
  sellerRating: 0,
  hasImages: false,
  isActive: false,
  userRole: 'all', // Nieuwe filter voor gebruikers rollen
};

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);

  // Load saved searches from localStorage on mount
  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = () => {
    try {
      const stored = localStorage.getItem('homecheff_saved_searches');
      if (stored) {
        const searches = JSON.parse(stored).map((search: any) => ({
          ...search,
          createdAt: new Date(search.createdAt)
        }));
        setSavedSearches(searches);
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const saveSearch = async (name: string, filters: FilterState) => {
    setLoading(true);
    try {
      const newSearch: SavedSearch = {
        id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        filters,
        createdAt: new Date(),
        userId: 'local_user' // In real app, use actual user ID
      };

      const updatedSearches = [...savedSearches, newSearch];
      setSavedSearches(updatedSearches);
      
      // Save to localStorage
      localStorage.setItem('homecheff_saved_searches', JSON.stringify(updatedSearches));

      // Also save to server (if user is logged in)
      try {
        const response = await fetch('/api/searches/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            filters,
            searchId: newSearch.id
          }),
        });

        if (!response.ok) {
          console.warn('Failed to save search to server, but saved locally');
        }
      } catch (serverError) {
        console.warn('Server save failed, but local save succeeded:', serverError);
      }

      return newSearch;
    } catch (error) {
      console.error('Error saving search:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (searchId: string) => {
    setLoading(true);
    try {
      const updatedSearches = savedSearches.filter(search => search.id !== searchId);
      setSavedSearches(updatedSearches);
      
      // Update localStorage
      localStorage.setItem('homecheff_saved_searches', JSON.stringify(updatedSearches));

      // Also delete from server
      try {
        await fetch(`/api/searches/${searchId}`, {
          method: 'DELETE',
        });
      } catch (serverError) {
        console.warn('Server delete failed, but local delete succeeded:', serverError);
      }
    } catch (error) {
      console.error('Error deleting search:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateSearch = async (searchId: string, updates: Partial<SavedSearch>) => {
    setLoading(true);
    try {
      const updatedSearches = savedSearches.map(search => 
        search.id === searchId 
          ? { ...search, ...updates }
          : search
      );
      setSavedSearches(updatedSearches);
      
      // Update localStorage
      localStorage.setItem('homecheff_saved_searches', JSON.stringify(updatedSearches));

      // Also update on server
      try {
        await fetch(`/api/searches/${searchId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });
      } catch (serverError) {
        console.warn('Server update failed, but local update succeeded:', serverError);
      }
    } catch (error) {
      console.error('Error updating search:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getSearchById = (searchId: string): SavedSearch | undefined => {
    return savedSearches.find(search => search.id === searchId);
  };

  const getRecentSearches = (limit: number = 5): SavedSearch[] => {
    return savedSearches
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  };

  const getPopularSearches = (limit: number = 5): SavedSearch[] => {
    // In a real app, you'd track search usage and return most used
    // For now, return recent searches
    return getRecentSearches(limit);
  };

  return {
    savedSearches,
    loading,
    saveSearch,
    deleteSearch,
    updateSearch,
    getSearchById,
    getRecentSearches,
    getPopularSearches,
  };
}
