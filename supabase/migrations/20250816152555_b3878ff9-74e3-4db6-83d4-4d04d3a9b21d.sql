-- Corrigir preços multiplicando por 100 para valores mais realistas
UPDATE public.listings 
SET price = price * 100 
WHERE price IS NOT NULL;

-- Ajustar alguns preços específicos para valores ainda mais realistas
UPDATE public.listings 
SET price = 120000 -- R$ 1.200,00
WHERE title = 'Vestido de Festa Elegante';

UPDATE public.listings 
SET price = 150000 -- R$ 1.500,00  
WHERE title = 'Gato Persa Filhote';

UPDATE public.listings 
SET price = 450000 -- R$ 4.500,00
WHERE title = 'iPhone 14 Pro Max 256GB';

UPDATE public.listings 
SET price = 800000 -- R$ 8.000,00
WHERE title = 'MacBook Pro M2 16" 512GB';

UPDATE public.listings 
SET price = 45000000 -- R$ 450.000,00
WHERE title = 'Apartamento 2 Quartos Copacabana';