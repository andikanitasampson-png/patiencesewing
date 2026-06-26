
-- 1) Tighten profile self-update so users cannot escalate role/status
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  AND retailer_status IS NOT DISTINCT FROM (SELECT p.retailer_status FROM public.profiles p WHERE p.id = auth.uid())
);

-- 2) Remove guest INSERT policies; guest checkout uses a server function with service role
DROP POLICY IF EXISTS "guest creates own order" ON public.orders;
DROP POLICY IF EXISTS "guest inserts own order items" ON public.order_items;

-- 3) Lock down SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_approved_retailer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_approved_retailer(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.review_retailer_application(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_retailer_application(uuid, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.set_user_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
