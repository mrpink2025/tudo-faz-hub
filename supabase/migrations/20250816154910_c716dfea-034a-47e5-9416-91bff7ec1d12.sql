-- Fix security issues by replacing public views with secure functions

-- 1. Drop the public views that expose sensitive data
DROP VIEW IF EXISTS public.listing_locations_public;
DROP VIEW IF EXISTS public.site_settings_public;

-- 2. Create secure function to get public listing locations (only for approved listings)
CREATE OR REPLACE FUNCTION public.get_listing_location_public(p_listing_id uuid)
RETURNS TABLE(
  listing_id uuid,
  city text,
  state text,
  neighborhood text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only return location data for approved, published listings
  RETURN QUERY
  SELECT 
    ll.listing_id,
    ll.city,
    ll.state,
    ll.neighborhood
  FROM listing_locations ll
  JOIN listings l ON ll.listing_id = l.id
  WHERE ll.listing_id = p_listing_id
    AND l.approved = true 
    AND l.status = 'published';
END;
$$;

-- 3. Create secure function to get public site settings
CREATE OR REPLACE FUNCTION public.get_site_settings_public()
RETURNS TABLE(
  site_name text,
  logo_url text,
  brand_primary text,
  brand_accent text,
  promo_html text,
  hero_image_url text,
  favicon_url text,
  og_image_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only return non-sensitive public settings
  RETURN QUERY
  SELECT 
    s.site_name,
    s.logo_url,
    s.brand_primary,
    s.brand_accent,
    s.promo_html,
    s.hero_image_url,
    s.favicon_url,
    s.og_image_url
  FROM site_settings s
  WHERE s.id = 1;
END;
$$;