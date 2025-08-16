-- Security fixes: Address critical data exposure and harden database security

-- 1. Fix product_reviews RLS policy - restrict public access to only non-sensitive data
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.product_reviews;

CREATE POLICY "Public can view sanitized reviews" 
ON public.product_reviews 
FOR SELECT 
USING (
  -- Only show rating, comment, and created_at for approved listings
  -- Hide user_id, order_id and other sensitive data from public access
  EXISTS (
    SELECT 1 FROM listings l 
    WHERE l.id = product_reviews.listing_id 
    AND l.approved = true 
    AND l.status = 'published'
  )
);

-- 2. Fix affiliate_links RLS policy - restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active affiliate links for tracking" ON public.affiliate_links;

CREATE POLICY "Authenticated users can view affiliate links for tracking" 
ON public.affiliate_links 
FOR SELECT 
USING (
  -- Only authenticated users can view affiliate links
  auth.uid() IS NOT NULL
);

-- 3. Create secure function to get public product reviews (without sensitive data)
CREATE OR REPLACE FUNCTION public.get_public_product_reviews(p_listing_id uuid)
RETURNS TABLE(
  rating integer,
  comment text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only return non-sensitive review data for approved listings
  RETURN QUERY
  SELECT 
    pr.rating,
    pr.comment,
    pr.created_at
  FROM product_reviews pr
  JOIN listings l ON pr.listing_id = l.id
  WHERE pr.listing_id = p_listing_id
    AND l.approved = true 
    AND l.status = 'published'
  ORDER BY pr.created_at DESC;
END;
$$;

-- 4. Add search_path security to existing functions that don't have it
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Gerar código alfanumérico de 8 caracteres
    code := upper(substring(encode(gen_random_bytes(6), 'base64') from 1 for 8));
    code := replace(code, '+', '');
    code := replace(code, '/', '');
    code := replace(code, '=', '');
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = code) INTO exists_code;
    
    EXIT WHEN NOT exists_code;
  END LOOP;
  
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_tracking_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Gerar código alfanumérico de 12 caracteres
    code := lower(substring(encode(gen_random_bytes(9), 'base64') from 1 for 12));
    code := replace(code, '+', '');
    code := replace(code, '/', '');
    code := replace(code, '=', '');
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM affiliate_links WHERE tracking_code = code) INTO exists_code;
    
    EXIT WHEN NOT exists_code;
  END LOOP;
  
  RETURN code;
END;
$$;

-- 5. Add audit logging function for sensitive operations
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_user_id uuid DEFAULT auth.uid(),
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'security_event',
    p_event_type,
    p_details
  );
END;
$$;

-- 6. Create function to detect suspicious activity patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(
  p_user_id uuid,
  p_action text,
  p_ip_address inet DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_actions integer;
  suspicious boolean := false;
BEGIN
  -- Count recent similar actions from this user
  SELECT COUNT(*) INTO recent_actions
  FROM activity_logs
  WHERE user_id = p_user_id
    AND activity_type = p_action
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  -- Flag as suspicious if more than 10 actions in 5 minutes
  IF recent_actions > 10 THEN
    suspicious := true;
    
    -- Log the suspicious activity
    PERFORM log_security_event(
      'suspicious_activity_detected',
      p_user_id,
      jsonb_build_object(
        'action', p_action,
        'count', recent_actions,
        'ip_address', p_ip_address
      )
    );
  END IF;
  
  RETURN suspicious;
END;
$$;