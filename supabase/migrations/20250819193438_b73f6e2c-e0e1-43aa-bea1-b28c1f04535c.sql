-- Atualizar política de visualização de listings para permitir que admins vejam anúncios não aprovados
DROP POLICY IF EXISTS "Public can view published approved listings" ON public.listings;

CREATE POLICY "Public can view published approved listings or admin can view all" 
ON public.listings 
FOR SELECT 
USING (
  -- Usuários podem ver anúncios aprovados e publicados OU seus próprios anúncios OU se for admin
  ((status = 'published' AND approved = true) OR (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
);