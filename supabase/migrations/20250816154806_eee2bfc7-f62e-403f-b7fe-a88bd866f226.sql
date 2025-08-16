-- Fix security issues identified in the scan

-- 1. Enable RLS on listing_locations_public table
ALTER TABLE public.listing_locations_public ENABLE ROW LEVEL SECURITY;

-- 2. Create policy to allow public read access only for approved listings
CREATE POLICY "Public can view locations for approved listings"
ON public.listing_locations_public
FOR SELECT
USING (
  listing_id IN (
    SELECT id FROM public.listings 
    WHERE approved = true AND status = 'published'
  )
);

-- 3. Enable RLS on site_settings_public table  
ALTER TABLE public.site_settings_public ENABLE ROW LEVEL SECURITY;

-- 4. Create policy to allow public read access to site settings
CREATE POLICY "Public can view site settings"
ON public.site_settings_public
FOR SELECT
USING (true);

-- Note: site_settings_public is meant to be public but we enable RLS for consistency
-- and to have control over access in the future if needed