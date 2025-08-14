-- SECURITY FIX: Restrict access to profile email addresses
-- Remove the problematic policy that exposes all profile data
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create policy for users to view their own profile (checking if it doesn't exist first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile" 
    ON public.profiles 
    FOR SELECT 
    USING (auth.uid() = id);
  END IF;
END $$;

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