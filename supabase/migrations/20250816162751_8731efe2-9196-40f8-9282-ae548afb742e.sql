-- Fix the generate_affiliate_code function to use the correct random function
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code using random() function
    code := upper(
      substr(
        md5(random()::text), 
        1, 8
      )
    );
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = code) INTO exists_code;
    
    EXIT WHEN NOT exists_code;
  END LOOP;
  
  RETURN code;
END;
$function$;

-- Also fix the generate_tracking_code function
CREATE OR REPLACE FUNCTION public.generate_tracking_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Generate 12 character alphanumeric code using random() function
    code := lower(
      substr(
        md5(random()::text), 
        1, 12
      )
    );
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM affiliate_links WHERE tracking_code = code) INTO exists_code;
    
    EXIT WHEN NOT exists_code;
  END LOOP;
  
  RETURN code;
END;
$function$;