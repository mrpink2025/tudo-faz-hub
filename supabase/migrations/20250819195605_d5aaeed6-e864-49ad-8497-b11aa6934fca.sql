-- Add policy to allow admins to delete any listing
CREATE POLICY "Admins can delete any listing"
ON public.listings
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));