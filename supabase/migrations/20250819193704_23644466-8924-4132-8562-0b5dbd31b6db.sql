-- Corrigir preços existentes que estão em formato incorreto (presumindo que preços baixos como 99 deveriam ser 9900)
-- Esta migração identifica preços que provavelmente estão no formato incorreto e os converte

UPDATE public.listings 
SET price = price * 100
WHERE price IS NOT NULL 
  AND price > 0 
  AND price < 1000  -- Assumindo que preços menores que R$ 10,00 (1000 centavos) são provavelmente incorretos
  AND created_at < '2025-08-19 19:30:00'  -- Apenas anúncios criados antes da correção do bug;