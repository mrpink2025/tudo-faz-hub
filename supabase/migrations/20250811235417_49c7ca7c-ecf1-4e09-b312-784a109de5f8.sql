-- Make DEMO listings public and highlighted so they appear in the UI
UPDATE public.listings
SET 
  approved = true,
  status = 'published',
  highlighted = true,
  updated_at = now()
WHERE title LIKE 'DEMO - %';

-- Optional: quick verification (no-op for migration)
-- select count(*) as demo_public_highlighted from public.listings where title like 'DEMO - %' and approved = true and status = 'published' and highlighted = true;