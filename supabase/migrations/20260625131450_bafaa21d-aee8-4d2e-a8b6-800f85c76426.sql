
-- search_path on set_updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- Restrict execution: helpers are only used by RLS policies; trigger fn runs as definer
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.is_admin(uuid) from anon, public;
revoke execute on function public.is_approved_retailer(uuid) from anon, public;
revoke execute on function public.set_updated_at() from anon, authenticated, public;

-- Tighten retailer application insert: must claim own user_id or be anonymous
drop policy if exists "anyone submits application" on public.retailer_applications;
create policy "anon submits application" on public.retailer_applications for insert
  to anon with check (user_id is null);
create policy "auth user submits own application" on public.retailer_applications for insert
  to authenticated with check (user_id = auth.uid());
