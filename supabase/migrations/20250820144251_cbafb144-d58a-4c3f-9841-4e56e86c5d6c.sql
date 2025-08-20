-- Add secure data access functions and audit logging for orders

-- Create function to sanitize delivery address data for sellers
-- Sellers only see city, state, postal code - not full address or personal details
CREATE OR REPLACE FUNCTION public.get_seller_delivery_info(order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record record;
  current_user_id uuid := auth.uid();
  sanitized_address jsonb;
BEGIN
  -- Get the order and verify seller access
  SELECT * INTO order_record 
  FROM orders 
  WHERE id = order_id 
    AND seller_id = current_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Order not found or access denied');
  END IF;
  
  -- Return sanitized delivery information for sellers
  IF order_record.delivery_address IS NOT NULL THEN
    sanitized_address := jsonb_build_object(
      'city', order_record.delivery_address->>'city',
      'state', order_record.delivery_address->>'state',
      'postal_code', order_record.delivery_address->>'postal_code',
      'delivery_notes', order_record.delivery_address->>'delivery_notes'
    );
  ELSE
    sanitized_address := null;
  END IF;
  
  RETURN jsonb_build_object(
    'order_id', order_record.id,
    'delivery_address', sanitized_address,
    'delivery_method', order_record.delivery_method,
    'estimated_delivery_date', order_record.estimated_delivery_date,
    'tracking_code', order_record.tracking_code,
    'seller_notes', order_record.seller_notes
  );
END;
$$;

-- Create audit logging function for sensitive order operations
CREATE OR REPLACE FUNCTION public.log_order_access(
  p_order_id uuid,
  p_action text,
  p_accessed_fields text[] DEFAULT ARRAY[]::text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    'order_data_access',
    p_action,
    jsonb_build_object(
      'order_id', p_order_id,
      'accessed_fields', p_accessed_fields,
      'timestamp', now(),
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    )
  );
END;
$$;

-- Create trigger to automatically log access to sensitive order data
CREATE OR REPLACE FUNCTION public.audit_sensitive_order_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when someone accesses orders with sensitive payment data
  IF TG_OP = 'SELECT' THEN
    -- Check if this is accessing sensitive fields
    PERFORM log_order_access(
      NEW.id,
      'Order data accessed',
      ARRAY['delivery_address', 'stripe_session_id', 'amount']
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the audit trigger to the orders table
DROP TRIGGER IF EXISTS audit_order_access_trigger ON public.orders;
CREATE TRIGGER audit_order_access_trigger
  AFTER SELECT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION audit_sensitive_order_access();

-- Create function to check if user can access specific order fields
CREATE OR REPLACE FUNCTION public.can_access_order_field(
  p_order_id uuid,
  p_field_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record record;
  current_user_id uuid := auth.uid();
BEGIN
  -- Get order details
  SELECT user_id, seller_id INTO order_record
  FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check permissions based on field type
  CASE p_field_name
    WHEN 'delivery_address', 'stripe_session_id' THEN
      -- Only customer and admins can access full sensitive data
      RETURN (
        current_user_id = order_record.user_id OR 
        has_role(current_user_id, 'admin'::app_role)
      );
    WHEN 'seller_delivery_info' THEN
      -- Sellers can access limited delivery info
      RETURN (
        current_user_id = order_record.seller_id OR
        current_user_id = order_record.user_id OR 
        has_role(current_user_id, 'admin'::app_role)
      );
    ELSE
      -- Basic order info accessible to customer, seller, and admin
      RETURN (
        current_user_id = order_record.user_id OR 
        current_user_id = order_record.seller_id OR
        has_role(current_user_id, 'admin'::app_role)
      );
  END CASE;
END;
$$;