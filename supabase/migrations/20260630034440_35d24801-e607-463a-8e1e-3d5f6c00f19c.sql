
REVOKE EXECUTE ON FUNCTION public.get_guest_order(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_guest_order_items(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_role_escalation() FROM PUBLIC, anon, authenticated;
