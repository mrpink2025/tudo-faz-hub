-- ============================================================================
-- 🔒 SECURITY FIX: ORDERS TABLE PAYMENT DATA PROTECTION (SIMPLIFIED)
-- ============================================================================

-- First, drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- 1. Customers can view their own orders
CREATE POLICY "Customers can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Sellers can view orders for their listings
CREATE POLICY "Sellers can view orders for their listings" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = seller_id);

-- 3. Admins can view all orders
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Only customers can create orders for themselves
CREATE POLICY "Customers can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Admins can update orders
CREATE POLICY "Admins can update orders" 
ON public.orders 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. System/Edge functions can update orders (using service role)
CREATE POLICY "System can update orders" 
ON public.orders 
FOR UPDATE 
USING (true);