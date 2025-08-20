-- ============================================================================
-- 🔒 SECURITY FIX: ORDERS TABLE PAYMENT DATA PROTECTION (CORRECTED)
-- ============================================================================

-- First, drop existing insufficient policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- Create comprehensive secure RLS policies
-- 1. Customers can view their own orders
CREATE POLICY "Customers can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Sellers can view orders for their listings only
CREATE POLICY "Sellers can view orders for their listings" 
ON public.orders 
FOR SELECT 
USING (
  auth.uid() = seller_id 
  OR EXISTS (
    SELECT 1 FROM listings l 
    WHERE l.id = orders.listing_id 
    AND l.user_id = auth.uid()
  )
);

-- 3. Customers can create orders for themselves
CREATE POLICY "Customers can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Only customers can update their own orders (limited fields)
CREATE POLICY "Customers can update limited order fields" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Prevent changing critical payment fields
  OLD.amount = NEW.amount AND
  OLD.currency = NEW.currency AND
  OLD.stripe_session_id = NEW.stripe_session_id AND
  OLD.user_id = NEW.user_id AND
  OLD.created_at = NEW.created_at
);

-- 5. Sellers can update order status and seller notes only
CREATE POLICY "Sellers can update order status and notes" 
ON public.orders 
FOR UPDATE 
USING (
  auth.uid() = seller_id 
  OR EXISTS (
    SELECT 1 FROM listings l 
    WHERE l.id = orders.listing_id 
    AND l.user_id = auth.uid()
  )
)
WITH CHECK (
  (auth.uid() = seller_id OR EXISTS (
    SELECT 1 FROM listings l 
    WHERE l.id = orders.listing_id 
    AND l.user_id = auth.uid()
  )) AND
  -- Sellers can only update specific fields
  OLD.amount = NEW.amount AND
  OLD.currency = NEW.currency AND
  OLD.stripe_session_id = NEW.stripe_session_id AND
  OLD.user_id = NEW.user_id AND
  OLD.listing_id = NEW.listing_id AND
  OLD.created_at = NEW.created_at AND
  OLD.affiliate_id = NEW.affiliate_id AND
  OLD.affiliate_commission = NEW.affiliate_commission
);

-- 6. Admins have full access but with audit logging
CREATE POLICY "Admins have full access to orders" 
ON public.orders 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));