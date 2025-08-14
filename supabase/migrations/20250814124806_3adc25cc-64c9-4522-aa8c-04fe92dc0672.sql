-- Remover a view problemática e recriar corretamente
DROP VIEW IF EXISTS public.listing_locations_public;

-- Criar view usando security_invoker (PostgreSQL 15+) para resolver o problema de security definer
CREATE VIEW public.listing_locations_public 
WITH (security_invoker = true)
AS 
SELECT 
    ll.listing_id,
    ll.neighborhood,
    ll.city,
    ll.state
FROM public.listing_locations ll
INNER JOIN public.listings l ON l.id = ll.listing_id
WHERE l.approved = true 
  AND l.status = 'published';

-- Permitir acesso público à view
GRANT SELECT ON public.listing_locations_public TO anon, authenticated;