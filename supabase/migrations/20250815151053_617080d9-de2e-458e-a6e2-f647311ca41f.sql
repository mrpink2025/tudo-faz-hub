-- Temporariamente desabilitar a função de moderação
DROP TRIGGER IF EXISTS trigger_enforce_listings_moderation ON listings;

-- Atualizar todos os anúncios demo para approved=true e definir quais são destacados
UPDATE listings SET approved = true WHERE user_id = '8bb0e255-8bda-475f-a942-de50ad93f71b';

-- Marcar anúncios específicos como destacados
UPDATE listings SET highlighted = true WHERE id IN (
  'aa000001-0000-0000-0000-000000000000', -- Honda Civic (Carros)
  'aa000003-0000-0000-0000-000000000000', -- Apartamento Copacabana (Imóveis)
  'aa000005-0000-0000-0000-000000000000', -- Desenvolvedor Full Stack (Empregos)
  'aa000006-0000-0000-0000-000000000000', -- iPhone 14 Pro Max (Celulares)
  'aa000008-0000-0000-0000-000000000000', -- Sofá Couro (Móveis)
  'aa000010-0000-0000-0000-000000000000', -- Esteira Elétrica (Fitness)
  'aa000012-0000-0000-0000-000000000000', -- Golden Retriever (Cães)
  'aa000014-0000-0000-0000-000000000000'  -- PlayStation 5 (Games)
);

-- Reativar a função de moderação
CREATE TRIGGER trigger_enforce_listings_moderation
  BEFORE INSERT OR UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_listings_moderation();