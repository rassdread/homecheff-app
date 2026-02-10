'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface UserLocation {
  id: string;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  age: number | null;
  ageGroup: string | null;
  gender: string | null;
  role: string;
}

interface UserMapProps {
  users: UserLocation[];
  height?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function UserMap({ users, height = '600px' }: UserMapProps) {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

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
  }, []);

  // Initialize map when loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google) return;

    const usersWithLocation = users.filter(u => u.lat && u.lng);
    
    if (usersWithLocation.length === 0) {
      // Default center (Amsterdam, Netherlands)
      const defaultCenter = { lat: 52.3676, lng: 4.9041 };
      
      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 8,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });
      
      mapInstanceRef.current = map;
      return;
    }

    // Calculate center from user locations
    const avgLat = usersWithLocation.reduce((sum, u) => sum + (u.lat || 0), 0) / usersWithLocation.length;
    const avgLng = usersWithLocation.reduce((sum, u) => sum + (u.lng || 0), 0) / usersWithLocation.length;

    // Initialize map
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: avgLat, lng: avgLng },
      zoom: usersWithLocation.length === 1 ? 12 : 10,
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

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add markers for each user
    usersWithLocation.forEach((user) => {
      if (!user.lat || !user.lng) return;

      // Get color based on role
      let markerColor = '#3b82f6'; // Default blue
      if (user.role === 'SELLER') markerColor = '#10b981'; // Green
      if (user.role === 'DELIVERER') markerColor = '#f97316'; // Orange
      if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') markerColor = '#8b5cf6'; // Purple

      const marker = new window.google.maps.Marker({
        position: { lat: user.lat, lng: user.lng },
        map,
        title: `${user.city || 'Onbekend'} - ${user.role}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: markerColor,
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Create info window content
      const infoContent = `
        <div style="padding: 12px; min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
          <h3 style="font-weight: 600; margin: 0 0 8px 0; font-size: 16px; color: #111827;">
            ${user.city || 'Onbekend'}
          </h3>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">${user.country || ''}</p>
          
          <div style="margin: 8px 0;">
            <p style="margin: 4px 0; font-size: 13px;"><strong>Rol:</strong> ${user.role}</p>
            ${user.age ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Leeftijd:</strong> ${user.age} jaar</p>` : ''}
            ${user.ageGroup ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Leeftijdsgroep:</strong> ${user.ageGroup}</p>` : ''}
            ${user.gender ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Geslacht:</strong> ${user.gender}</p>` : ''}
          </div>
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
      });

      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (usersWithLocation.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      usersWithLocation.forEach(user => {
        if (user.lat && user.lng) {
          bounds.extend({ lat: user.lat, lng: user.lng });
        }
      });
      
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
        
        // Don't zoom in too much if there's only one marker
        if (usersWithLocation.length === 1) {
          const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
            if (map.getZoom() && map.getZoom() > 15) {
              map.setZoom(15);
            }
            window.google.maps.event.removeListener(listener);
          });
        }
      }
    }
  }, [mapLoaded, users]);

  if (!mapLoaded) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('common.mapLoading') || 'Kaart wordt geladen...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapRef} style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border border-gray-200" />
  );
}

