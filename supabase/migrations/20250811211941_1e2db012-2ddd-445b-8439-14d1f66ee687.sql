-- Enable moderation and order integrity triggers
DROP TRIGGER IF EXISTS listings_moderation_ins ON public.listings;
DROP TRIGGER IF EXISTS listings_moderation_upd ON public.listings;
CREATE TRIGGER listings_moderation_ins
BEFORE INSERT ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.enforce_listings_moderation();

CREATE TRIGGER listings_moderation_upd
BEFORE UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.enforce_listings_moderation();

DROP TRIGGER IF EXISTS orders_integrity_upd ON public.orders;
CREATE TRIGGER orders_integrity_upd
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_orders_integrity();

-- Admin RLS policies for listings
DROP POLICY IF EXISTS "Admins can view all listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can update listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can delete listings" ON public.listings;
CREATE POLICY "Admins can view all listings"
ON public.listings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update listings"
ON public.listings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete listings"
ON public.listings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Admin RLS policies for site_settings (allow admins to manage)
DROP POLICY IF EXISTS "Admins can update settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.site_settings;
CREATE POLICY "Admins can update settings"
ON public.site_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings"
ON public.site_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin RLS policies for orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for assets (logo/images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for assets bucket
-- Public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read assets'
  ) THEN
    EXECUTE $$CREATE POLICY "Public read assets" ON storage.objects FOR SELECT USING (bucket_id = 'assets')$$;
  END IF;
END$$;

-- Admin write access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins upload assets'
  ) THEN
    EXECUTE $$CREATE POLICY "Admins upload assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assets' AND public.has_role(auth.uid(),'admin'))$$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins update assets'
  ) THEN
    EXECUTE $$CREATE POLICY "Admins update assets" ON storage.objects FOR UPDATE USING (bucket_id = 'assets' AND public.has_role(auth.uid(),'admin'))$$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins delete assets'
  ) THEN
    EXECUTE $$CREATE POLICY "Admins delete assets" ON storage.objects FOR DELETE USING (bucket_id = 'assets' AND public.has_role(auth.uid(),'admin'))$$;
  END IF;
END$$;