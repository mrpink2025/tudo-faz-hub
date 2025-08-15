-- Remover completamente o trigger e a função
DROP TRIGGER IF EXISTS trigger_enforce_listings_moderation ON listings;
DROP FUNCTION IF EXISTS public.enforce_listings_moderation();

-- Atualizar diretamente os campos approved e highlighted sem trigger
UPDATE listings SET 
  approved = true,
  highlighted = CASE 
    WHEN id IN (
      'aa000001-0000-0000-0000-000000000000', -- Honda Civic
      'aa000003-0000-0000-0000-000000000000', -- Apartamento
      'aa000005-0000-0000-0000-000000000000', -- Desenvolvedor 
      'aa000006-0000-0000-0000-000000000000', -- iPhone
      'aa000008-0000-0000-0000-000000000000', -- Sofá
      'aa000010-0000-0000-0000-000000000000', -- Esteira
      'aa000012-0000-0000-0000-000000000000', -- Golden
      'aa000014-0000-0000-0000-000000000000'  -- PlayStation
    ) THEN true
    ELSE false
  END
WHERE user_id = '8f7d84c5-4170-4a93-b523-6544228797aa';

-- Recriar a função com lógica corrigida
CREATE OR REPLACE FUNCTION public.enforce_listings_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Permitir se o usuário for admin
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  
  -- Non-admins cannot approve or highlight
  IF TG_OP = 'INSERT' THEN
    NEW.approved := false;  -- force moderation
    NEW.highlighted := false; -- disallow self highlight
  ELSIF TG_OP = 'UPDATE' THEN
    IF COALESCE(NEW.approved, false) <> COALESCE(OLD.approved, false) THEN
      RAISE EXCEPTION 'Only admins can change approval status';
    END IF;
    IF COALESCE(NEW.highlighted, false) <> COALESCE(OLD.highlighted, false) THEN
      RAISE EXCEPTION 'Only admins can change highlight status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER trigger_enforce_listings_moderation
  BEFORE INSERT OR UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_listings_moderation();