-- First, let's check if the user exists and get their ID
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get the user ID for BDMimporta@gmail.com
    SELECT id INTO target_user_id 
    FROM profiles 
    WHERE email = 'BDMimporta@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Update all existing listings from this user to be approved
        UPDATE public.listings 
        SET approved = true 
        WHERE user_id = target_user_id AND approved = false;
        
        RAISE NOTICE 'Auto-approved existing listings for user: %', target_user_id;
    ELSE
        RAISE NOTICE 'User BDMimporta@gmail.com not found in profiles table';
    END IF;
END $$;

-- Create a function to auto-approve listings for specific users
CREATE OR REPLACE FUNCTION public.auto_approve_trusted_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email text;
BEGIN
    -- Get the user's email
    SELECT email INTO user_email 
    FROM profiles 
    WHERE id = NEW.user_id;
    
    -- Auto-approve listings for trusted users
    IF user_email = 'BDMimporta@gmail.com' THEN
        NEW.approved := true;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger to auto-approve listings for trusted users
DROP TRIGGER IF EXISTS trigger_auto_approve_trusted_users ON public.listings;
CREATE TRIGGER trigger_auto_approve_trusted_users
    BEFORE INSERT ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_approve_trusted_users();