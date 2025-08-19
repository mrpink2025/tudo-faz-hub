-- Create voltages table
CREATE TABLE public.voltages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voltages ENABLE ROW LEVEL SECURITY;

-- Create policy for public viewing
CREATE POLICY "Voltages are viewable by everyone" 
ON public.voltages 
FOR SELECT 
USING (true);

-- Insert default voltages
INSERT INTO public.voltages (name, sort_order) VALUES
('110V', 1),
('220V', 2),
('Bivolt', 3);

-- Create listing_voltages table
CREATE TABLE public.listing_voltages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL,
  voltage_id UUID NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.listing_voltages ENABLE ROW LEVEL SECURITY;

-- Create policies for listing_voltages
CREATE POLICY "Listing voltages are viewable by everyone for published listings" 
ON public.listing_voltages 
FOR SELECT 
USING (
  listing_id IN (
    SELECT id FROM listings 
    WHERE approved = true AND status = 'published'
  ) OR 
  listing_id IN (
    SELECT id FROM listings 
    WHERE user_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can manage voltages for their own listings" 
ON public.listing_voltages 
FOR ALL 
USING (
  listing_id IN (
    SELECT id FROM listings 
    WHERE user_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin')
)
WITH CHECK (
  listing_id IN (
    SELECT id FROM listings 
    WHERE user_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin')
);

-- Add voltage_required column to listings table
ALTER TABLE public.listings ADD COLUMN voltage_required BOOLEAN NOT NULL DEFAULT false;