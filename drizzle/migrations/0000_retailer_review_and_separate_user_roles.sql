ALTER TABLE public.retailer_applications ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.retailer_applications ADD COLUMN IF NOT EXISTS reviewed_by uuid;
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'retailer')),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION private.is_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'admin');
$$;
CREATE OR REPLACE FUNCTION private.is_approved_retailer(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'admin')
    OR (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'retailer')
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND retailer_status = 'approved'));
$$;
CREATE POLICY "users and admins read roles" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.is_admin(auth.uid()));
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles WHERE role IN ('admin', 'retailer')
ON CONFLICT (user_id, role) DO NOTHING;
COMMENT ON COLUMN public.profiles.role IS 'DEPRECATED: authorization now uses public.user_roles; retained for older clients.';