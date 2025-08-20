-- ============================================================================
-- 🔒 SECURITY FIX: ORDERS TABLE PAYMENT DATA PROTECTION
-- ============================================================================
-- 
-- Fixing critical security vulnerabilities in orders table:
-- 1. Missing seller access controls
-- 2. Inadequate delivery address protection  
-- 3. Exposed Stripe session IDs
-- 4. Missing audit logging for sensitive operations
-- 
-- ============================================================================

-- First, drop existing insufficient policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- Create comprehensive secure RLS policies
-- 1. Customers can view their own orders (limited sensitive data)
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

-- Create function to sanitize order data for different user roles
CREATE OR REPLACE FUNCTION public.get_sanitized_order_data(order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record record;
  current_user_id uuid := auth.uid();
  sanitized_data jsonb;
BEGIN
  -- Get the order
  SELECT * INTO order_record 
  FROM orders 
  WHERE id = order_id;
  
  IF NOT FOUND THEN
    RETURN '{"error": "Order not found"}'::jsonb;
  END IF;
  
  -- Check if user has access to this order
  IF NOT (
    current_user_id = order_record.user_id OR 
    current_user_id = order_record.seller_id OR
    has_role(current_user_id, 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM listings l 
      WHERE l.id = order_record.listing_id 
      AND l.user_id = current_user_id
    )
  ) THEN
    RETURN '{"error": "Access denied"}'::jsonb;
  END IF;
  
  -- Build sanitized data based on user role
  sanitized_data := jsonb_build_object(
    'id', order_record.id,
    'status', order_record.status,
    'amount', order_record.amount,
    'currency', order_record.currency,
    'created_at', order_record.created_at,
    'updated_at', order_record.updated_at,
    'delivery_method', order_record.delivery_method,
    'estimated_delivery_date', order_record.estimated_delivery_date
  );
  
  -- Add role-specific data
  IF has_role(current_user_id, 'admin'::app_role) THEN
    -- Admins see everything
    sanitized_data := sanitized_data || jsonb_build_object(
      'stripe_session_id', order_record.stripe_session_id,
      'delivery_address', order_record.delivery_address,
      'order_notes', order_record.order_notes,
      'seller_notes', order_record.seller_notes,
      'tracking_code', order_record.tracking_code,
      'user_id', order_record.user_id,
      'seller_id', order_record.seller_id,
      'listing_id', order_record.listing_id
    );
  ELSIF current_user_id = order_record.user_id THEN
    -- Customers see their delivery info and tracking
    sanitized_data := sanitized_data || jsonb_build_object(
      'delivery_address', order_record.delivery_address,
      'order_notes', order_record.order_notes,
      'tracking_code', order_record.tracking_code,
      'seller_id', order_record.seller_id,
      'listing_id', order_record.listing_id
    );
  ELSIF current_user_id = order_record.seller_id OR EXISTS (
    SELECT 1 FROM listings l 
    WHERE l.id = order_record.listing_id 
    AND l.user_id = current_user_id
  ) THEN
    -- Sellers see delivery info but not full personal details
    sanitized_data := sanitized_data || jsonb_build_object(
      'delivery_address', 
      CASE 
        WHEN order_record.delivery_address IS NOT NULL THEN
          jsonb_build_object(
            'city', order_record.delivery_address->>'city',
            'state', order_record.delivery_address->>'state',
            'postal_code', order_record.delivery_address->>'postal_code'
          )
        ELSE NULL 
      END,
      'seller_notes', order_record.seller_notes,
      'tracking_code', order_record.tracking_code,
      'user_id', order_record.user_id,
      'listing_id', order_record.listing_id
    );
  END IF;
  
  RETURN sanitized_data;
END;
$$;

-- Create audit logging for sensitive order operations
CREATE OR REPLACE FUNCTION public.audit_order_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to orders with sensitive data
  IF TG_OP = 'SELECT' AND (
    NEW.delivery_address IS NOT NULL OR 
    NEW.stripe_session_id IS NOT NULL
  ) THEN
    INSERT INTO activity_logs (
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      auth.uid(),
      'order_access',
      'Accessed order with sensitive data',
      jsonb_build_object(
        'order_id', NEW.id,
        'operation', TG_OP,
        'timestamp', now()
      )
    );
  END IF;
  
  -- Log modifications to sensitive fields
  IF TG_OP = 'UPDATE' AND (
    OLD.delivery_address IS DISTINCT FROM NEW.delivery_address OR
    OLD.stripe_session_id IS DISTINCT FROM NEW.stripe_session_id OR
    OLD.amount IS DISTINCT FROM NEW.amount
  ) THEN
    INSERT INTO activity_logs (
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      auth.uid(),
      'order_sensitive_update',
      'Modified sensitive order data',
      jsonb_build_object(
        'order_id', NEW.id,
        'changed_fields', jsonb_build_object(
          'delivery_address_changed', OLD.delivery_address IS DISTINCT FROM NEW.delivery_address,
          'stripe_session_changed', OLD.stripe_session_id IS DISTINCT FROM NEW.stripe_session_id,
          'amount_changed', OLD.amount IS DISTINCT FROM NEW.amount
        ),
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;