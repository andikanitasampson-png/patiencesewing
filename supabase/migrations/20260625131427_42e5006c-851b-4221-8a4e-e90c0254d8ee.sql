
-- ============ HELPER: updated_at ============
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  business_name text,
  phone text,
  email text not null,
  role text not null default 'guest' check (role in ('guest','retailer','admin')),
  retailer_status text check (retailer_status in ('pending','approved','rejected')),
  monthly_volume text,
  business_address text,
  social_links jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- security definer helpers (avoid recursive RLS)
create or replace function public.is_admin(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = _uid and role = 'admin');
$$;

create or replace function public.is_approved_retailer(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = _uid and (role = 'admin' or (role = 'retailer' and retailer_status = 'approved')));
$$;

create policy "users read own profile" on public.profiles for select to authenticated
  using (auth.uid() = id or public.is_admin(auth.uid()));
create policy "users update own profile" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ PRODUCTS ============
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null,
  fabric text,
  images text[] not null default '{}',
  colors text[] not null default '{}',
  sizes text[] not null default '{}',
  moq integer not null default 12,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;

create policy "anyone reads active products" on public.products for select
  using (is_active = true or public.is_admin(auth.uid()));
create policy "admin manages products" on public.products for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============ PRICING TIERS ============
create table public.pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  min_qty integer not null,
  max_qty integer,
  unit_price_ngn numeric(10,2) not null
);
grant select, insert, update, delete on public.pricing_tiers to authenticated;
grant all on public.pricing_tiers to service_role;
alter table public.pricing_tiers enable row level security;

create policy "retailers and admins read tiers" on public.pricing_tiers for select to authenticated
  using (public.is_approved_retailer(auth.uid()));
create policy "admin manages tiers" on public.pricing_tiers for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============ ORDERS ============
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','payment_confirmed','processing','shipped','delivered','cancelled')),
  total_ngn numeric(12,2) not null,
  paystack_reference text unique,
  paystack_status text,
  shipping_address text,
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;

create policy "retailer reads own orders" on public.orders for select to authenticated
  using (retailer_id = auth.uid() or public.is_admin(auth.uid()));
create policy "retailer creates own order" on public.orders for insert to authenticated
  with check (retailer_id = auth.uid() and public.is_approved_retailer(auth.uid()));
create policy "retailer updates own pending order" on public.orders for update to authenticated
  using (retailer_id = auth.uid() or public.is_admin(auth.uid()))
  with check (retailer_id = auth.uid() or public.is_admin(auth.uid()));

-- ============ ORDER ITEMS ============
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text not null,
  color text,
  size text,
  quantity integer not null,
  unit_price_ngn numeric(10,2) not null,
  subtotal_ngn numeric(10,2) not null
);
grant select, insert, update, delete on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;

create policy "order items follow order access" on public.order_items for select to authenticated
  using (exists(select 1 from public.orders o where o.id = order_id and (o.retailer_id = auth.uid() or public.is_admin(auth.uid()))));
create policy "retailer inserts own order items" on public.order_items for insert to authenticated
  with check (exists(select 1 from public.orders o where o.id = order_id and o.retailer_id = auth.uid()));
create policy "admin manages order items" on public.order_items for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============ RETAILER APPLICATIONS ============
create table public.retailer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  business_name text not null,
  owner_name text not null,
  phone text not null,
  email text not null,
  business_address text not null,
  monthly_volume text,
  social_links jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_notes text,
  submitted_at timestamptz not null default now()
);
grant select, insert, update on public.retailer_applications to authenticated;
grant select, insert on public.retailer_applications to anon;
grant all on public.retailer_applications to service_role;
alter table public.retailer_applications enable row level security;

create policy "users read own application" on public.retailer_applications for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "anyone submits application" on public.retailer_applications for insert
  to anon, authenticated with check (true);
create policy "admin updates application" on public.retailer_applications for update to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============ SEED ============
do $$
declare p1 uuid; p2 uuid; p3 uuid;
begin
  insert into public.products (name, description, category, fabric, colors, sizes, moq, images)
  values ('Ankara Wrap Dress', 'A flowing wrap silhouette cut from premium Ankara cotton. Designed to drape elegantly across every figure.',
          'Dresses', '100% Ankara cotton',
          array['Royal Blue','Burnt Orange','Forest Green'],
          array['S','M','L','XL','XXL'], 12, array['/src/assets/product-ankara.jpg'])
  returning id into p1;

  insert into public.pricing_tiers (product_id, min_qty, max_qty, unit_price_ngn) values
    (p1, 12, 23, 8500),
    (p1, 24, 59, 7800),
    (p1, 60, null, 7000);

  insert into public.products (name, description, category, fabric, colors, sizes, moq, images)
  values ('Lace Overlay Blouse', 'Delicate French lace layered over a silk lining. A statement piece of quiet luxury.',
          'Tops', 'French lace + silk lining',
          array['Ivory','Champagne','Black'],
          array['S','M','L','XL'], 24, array['/src/assets/product-lace.jpg'])
  returning id into p2;

  insert into public.pricing_tiers (product_id, min_qty, max_qty, unit_price_ngn) values
    (p2, 24, 47, 5200),
    (p2, 48, 99, 4700),
    (p2, 100, null, 4200);

  insert into public.products (name, description, category, fabric, colors, sizes, moq, images)
  values ('Adire Midi Skirt', 'Hand-dyed Adire cotton in heritage indigo patterns. Each piece is a one-of-one of its kind.',
          'Skirts', 'Hand-dyed Adire cotton',
          array['Indigo','Terracotta','Natural'],
          array['S','M','L','XL','XXL'], 12, array['/src/assets/product-adire.jpg'])
  returning id into p3;

  insert into public.pricing_tiers (product_id, min_qty, max_qty, unit_price_ngn) values
    (p3, 12, 23, 6000),
    (p3, 24, 59, 5500),
    (p3, 60, null, 4800);
end $$;
