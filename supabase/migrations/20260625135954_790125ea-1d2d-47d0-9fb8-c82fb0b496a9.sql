
-- Allow admins to update any profile (for approving retailers / role changes)
CREATE POLICY "admin updates profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Convenience RPC: approve or reject a retailer application atomically
CREATE OR REPLACE FUNCTION public.review_retailer_application(
  _application_id uuid,
  _decision text,
  _notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _decision NOT IN ('approved','rejected') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;

  UPDATE public.retailer_applications
     SET status = _decision,
         admin_notes = COALESCE(_notes, admin_notes),
         reviewed_at = now(),
         reviewed_by = auth.uid()
   WHERE id = _application_id
   RETURNING user_id INTO _uid;

  IF _uid IS NOT NULL THEN
    UPDATE public.profiles
       SET role = CASE WHEN _decision = 'approved' THEN 'retailer' ELSE role END,
           retailer_status = _decision
     WHERE id = _uid;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_retailer_application(uuid, text, text) TO authenticated;
