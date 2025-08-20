-- CRITICAL SECURITY FIX: Remove hardcoded email backdoor
-- Update auto-approval function to only use trusted_seller boolean
CREATE OR REPLACE FUNCTION public.auto_approve_trusted_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    is_trusted boolean;
BEGIN
    -- Get the user's trusted seller status
    SELECT trusted_seller INTO is_trusted
    FROM profiles 
    WHERE id = NEW.user_id;
    
    -- Auto-approve listings ONLY for trusted users (removed hardcoded email backdoor)
    IF is_trusted = true THEN
        NEW.approved := true;
        
        -- Log the auto-approval for audit trail
        INSERT INTO activity_logs (
            user_id,
            activity_type,
            description,
            metadata
        ) VALUES (
            NEW.user_id,
            'listing_auto_approved',
            'Listing auto-approved for trusted seller',
            jsonb_build_object(
                'listing_id', NEW.id,
                'listing_title', NEW.title,
                'auto_approved_reason', 'trusted_seller'
            )
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- SECURITY FIX: Tighten overly permissive orders RLS policy
-- Remove the dangerous "System can update orders" policy that uses `true`
DROP POLICY IF EXISTS "System can update orders" ON public.orders;

-- Create a more restrictive policy for system order updates
CREATE POLICY "System can update order status and tracking" 
ON public.orders 
FOR UPDATE 
USING (
    -- Only allow system updates for specific fields by edge functions
    -- This should only be used by verified edge functions with proper authentication
    auth.jwt() ->> 'role' = 'service_role' OR
    has_role(auth.uid(), 'admin'::app_role)
);

-- SECURITY FIX: Add audit logging for trusted seller status changes
CREATE OR REPLACE FUNCTION public.log_trusted_seller_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Log when trusted_seller status changes
    IF OLD.trusted_seller IS DISTINCT FROM NEW.trusted_seller THEN
        INSERT INTO activity_logs (
            user_id,
            activity_type,
            description,
            metadata
        ) VALUES (
            auth.uid(), -- Admin who made the change
            'trusted_seller_status_changed',
            CASE 
                WHEN NEW.trusted_seller = true THEN 'User granted trusted seller status'
                ELSE 'User trusted seller status revoked'
            END,
            jsonb_build_object(
                'target_user_id', NEW.id,
                'target_user_email', NEW.email,
                'old_status', OLD.trusted_seller,
                'new_status', NEW.trusted_seller,
                'changed_by', auth.uid()
            )
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for trusted seller status changes
DROP TRIGGER IF EXISTS log_trusted_seller_changes_trigger ON public.profiles;
CREATE TRIGGER log_trusted_seller_changes_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_trusted_seller_changes();

-- SECURITY FIX: Restrict system access to sensitive order fields
-- Update the order access function to be more restrictive
CREATE OR REPLACE FUNCTION public.can_access_order_field(p_order_id uuid, p_field_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  order_record record;
  current_user_id uuid := auth.uid();
  is_admin boolean;
BEGIN
  -- Get order details and check if user is admin
  SELECT user_id, seller_id INTO order_record
  FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if current user is admin
  SELECT has_role(current_user_id, 'admin'::app_role) INTO is_admin;
  
  -- Check permissions based on field type with stricter controls
  CASE p_field_name
    WHEN 'delivery_address', 'stripe_session_id' THEN
      -- Only customer and verified admins can access full sensitive data
      RETURN (
        current_user_id = order_record.user_id OR 
        is_admin = true
      );
    WHEN 'seller_delivery_info' THEN
      -- Sellers can access limited delivery info, but log the access
      IF current_user_id = order_record.seller_id OR 
         current_user_id = order_record.user_id OR 
         is_admin = true THEN
        
        -- Log sensitive data access
        PERFORM log_order_access(
          p_order_id, 
          'accessed_delivery_info', 
          ARRAY[p_field_name]
        );
        
        RETURN true;
      END IF;
      RETURN false;
    ELSE
      -- Basic order info accessible to customer, seller, and admin
      RETURN (
        current_user_id = order_record.user_id OR 
        current_user_id = order_record.seller_id OR
        is_admin = true
      );
  END CASE;
END;
$function$;