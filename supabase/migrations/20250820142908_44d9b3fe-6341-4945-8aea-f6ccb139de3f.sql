-- Add additional fields to profiles table for personal profile management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create addresses table for user addresses
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Casa", "Trabalho", "Entrega"
  street TEXT NOT NULL,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'Brasil',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_addresses
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Create policies for user_addresses
CREATE POLICY "Users can view their own addresses" 
ON public.user_addresses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own addresses" 
ON public.user_addresses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" 
ON public.user_addresses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" 
ON public.user_addresses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can view all addresses
CREATE POLICY "Admins can view all addresses" 
ON public.user_addresses 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updating updated_at
CREATE TRIGGER update_user_addresses_updated_at
BEFORE UPDATE ON public.user_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);