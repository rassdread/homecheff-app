'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Info } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// Load Google Maps dynamically
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface ProductLocation {
  id: string;
  title: string;
  priceCents: number;
  image?: string | null;
  lat: number;
  lng: number;
  place?: string;
  distanceKm?: number | null;
  category?: string;
  delivery?: string;
}

interface ProductMapViewProps {
  items: ProductLocation[];
  userLocation?: { lat: number; lng: number } | null;
  onMarkerClick?: (item: ProductLocation) => void;
  height?: string;
}

export default function ProductMapView({ 
  items, 
  userLocation,
  onMarkerClick,
  height = '600px'
}: ProductMapViewProps) {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductLocation | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    
    if (!apiKey) {
      console.warn('Google Maps API key not found');
      return;
    }

    // Check if script is already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector(`script[src*="maps.googleapis.com"]`)) {
      // Wait for script to load
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps) {
          setMapLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);
      return () => clearInterval(checkGoogle);
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        // Don't remove if other components might be using it
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google) return;

    // Default center (Amsterdam, Netherlands)
    const defaultCenter = { lat: 52.3676, lng: 4.9041 };
    
    // Use user location if available, otherwise use first item, otherwise default
    const center = userLocation || 
                   (items.length > 0 && items[0].lat && items[0].lng 
                     ? { lat: items[0].lat, lng: items[0].lng }
                     : defaultCenter);

    // Initialize map
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: userLocation ? 12 : items.length > 0 ? 10 : 8,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstanceRef.current = map;

    // Add user location marker if available
    if (userLocation) {
      new window.google.maps.Marker({
        position: userLocation,
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        title: t('filters.yourLocation'),
        zIndex: 1000
      });
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add markers for each product
    items.forEach((item) => {
      if (!item.lat || !item.lng) return;

      // Different colors for different categories
      let markerColor = '#FF6B6B'; // Default red
      if (item.category === 'CHEFF') markerColor = '#FF8C42'; // Orange
      if (item.category === 'GROWN') markerColor = '#4ECDC4'; // Teal
      if (item.category === 'DESIGNER') markerColor = '#FFE66D'; // Yellow

      const marker = new window.google.maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        map,
        title: item.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: markerColor,
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Create info window content
      const infoContent = `
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">${item.title}</h3>
          <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #10b981;">
            €${(item.priceCents / 100).toFixed(2)}
          </p>
          ${item.place ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">
            <span style="margin-right: 4px;">📍</span>${item.place}
          </p>` : ''}
          ${item.distanceKm !== null && item.distanceKm !== undefined ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">
            ${item.distanceKm.toFixed(1)} km
          </p>` : ''}
          <button 
            onclick="window.dispatchEvent(new CustomEvent('mapMarkerClick', { detail: '${item.id}' }))"
            style="margin-top: 8px; padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; width: 100%;"
          >
            ${t('filters.viewDetails')}
          </button>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoContent
      });

      marker.addListener('click', () => {
        // Close all other info windows
        markersRef.current.forEach(m => {
          if (m.infoWindow) m.infoWindow.close();
        });
        
        infoWindow.open(map, marker);
        marker.infoWindow = infoWindow;
        setSelectedItem(item);
        
        if (onMarkerClick) {
          onMarkerClick(item);
        }
      });

      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (items.length > 0 && items.some(item => item.lat && item.lng)) {
      const bounds = new window.google.maps.LatLngBounds();
      
      if (userLocation) {
        bounds.extend(userLocation);
      }
      
      items.forEach(item => {
        if (item.lat && item.lng) {
          bounds.extend({ lat: item.lat, lng: item.lng });
        }
      });
      
      map.fitBounds(bounds);
      
      // Don't zoom in too much if there's only one marker
      if (items.length === 1 && !userLocation) {
        map.setZoom(13);
      }
    }

  }, [mapLoaded, items, userLocation, onMarkerClick, t]);

  // Listen for marker click events from info window
  useEffect(() => {
    const handleMarkerClick = (event: CustomEvent) => {
      const itemId = event.detail;
      const item = items.find(i => i.id === itemId);
      if (item && onMarkerClick) {
        onMarkerClick(item);
      }
    };

    window.addEventListener('mapMarkerClick', handleMarkerClick as EventListener);
    return () => {
      window.removeEventListener('mapMarkerClick', handleMarkerClick as EventListener);
    };
  }, [items, onMarkerClick]);

  if (!mapLoaded) {
    return (
      <div 
        style={{ height }} 
        className="flex items-center justify-center bg-gray-100 rounded-lg"
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading') || 'Kaart laden...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden border border-gray-200"
      />
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <div className="text-sm font-semibold mb-2">{t('filters.legend') || 'Legenda'}</div>
        <div className="space-y-1 text-xs">
          {userLocation && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>{t('filters.yourLocation')}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>{t('inspiratie.recipes') || 'Recepten'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal-500"></div>
            <span>{t('inspiratie.growing') || 'Kweken'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>{t('inspiratie.designs') || 'Designs'}</span>
          </div>
        </div>
      </div>

      {/* Item count */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 z-10">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-gray-600" />
          <span className="font-medium">
            {items.length} {items.length === 1 ? (t('filters.item') || 'item') : (t('filters.items') || 'items')}
          </span>
        </div>
      </div>
    </div>
  );
}


