import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NearbyListing = {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  location: string | null;
  created_at: string;
  cover_image: string | null;
  lat: number;
  lng: number;
  distance_km: number;
  sellable?: boolean;
  inventory_count?: number;
  sold_count?: number;
  user_id?: string;
};

export const useNearbyListings = (
  lat: number | null,
  lng: number | null,
  radiusKm: number = 25,
  limit: number = 12
) => {
  return useQuery({
    queryKey: ["nearby-listings", lat, lng, radiusKm, limit],
    enabled: lat != null && lng != null,
    queryFn: async (): Promise<NearbyListing[]> => {
      if (lat == null || lng == null) return [];
      const { data, error } = await supabase.rpc("listings_nearby", {
        p_lat: lat,
        p_lng: lng,
        p_radius_km: radiusKm,
        p_limit: limit,
      });
      if (error) throw error;
      return (data as NearbyListing[]) ?? [];
    },
    staleTime: 1000 * 60, // 1 min
  });
};
