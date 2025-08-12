-- Function: listings_nearby for distance-based search using Haversine formula
CREATE OR REPLACE FUNCTION public.listings_nearby(
  p_lat double precision,
  p_lng double precision,
  p_radius_km numeric DEFAULT 25,
  p_limit integer DEFAULT 24
)
RETURNS TABLE (
  id uuid,
  title text,
  price integer,
  currency text,
  location text,
  created_at timestamptz,
  cover_image text,
  lat double precision,
  lng double precision,
  distance_km numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT 
    l.id,
    l.title,
    l.price,
    l.currency,
    l.location,
    l.created_at,
    l.cover_image,
    l.lat,
    l.lng,
    (
      6371 * acos(
        cos(radians(p_lat)) * cos(radians(l.lat)) * cos(radians(l.lng) - radians(p_lng))
        + sin(radians(p_lat)) * sin(radians(l.lat))
      )
    ) AS distance_km
  FROM public.listings l
  WHERE l.lat IS NOT NULL
    AND l.lng IS NOT NULL
    AND l.approved = true
    AND l.status = 'published'
    AND (
      6371 * acos(
        cos(radians(p_lat)) * cos(radians(l.lat)) * cos(radians(l.lng) - radians(p_lng))
        + sin(radians(p_lat)) * sin(radians(l.lat))
      )
    ) <= p_radius_km
  ORDER BY distance_km ASC
  LIMIT p_limit;
$$;

-- Helpful index for range scans (not geo-optimized but improves filtering)
CREATE INDEX IF NOT EXISTS idx_listings_lat_lng ON public.listings (lat, lng);