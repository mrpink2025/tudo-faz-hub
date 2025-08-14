-- SECURITY FIX: Restrict access to profile email addresses
-- First, let's see what policies exist and remove the problematic one
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- The "Admins can view all profiles" policy already exists, so we just need to ensure
-- users can view their own profiles
CREATE POLICY IF NOT EXISTS "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create a secure function to get basic profile info (no emails) for public use
CREATE OR REPLACE FUNCTION get_basic_profile_info(profile_user_id uuid)
RETURNS TABLE(user_id uuid, full_name text, avatar_url text) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.avatar_url
  FROM profiles p
  WHERE p.id = profile_user_id;
END;
$$;