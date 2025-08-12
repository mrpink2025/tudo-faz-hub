begin;
-- Temporarily disable moderation triggers
ALTER TABLE public.listings DISABLE TRIGGER ALL;

-- Approve, publish and highlight all DEMO listings
UPDATE public.listings
SET 
  approved = true,
  status = 'published',
  highlighted = true,
  updated_at = now()
WHERE title LIKE 'DEMO - %';

-- Re-enable triggers
ALTER TABLE public.listings ENABLE TRIGGER ALL;
commit;