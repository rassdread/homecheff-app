'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductLocation {
  id: string;
  title: string;
  priceCents: number;
  image?: string;
  lat: number | null;
  lng: number | null;
  place?: string | null;
  city?: string | null;
  distanceKm?: number | null;
  seller?: {
    id: string;
    name: string | null;
    username: string | null;
  } | null;
}

interface ProductMapProps {
  products: ProductLocation[];
  height?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function ProductMap({ products, height = '600px' }: ProductMapProps) {
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

    const productsWithLocation = products.filter(p => p.lat && p.lng);
    
    if (productsWithLocation.length === 0) {
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

    // Calculate center from product locations
    const avgLat = productsWithLocation.reduce((sum, p) => sum + (p.lat || 0), 0) / productsWithLocation.length;
    const avgLng = productsWithLocation.reduce((sum, p) => sum + (p.lng || 0), 0) / productsWithLocation.length;

    // Initialize map
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: avgLat, lng: avgLng },
      zoom: productsWithLocation.length === 1 ? 12 : 10,
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

    // Add markers for each product
    productsWithLocation.forEach((product) => {
      if (!product.lat || !product.lng) return;

      const marker = new window.google.maps.Marker({
        position: { lat: product.lat, lng: product.lng },
        map,
        title: product.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#10b981',
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Create info window content
      const price = (product.priceCents / 100).toFixed(2);
      const infoContent = `
        <div style="padding: 12px; min-width: 250px; max-width: 300px; font-family: system-ui, -apple-system, sans-serif;">
          <h3 style="font-weight: 600; margin: 0 0 8px 0; font-size: 16px; color: #111827;">
            ${product.title}
          </h3>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #059669; font-weight: 600;">
            €${price}
          </p>
          ${product.place ? `<p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
            📍 ${product.place}
          </p>` : ''}
          ${product.city ? `<p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
            ${product.city}
          </p>` : ''}
          ${product.distanceKm !== null && product.distanceKm !== undefined ? `<p style="margin: 4px 0; font-size: 12px; color: #10b981; font-weight: 500;">
            ${product.distanceKm.toFixed(1)} km
          </p>` : ''}
          ${product.seller ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 8px;">
            Verkoper: ${product.seller.name || product.seller.username || 'Onbekend'}
          </p>` : ''}
          <a href="/product/${product.id}" target="_blank" style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 500;">
            Bekijk Product →
          </a>
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
    if (productsWithLocation.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      productsWithLocation.forEach(product => {
        if (product.lat && product.lng) {
          bounds.extend({ lat: product.lat, lng: product.lng });
        }
      });
      
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
        
        // Don't zoom in too much if there's only one marker
        if (productsWithLocation.length === 1) {
          const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
            if (map.getZoom() && map.getZoom() > 15) {
              map.setZoom(15);
            }
            window.google.maps.event.removeListener(listener);
          });
        }
      }
    }
  }, [mapLoaded, products]);

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

