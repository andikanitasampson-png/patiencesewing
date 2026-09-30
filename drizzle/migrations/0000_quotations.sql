CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  quantity integer,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  admin_response text,
  responded_at timestamptz,
  responded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.quotations TO authenticated;
GRANT ALL ON public.quotations TO service_role;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own or admin reads quotations" ON public.quotations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.is_admin(auth.uid()));
CREATE POLICY "admin updates quotations" ON public.quotations FOR UPDATE TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "admin deletes quotations" ON public.quotations FOR DELETE TO authenticated
  USING (private.is_admin(auth.uid()));
CREATE POLICY "admin deletes applications" ON public.retailer_applications FOR DELETE TO authenticated
  USING (private.is_admin(auth.uid()));
GRANT DELETE ON public.retailer_applications TO authenticated;