UPDATE public.listings 
SET price = price * 100
WHERE price IS NOT NULL 
  AND price > 0 
  AND price < 1000 
  AND created_at < '2025-08-19 19:30:00';