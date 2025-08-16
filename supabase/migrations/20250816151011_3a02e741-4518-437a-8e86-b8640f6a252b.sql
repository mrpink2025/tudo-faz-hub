-- Update existing demo listings to be sellable with inventory and pricing
UPDATE public.listings 
SET 
  sellable = true,
  inventory_count = CASE 
    WHEN title ILIKE '%telefone%' OR title ILIKE '%phone%' THEN 5
    WHEN title ILIKE '%notebook%' OR title ILIKE '%laptop%' THEN 3
    WHEN title ILIKE '%carro%' OR title ILIKE '%car%' THEN 1
    WHEN title ILIKE '%casa%' OR title ILIKE '%house%' THEN 1
    WHEN title ILIKE '%bicicleta%' OR title ILIKE '%bike%' THEN 8
    WHEN title ILIKE '%roupa%' OR title ILIKE '%clothes%' THEN 15
    WHEN title ILIKE '%livro%' OR title ILIKE '%book%' THEN 20
    WHEN title ILIKE '%móvel%' OR title ILIKE '%furniture%' THEN 2
    ELSE 10
  END,
  sold_count = CASE 
    WHEN title ILIKE '%telefone%' OR title ILIKE '%phone%' THEN 12
    WHEN title ILIKE '%notebook%' OR title ILIKE '%laptop%' THEN 7
    WHEN title ILIKE '%carro%' OR title ILIKE '%car%' THEN 3
    WHEN title ILIKE '%casa%' OR title ILIKE '%house%' THEN 1
    WHEN title ILIKE '%bicicleta%' OR title ILIKE '%bike%' THEN 25
    WHEN title ILIKE '%roupa%' OR title ILIKE '%clothes%' THEN 45
    WHEN title ILIKE '%livro%' OR title ILIKE '%book%' THEN 67
    WHEN title ILIKE '%móvel%' OR title ILIKE '%furniture%' THEN 8
    ELSE 15
  END,
  price = CASE 
    WHEN price IS NULL OR price = 0 THEN 
      CASE 
        WHEN title ILIKE '%telefone%' OR title ILIKE '%phone%' THEN 89900  -- R$ 899.00
        WHEN title ILIKE '%notebook%' OR title ILIKE '%laptop%' THEN 249900  -- R$ 2499.00
        WHEN title ILIKE '%carro%' OR title ILIKE '%car%' THEN 3500000  -- R$ 35000.00
        WHEN title ILIKE '%casa%' OR title ILIKE '%house%' THEN 45000000  -- R$ 450000.00
        WHEN title ILIKE '%bicicleta%' OR title ILIKE '%bike%' THEN 45900  -- R$ 459.00
        WHEN title ILIKE '%roupa%' OR title ILIKE '%clothes%' THEN 7900  -- R$ 79.00
        WHEN title ILIKE '%livro%' OR title ILIKE '%book%' THEN 2990  -- R$ 29.90
        WHEN title ILIKE '%móvel%' OR title ILIKE '%furniture%' THEN 129900  -- R$ 1299.00
        ELSE 9900  -- R$ 99.00
      END
    ELSE price
  END
WHERE approved = true;

-- Make sure all demo users have seller permissions
INSERT INTO public.seller_permissions (user_id, approved, approved_at, approved_by)
SELECT DISTINCT l.user_id, true, now(), (SELECT id FROM auth.users LIMIT 1)
FROM public.listings l 
WHERE l.approved = true 
AND NOT EXISTS (
  SELECT 1 FROM public.seller_permissions sp 
  WHERE sp.user_id = l.user_id
)
ON CONFLICT (user_id) DO UPDATE SET
  approved = true,
  approved_at = COALESCE(seller_permissions.approved_at, now());