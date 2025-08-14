-- Corrigir função has_role com search_path seguro
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
  );
$function$;

-- Corrigir função send_notification_email com search_path seguro
CREATE OR REPLACE FUNCTION public.send_notification_email(user_email text, subject text, message text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Registrar notificação na tabela (se necessário criar tabela de notificações)
    -- Por enquanto apenas uma função placeholder que pode ser chamada via trigger
    RAISE NOTICE 'Email notification would be sent to % with subject: %', user_email, subject;
END;
$function$;

-- Corrigir função notify_pending_listing com search_path seguro
CREATE OR REPLACE FUNCTION public.notify_pending_listing()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Notificar admins sobre novo anúncio pendente
    PERFORM send_notification_email(
        'admin@tudofaz.com',
        'Novo anúncio pendente de aprovação',
        'Um novo anúncio foi enviado e está aguardando aprovação: ' || NEW.title
    );
    RETURN NEW;
END;
$function$;

-- Corrigir função listings_nearby com search_path seguro
CREATE OR REPLACE FUNCTION public.listings_nearby(p_lat double precision, p_lng double precision, p_radius_km numeric DEFAULT 25, p_limit integer DEFAULT 24)
 RETURNS TABLE(id uuid, title text, price integer, currency text, location text, created_at timestamp with time zone, cover_image text, lat double precision, lng double precision, distance_km numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    l.id,
    l.title,
    l.price,
    l.currency,
    l.location,
    l.created_at,
    l.cover_image,
    l.lat,
    l.lng,
    (
      6371 * acos(
        cos(radians(p_lat)) * cos(radians(l.lat)) * cos(radians(l.lng) - radians(p_lng))
        + sin(radians(p_lat)) * sin(radians(l.lat))
      )
    ) AS distance_km
  FROM public.listings l
  WHERE l.lat IS NOT NULL
    AND l.lng IS NOT NULL
    AND l.approved = true
    AND l.status = 'published'
    AND (
      6371 * acos(
        cos(radians(p_lat)) * cos(radians(l.lat)) * cos(radians(l.lng) - radians(p_lng))
        + sin(radians(p_lat)) * sin(radians(l.lat))
      )
    ) <= p_radius_km
  ORDER BY distance_km ASC
  LIMIT p_limit;
$function$;

-- Restringir acesso à tabela site_settings para não expor chaves do Stripe publicamente
-- Revogar acesso público e permitir apenas usuários autenticados
REVOKE SELECT ON public.site_settings FROM anon;
GRANT SELECT ON public.site_settings TO authenticated;

-- Atualizar política RLS para site_settings
DROP POLICY IF EXISTS "Public can view settings" ON public.site_settings;
CREATE POLICY "Authenticated users can view settings" ON public.site_settings
  FOR SELECT 
  TO authenticated 
  USING (true);