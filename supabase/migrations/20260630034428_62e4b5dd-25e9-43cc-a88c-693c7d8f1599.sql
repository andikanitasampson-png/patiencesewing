
-- 1) profiles_role_escalation: trigger guards role/retailer_status
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF private.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Not authorized to change role';
  END IF;
  IF NEW.retailer_status IS DISTINCT FROM OLD.retailer_status THEN
    RAISE EXCEPTION 'Not authorized to change retailer_status';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_profile_role_escalation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS prevent_profile_role_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_profile_role_escalation_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- 2) retailer_applications_anon_insert: remove anon direct-insert path
DROP POLICY IF EXISTS "anon submits application" ON public.retailer_applications;
REVOKE INSERT ON public.retailer_applications FROM anon;
REVOKE SELECT ON public.retailer_applications FROM anon;

-- 3) orders_guest_order_no_read_policy: keep table write-only for guests;
--    guest lookups must go through a security-definer function with email check.
COMMENT ON TABLE public.orders IS
  'Guest orders (retailer_id IS NULL) are not readable via RLS. Use public.get_guest_order(uuid, text), which verifies the supplied email matches guest_email before returning a row.';

CREATE OR REPLACE FUNCTION public.get_guest_order(_order_id uuid, _email text)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  status text,
  total_ngn numeric,
  shipping_address text,
  notes text,
  paystack_reference text,
  paystack_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.created_at, o.status, o.total_ngn,
         o.shipping_address, o.notes, o.paystack_reference, o.paystack_status
  FROM public.orders o
  WHERE o.id = _order_id
    AND o.retailer_id IS NULL
    AND o.guest_email IS NOT NULL
    AND lower(o.guest_email) = lower(_email);
$$;

CREATE OR REPLACE FUNCTION public.get_guest_order_items(_order_id uuid, _email text)
RETURNS TABLE (
  id uuid,
  product_name text,
  color text,
  size text,
  quantity integer,
  unit_price_ngn numeric,
  subtotal_ngn numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.product_name, i.color, i.size, i.quantity, i.unit_price_ngn, i.subtotal_ngn
  FROM public.order_items i
  JOIN public.orders o ON o.id = i.order_id
  WHERE o.id = _order_id
    AND o.retailer_id IS NULL
    AND o.guest_email IS NOT NULL
    AND lower(o.guest_email) = lower(_email);
$$;

REVOKE EXECUTE ON FUNCTION public.get_guest_order(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_guest_order_items(uuid, text) FROM PUBLIC;
-- Server function (service_role) calls these; no direct anon/authenticated execute.
GRANT EXECUTE ON FUNCTION public.get_guest_order(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_guest_order_items(uuid, text) TO service_role;
