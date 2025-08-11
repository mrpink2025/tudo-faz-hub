-- Approve and highlight DEMO listings so they appear in the UI
UPDATE public.listings l
SET 
  approved = true,
  status = 'published',
  highlighted = (c.parent_id IS NULL),
  updated_at = now()
FROM public.categories c
WHERE l.category_id = c.id
  AND l.title LIKE 'DEMO - %';

-- Verify counts
-- select count(*) from public.listings where title like 'DEMO - %' and approved = true;