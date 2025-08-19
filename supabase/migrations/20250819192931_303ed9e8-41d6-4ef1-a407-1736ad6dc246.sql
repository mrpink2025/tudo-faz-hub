-- Adicionar campo para limite de quantidade por compra na tabela listings
ALTER TABLE public.listings 
ADD COLUMN max_quantity_per_purchase integer DEFAULT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.listings.max_quantity_per_purchase IS 'Quantidade máxima que cada pessoa pode comprar por pedido. NULL = sem limite';