-- Remover a view problemática listing_locations_public
DROP VIEW IF EXISTS public.listing_locations_public;

-- Criar uma view segura que mostra apenas localizações de anúncios aprovados e publicados
CREATE VIEW public.listing_locations_public 
WITH (security_barrier=true)
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

-- Aplicar RLS na view
ALTER VIEW public.listing_locations_public SET (security_barrier = true);

-- Permitir acesso público apenas à view (não à tabela original)
GRANT SELECT ON public.listing_locations_public TO anon, authenticated;