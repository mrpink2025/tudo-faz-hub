-- Create policies for the 'assets' bucket that is being used in the code
CREATE POLICY "Anyone can view assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'assets');

CREATE POLICY "Authenticated users can upload to assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update assets" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete assets" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'assets' 
  AND auth.role() = 'authenticated'
);