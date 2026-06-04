-- Lock down screenshot uploads: valid JWT required, UUID filenames only, admins can delete.

DROP POLICY IF EXISTS "Anyone can upload screenshots" ON storage.objects;

CREATE POLICY "JWT callers upload report screenshots"
  ON storage.objects
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    bucket_id = 'screenshots'
    AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpe?g|png|webp|gif)$'
  );

CREATE POLICY "Admins delete screenshots"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'screenshots'
    AND public.has_role(auth.uid(), 'admin')
  );
