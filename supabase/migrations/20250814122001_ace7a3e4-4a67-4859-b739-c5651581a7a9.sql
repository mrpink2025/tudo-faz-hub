-- Insert default Stripe configuration if not exists
INSERT INTO public.site_settings (id, stripe_enabled, stripe_publishable_key)
VALUES (1, true, 'pk_live_51RvgiIRx02bCc2sPkyWKK6gnESAtpKxJNEpuw8qYNp4uzjQiD806GIIi93vArDSHGPXcJNE7XAtTPrUe0dmqPGp2001O10cOcc')
ON CONFLICT (id) 
DO UPDATE SET 
  stripe_enabled = EXCLUDED.stripe_enabled,
  stripe_publishable_key = EXCLUDED.stripe_publishable_key;