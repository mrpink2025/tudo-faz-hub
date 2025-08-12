begin;
-- Disable only the moderation trigger
ALTER TABLE public.listings DISABLE TRIGGER trg_enforce_listings_moderation;

-- Approve, publish and highlight all DEMO listings
UPDATE public.listings
SET 
  approved = true,
  status = 'published',
  highlighted = true
WHERE title LIKE 'DEMO - %';

-- Re-enable moderation trigger
ALTER TABLE public.listings ENABLE TRIGGER trg_enforce_listings_moderation;
commit;