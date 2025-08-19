-- Create table for available sizes
CREATE TABLE public.sizes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text NOT NULL, -- 'shoes', 'clothes', 'accessories', etc.
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert common sizes
INSERT INTO public.sizes (name, category, sort_order) VALUES
-- Shoe sizes (Brazilian standard)
('33', 'shoes', 1),
('34', 'shoes', 2),
('35', 'shoes', 3),
('36', 'shoes', 4),
('37', 'shoes', 5),
('38', 'shoes', 6),
('39', 'shoes', 7),
('40', 'shoes', 8),
('41', 'shoes', 9),
('42', 'shoes', 10),
('43', 'shoes', 11),
('44', 'shoes', 12),
('45', 'shoes', 13),
('46', 'shoes', 14),
-- Clothing sizes
('PP', 'clothes', 1),
('P', 'clothes', 2),
('M', 'clothes', 3),
('G', 'clothes', 4),
('GG', 'clothes', 5),
('XG', 'clothes', 6),
('XXG', 'clothes', 7);

-- Create table for listing sizes (many-to-many relationship)
CREATE TABLE public.listing_sizes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  size_id uuid NOT NULL REFERENCES public.sizes(id) ON DELETE CASCADE,
  stock_quantity integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(listing_id, size_id)
);

-- Enable RLS on both tables
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_sizes ENABLE ROW LEVEL SECURITY;

-- RLS policies for sizes (public read)
CREATE POLICY "Sizes are viewable by everyone"
ON public.sizes
FOR SELECT
USING (true);

-- RLS policies for listing_sizes
CREATE POLICY "Listing sizes are viewable by everyone for published listings"
ON public.listing_sizes
FOR SELECT
USING (
  listing_id IN (
    SELECT id FROM public.listings 
    WHERE approved = true AND status = 'published'
  )
  OR 
  listing_id IN (
    SELECT id FROM public.listings 
    WHERE user_id = auth.uid()
  )
  OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can manage sizes for their own listings"
ON public.listing_sizes
FOR ALL
USING (
  listing_id IN (
    SELECT id FROM public.listings 
    WHERE user_id = auth.uid()
  )
  OR
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  listing_id IN (
    SELECT id FROM public.listings 
    WHERE user_id = auth.uid()
  )
  OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add size_required field to listings table
ALTER TABLE public.listings ADD COLUMN size_required boolean NOT NULL DEFAULT false;

-- Update shopping cart to include size information
ALTER TABLE public.shopping_cart ADD COLUMN size_id uuid REFERENCES public.sizes(id);

-- Update order_items to include size information  
ALTER TABLE public.order_items ADD COLUMN size_id uuid REFERENCES public.sizes(id);