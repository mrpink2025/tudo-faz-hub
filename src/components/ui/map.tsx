import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';
import { queryConfigs, createQueryKey } from '@/utils/query-config';

interface MapProps {
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
  initialLocation?: { lat: number; lng: number };
  listings?: any[];
  showListings?: boolean;
  height?: string;
}

const Map: React.FC<MapProps> = ({ 
  onLocationSelect, 
  initialLocation, 
  listings = [], 
  showListings = true,
  height = "400px" 
}) => {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(5);
  const markers = useRef<mapboxgl.Marker[]>([]);

  // Fetch Mapbox token from Supabase edge function
  const { data: mapboxToken } = useQuery({
    queryKey: createQueryKey('mapbox-token'),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      return data.token;
    },
    ...queryConfigs.static
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    const initialLat = initialLocation?.lat || userLocation?.[1] || -23.5505;
    const initialLng = initialLocation?.lng || userLocation?.[0] || -46.6333;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [initialLng, initialLat],
      zoom: 12,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add click handler for location selection
    if (onLocationSelect) {
      map.current.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        
        // Get address using reverse geocoding
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=pt`
          );
          const data = await response.json();
          const address = data.features[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          
          onLocationSelect(lat, lng, address);
          logger.info('Location selected', { lat, lng, address });
        } catch (error) {
          logger.error('Error getting address', { error });
          onLocationSelect(lat, lng);
        }
      });
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, onLocationSelect, initialLocation, userLocation]);

  // Add listing markers
  useEffect(() => {
    if (!map.current || !showListings) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers for listings
    listings.forEach((listing) => {
      if (listing.lat && listing.lng) {
        const el = document.createElement('div');
        el.className = 'listing-marker';
        el.style.cssText = `
          background-color: hsl(var(--primary));
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([listing.lng, listing.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-2">
                  <h3 class="font-semibold text-sm">${listing.title}</h3>
                  <p class="text-xs text-muted-foreground">${listing.price ? `${listing.currency || 'BRL'} ${listing.price}` : 'Sem preço'}</p>
                  <p class="text-xs">${listing.location || ''}</p>
                </div>
              `)
          )
          .addTo(map.current!);

        markers.current.push(marker);
      }
    });
  }, [listings, showListings]);

  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(coords);
          
          if (map.current) {
            map.current.flyTo({
              center: coords,
              zoom: 14,
              duration: 2000
            });

            // Add user location marker
            new mapboxgl.Marker({ color: '#ef4444' })
              .setLngLat(coords)
              .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                  .setHTML('<div class="p-2"><strong>Sua localização</strong></div>')
              )
              .addTo(map.current);
          }
          
          logger.info('User location obtained', { coords });
        },
        (error) => {
          logger.error('Error getting user location', { error: error.message });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          onClick={getUserLocation} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <Navigation className="w-4 h-4" />
          {t('map.find_location')}
        </Button>
        
        {showListings && (
          <div className="flex items-center gap-2">
            <Label htmlFor="radius" className="text-sm">
              {t('map.search_radius')}:
            </Label>
            <Input
              id="radius"
              type="number"
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="w-20"
              min="1"
              max="50"
            />
            <span className="text-sm text-muted-foreground">km</span>
          </div>
        )}
      </div>
      
      <div 
        ref={mapContainer} 
        className="w-full rounded-lg border"
        style={{ height }}
      />
      
      {showListings && (
        <div className="text-xs text-muted-foreground">
          {t('map.listing_count', { count: listings.length })}
        </div>
      )}
    </div>
  );
};

export default Map;