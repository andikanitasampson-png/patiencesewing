
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS videos text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.set_user_role(_user_id uuid, _role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _role NOT IN ('customer','retailer','admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  UPDATE public.profiles
     SET role = _role,
         retailer_status = CASE WHEN _role = 'retailer' THEN 'approved'
                                ELSE retailer_status END
   WHERE id = _user_id;
END;
$$;

DROP POLICY IF EXISTS "product-media public read" ON storage.objects;
CREATE POLICY "product-media public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-media');

DROP POLICY IF EXISTS "product-media admin insert" ON storage.objects;
CREATE POLICY "product-media admin insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-media' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "product-media admin update" ON storage.objects;
CREATE POLICY "product-media admin update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-media' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "product-media admin delete" ON storage.objects;
CREATE POLICY "product-media admin delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-media' AND public.is_admin(auth.uid()));
