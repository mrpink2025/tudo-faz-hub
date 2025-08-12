-- 1) Attach moderation and integrity triggers
-- Listings moderation trigger
DROP TRIGGER IF EXISTS trg_enforce_listings_moderation ON public.listings;
CREATE TRIGGER trg_enforce_listings_moderation
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.enforce_listings_moderation();

-- Listings updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_listings ON public.listings;
CREATE TRIGGER trg_set_updated_at_listings
BEFORE UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Orders integrity trigger
DROP TRIGGER IF EXISTS trg_enforce_orders_integrity ON public.orders;
CREATE TRIGGER trg_enforce_orders_integrity
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_orders_integrity();

-- Orders updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_orders ON public.orders;
CREATE TRIGGER trg_set_updated_at_orders
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Site settings updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_site_settings ON public.site_settings;
CREATE TRIGGER trg_set_updated_at_site_settings
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Listing locations updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_listing_locations ON public.listing_locations;
CREATE TRIGGER trg_set_updated_at_listing_locations
BEFORE UPDATE ON public.listing_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 2) RLS: grant admins the right visibility and control
-- Listings: allow admins to see and update all listings (including pending)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'listings' AND policyname = 'Admins can view all listings'
  ) THEN
    CREATE POLICY "Admins can view all listings"
    ON public.listings
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'listings' AND policyname = 'Admins can update all listings'
  ) THEN
    CREATE POLICY "Admins can update all listings"
    ON public.listings
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Orders: allow admins to see and update all orders (status changes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Admins can view all orders'
  ) THEN
    CREATE POLICY "Admins can view all orders"
    ON public.orders
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Admins can update orders'
  ) THEN
    CREATE POLICY "Admins can update orders"
    ON public.orders
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Site settings: allow admins to update settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'site_settings' AND policyname = 'Admins can update site settings'
  ) THEN
    CREATE POLICY "Admins can update site settings"
    ON public.site_settings
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;