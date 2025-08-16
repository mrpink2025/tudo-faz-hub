-- Enable selling functionality for listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sellable boolean DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS inventory_count integer DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sold_count integer DEFAULT 0;

-- Create seller permissions table
CREATE TABLE IF NOT EXISTS seller_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for seller permissions
ALTER TABLE seller_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for seller permissions
CREATE POLICY "Users can view their own seller permissions"
ON seller_permissions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all seller permissions"
ON seller_permissions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create shopping cart table
CREATE TABLE IF NOT EXISTS shopping_cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Enable RLS for shopping cart
ALTER TABLE shopping_cart ENABLE ROW LEVEL SECURITY;

-- Policies for shopping cart
CREATE POLICY "Users can manage their own cart"
ON shopping_cart FOR ALL
USING (auth.uid() = user_id);

-- Update orders table to support product purchases
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES auth.users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_notes text;

-- Create order items table for better structure
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price integer NOT NULL CHECK (unit_price >= 0),
  total_price integer NOT NULL CHECK (total_price >= 0),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for order items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for order items
CREATE POLICY "Users can view their order items"
ON order_items FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Sellers can view items from their orders"
ON order_items FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders WHERE seller_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all order items"
ON order_items FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(listing_id, user_id, order_id)
);

-- Enable RLS for product reviews
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for product reviews
CREATE POLICY "Anyone can view reviews"
ON product_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews for their purchased products"
ON product_reviews FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.listing_id = product_reviews.listing_id
    AND o.user_id = auth.uid()
    AND o.status = 'completed'
    AND oi.order_id = product_reviews.order_id
  )
);

CREATE POLICY "Users can update their own reviews"
ON product_reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Create purchase logs table for admin monitoring
CREATE TABLE IF NOT EXISTS purchase_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for purchase logs
ALTER TABLE purchase_logs ENABLE ROW LEVEL SECURITY;

-- Policies for purchase logs
CREATE POLICY "Admins can view all purchase logs"
ON purchase_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shopping_cart_user_id ON shopping_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_listing_id ON order_items(listing_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_listing_id ON product_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_logs_order_id ON purchase_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_permissions_user_id ON seller_permissions(user_id);

-- Create function to check if user can sell
CREATE OR REPLACE FUNCTION can_user_sell(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM seller_permissions 
    WHERE user_id = user_uuid AND approved = true
  );
END;
$$;

-- Create function to calculate average rating
CREATE OR REPLACE FUNCTION get_listing_rating(listing_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating numeric;
  review_count integer;
BEGIN
  SELECT AVG(rating), COUNT(*) 
  INTO avg_rating, review_count
  FROM product_reviews 
  WHERE listing_id = listing_uuid;
  
  RETURN jsonb_build_object(
    'average_rating', COALESCE(avg_rating, 0),
    'review_count', COALESCE(review_count, 0)
  );
END;
$$;

-- Create function to validate cart items from same seller
CREATE OR REPLACE FUNCTION validate_cart_seller(user_uuid uuid, new_listing_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cart_seller_id uuid;
  new_listing_seller_id uuid;
BEGIN
  -- Get seller from existing cart items
  SELECT l.user_id INTO cart_seller_id
  FROM shopping_cart sc
  JOIN listings l ON sc.listing_id = l.id
  WHERE sc.user_id = user_uuid
  LIMIT 1;
  
  -- Get seller from new listing
  SELECT user_id INTO new_listing_seller_id
  FROM listings
  WHERE id = new_listing_id;
  
  -- If cart is empty or same seller, allow
  RETURN cart_seller_id IS NULL OR cart_seller_id = new_listing_seller_id;
END;
$$;

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_seller_permissions_updated_at
  BEFORE UPDATE ON seller_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();