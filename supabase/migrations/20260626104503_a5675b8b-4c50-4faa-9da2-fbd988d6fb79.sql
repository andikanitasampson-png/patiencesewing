
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION private.is_admin(_uid uuid)
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION private.is_approved_retailer(_uid uuid)
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = _uid AND (role = 'admin' OR (role = 'retailer' AND retailer_status = 'approved')));
$$;

REVOKE ALL ON FUNCTION private.is_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_approved_retailer(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION private.is_approved_retailer(uuid) TO authenticated, anon, service_role;

-- Drop dependent policies
DROP POLICY IF EXISTS "users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "admin updates profiles" ON public.profiles;
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "anyone reads active products" ON public.products;
DROP POLICY IF EXISTS "admin manages products" ON public.products;
DROP POLICY IF EXISTS "retailers and admins read tiers" ON public.pricing_tiers;
DROP POLICY IF EXISTS "admin manages tiers" ON public.pricing_tiers;
DROP POLICY IF EXISTS "retailer reads own orders" ON public.orders;
DROP POLICY IF EXISTS "retailer creates own order" ON public.orders;
DROP POLICY IF EXISTS "retailer updates own pending order" ON public.orders;
DROP POLICY IF EXISTS "order items follow order access" ON public.order_items;
DROP POLICY IF EXISTS "admin manages order items" ON public.order_items;
DROP POLICY IF EXISTS "users read own application" ON public.retailer_applications;
DROP POLICY IF EXISTS "admin updates application" ON public.retailer_applications;
DROP POLICY IF EXISTS "product-media admin insert" ON storage.objects;
DROP POLICY IF EXISTS "product-media admin update" ON storage.objects;
DROP POLICY IF EXISTS "product-media admin delete" ON storage.objects;
DROP POLICY IF EXISTS "product-media public read" ON storage.objects;

-- profiles
CREATE POLICY "users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR private.is_admin(auth.uid()));
CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admin updates profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

REVOKE UPDATE (role, retailer_status) ON public.profiles FROM authenticated, anon;
GRANT UPDATE (role, retailer_status) ON public.profiles TO service_role;

-- products
CREATE POLICY "anyone reads active products" ON public.products
  FOR SELECT TO anon, authenticated USING (is_active = true OR private.is_admin(auth.uid()));
CREATE POLICY "admin manages products" ON public.products
  FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

-- pricing_tiers
CREATE POLICY "retailers and admins read tiers" ON public.pricing_tiers
  FOR SELECT TO authenticated USING (private.is_approved_retailer(auth.uid()));
CREATE POLICY "admin manages tiers" ON public.pricing_tiers
  FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

-- orders
CREATE POLICY "retailer reads own orders" ON public.orders
  FOR SELECT TO authenticated USING (retailer_id = auth.uid() OR private.is_admin(auth.uid()));
CREATE POLICY "retailer creates own order" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (retailer_id = auth.uid() AND private.is_approved_retailer(auth.uid()));
CREATE POLICY "retailer updates own pending order" ON public.orders
  FOR UPDATE TO authenticated
  USING ((retailer_id = auth.uid() AND status = 'pending') OR private.is_admin(auth.uid()))
  WITH CHECK ((retailer_id = auth.uid() AND status = 'pending') OR private.is_admin(auth.uid()));

-- order_items
CREATE POLICY "order items follow order access" ON public.order_items
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id
      AND (o.retailer_id = auth.uid() OR private.is_admin(auth.uid()))));
CREATE POLICY "admin manages order items" ON public.order_items
  FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

-- retailer_applications
CREATE POLICY "users read own application" ON public.retailer_applications
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.is_admin(auth.uid()));
CREATE POLICY "admin updates application" ON public.retailer_applications
  FOR UPDATE TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

-- storage policies
CREATE POLICY "product-media public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-media');
CREATE POLICY "product-media admin insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-media' AND private.is_admin(auth.uid()));
CREATE POLICY "product-media admin update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-media' AND private.is_admin(auth.uid())) WITH CHECK (bucket_id = 'product-media' AND private.is_admin(auth.uid()));
CREATE POLICY "product-media admin delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-media' AND private.is_admin(auth.uid()));

-- Drop public-schema SECURITY DEFINER helpers
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_approved_retailer(uuid);
DROP FUNCTION IF EXISTS public.set_user_role(uuid, text);
DROP FUNCTION IF EXISTS public.review_retailer_application(uuid, text, text);
