'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Layers, X, Maximize2, Minimize2 } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  priceCents: number;
  image?: string;
  location?: {
    lat?: number;
    lng?: number;
    place?: string;
    distanceKm?: number;
  };
  seller?: {
    name?: string;
    avatar?: string;
  };
}

interface MapViewProps {
  products: Product[];
  userLocation?: { lat: number; lng: number } | null;
  onProductClick: (product: Product) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function MapView({ products, userLocation, onProductClick, isOpen, onClose }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map when component mounts or opens
  useEffect(() => {
    if (isOpen && !mapLoaded) {
      initializeMap();
    }
  }, [isOpen, mapLoaded]);

  // Update markers when products change
  useEffect(() => {
    if (map && products.length > 0) {
      updateMarkers();
    }
  }, [map, products]);

  const initializeMap = async () => {
    try {
      // Load Leaflet CSS and JS dynamically
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!(window as any).L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const L = (window as any).L;
      
      // Default center (Amsterdam) if no user location
      const center = userLocation || { lat: 52.3676, lng: 4.9041 };
      
      const leafletMap = L.map(mapRef.current).setView([center.lat, center.lng], 13);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(leafletMap);

      setMap(leafletMap);
      setMapLoaded(true);

      // Add user location marker if available
      if (userLocation) {
        const userIcon = L.divIcon({
          html: '<div class="user-location-marker">📍</div>',
          className: 'user-location-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        });
        
        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(leafletMap)
          .bindPopup('<b>Jouw locatie</b>');
      }

    } catch (error) {
      console.error('Error initializing map:', error);
      // Fallback to static map or error message
    }
  };

  const updateMarkers = () => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    const newMarkers: any[] = [];

    const L = (window as any).L;

    products.forEach((product) => {
      if (product.location?.lat && product.location?.lng) {
        // Create custom icon based on category or price
        const iconHtml = `
          <div class="product-marker ${getMarkerClass(product)}">
            <div class="marker-content">
              <span class="marker-price">€${(product.priceCents / 100).toFixed(0)}</span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'product-marker-container',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });

        const marker = L.marker([product.location.lat, product.location.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(createPopupContent(product));

        marker.on('click', () => {
          onProductClick(product);
        });

        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      const group = new L.featureGroup(newMarkers);
      if (userLocation) {
        group.addLayer(L.marker([userLocation.lat, userLocation.lng]));
      }
      map.fitBounds(group.getBounds().pad(0.1));
    }
  };

  const getMarkerClass = (product: Product): string => {
    const price = product.priceCents / 100;
    if (price < 10) return 'price-low';
    if (price < 50) return 'price-medium';
    return 'price-high';
  };

  const createPopupContent = (product: Product): string => {
    return `
      <div class="map-popup">
        <div class="popup-image">
          ${product.image ? `<img src="${product.image}" alt="${product.title}" />` : '<div class="no-image">📷</div>'}
        </div>
        <div class="popup-content">
          <h3>${product.title}</h3>
          <p class="popup-price">€${(product.priceCents / 100).toFixed(2)}</p>
          ${product.location?.place ? `<p class="popup-location">📍 ${product.location.place}</p>` : ''}
          ${product.location?.distanceKm ? `<p class="popup-distance">${product.location.distanceKm} km</p>` : ''}
          ${product.seller?.name ? `<p class="popup-seller">door ${product.seller.name}</p>` : ''}
        </div>
      </div>
    `;
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const centerOnUserLocation = () => {
    if (map && userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 15);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-white z-50 ${isFullscreen ? '' : 'md:absolute md:inset-auto md:top-4 md:right-4 md:w-96 md:h-96 md:rounded-xl md:shadow-xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Kaart Weergave</h3>
          <span className="text-sm text-gray-500">({products.length} producten)</span>
        </div>
        <div className="flex items-center gap-2">
          {userLocation && (
            <button
              onClick={centerOnUserLocation}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Centreren op jouw locatie"
            >
              <Navigation className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title={isFullscreen ? "Verkleinen" : "Vergroten"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-full">
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Loading State */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Kaart laden...</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Legenda</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-700">€0-10</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-xs text-gray-700">€10-50</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-700">€50+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .product-marker-container {
          background: transparent;
          border: none;
        }
        
        .product-marker {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .product-marker:hover {
          transform: scale(1.1);
        }
        
        .price-low {
          background: #10b981;
        }
        
        .price-medium {
          background: #f59e0b;
        }
        
        .price-high {
          background: #ef4444;
        }
        
        .marker-content {
          color: white;
          font-weight: bold;
          font-size: 10px;
          text-align: center;
        }
        
        .user-location-marker {
          font-size: 20px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
        
        .map-popup {
          max-width: 200px;
        }
        
        .popup-image {
          width: 100%;
          height: 80px;
          overflow: hidden;
          border-radius: 4px;
          margin-bottom: 8px;
        }
        
        .popup-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .no-image {
          width: 100%;
          height: 100%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        
        .popup-content h3 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 4px 0;
          line-height: 1.2;
        }
        
        .popup-price {
          font-size: 16px;
          font-weight: bold;
          color: #059669;
          margin: 0 0 4px 0;
        }
        
        .popup-location,
        .popup-distance,
        .popup-seller {
          font-size: 12px;
          color: #6b7280;
          margin: 2px 0;
        }
      `}</style>
    </div>
  );
}
