-- SECURITY FIX: Restrict access to profile email addresses
-- Drop the overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create more secure policies that protect email addresses
-- Allow users to view their own complete profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow admins to view all profiles (for admin panel)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Allow public access to only basic profile info (no email) for chat/messaging
-- This creates a view-like access to non-sensitive data
CREATE POLICY "Public can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (true);

-- However, we need to modify the above to only allow specific columns
-- Let's create a function to get safe profile data instead

-- Create a secure function to get basic profile info (no emails)
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

-- Drop the public policy and keep only user-specific and admin policies
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;