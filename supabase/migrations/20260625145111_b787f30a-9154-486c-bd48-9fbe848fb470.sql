
-- Products: retail price + discount
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS retail_price_ngn numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS compare_at_price_ngn numeric;

-- Seed defaults based on cheapest tier x2 where retail is still 0
UPDATE public.products p
SET retail_price_ngn = sub.min_price * 2
FROM (
  SELECT product_id, MIN(unit_price_ngn) AS min_price
  FROM public.pricing_tiers
  GROUP BY product_id
) sub
WHERE sub.product_id = p.id AND (p.retail_price_ngn IS NULL OR p.retail_price_ngn = 0);

-- Orders: support guest checkout
ALTER TABLE public.orders
  ALTER COLUMN retailer_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS customer_type text NOT NULL DEFAULT 'retailer',
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS guest_phone text;

-- RLS: allow anon guest orders
DROP POLICY IF EXISTS "guest creates own order" ON public.orders;
CREATE POLICY "guest creates own order"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    customer_type = 'guest'
    AND retailer_id IS NULL
    AND guest_email IS NOT NULL
    AND guest_name IS NOT NULL
    AND guest_phone IS NOT NULL
  );

DROP POLICY IF EXISTS "guest inserts own order items" ON public.order_items;
CREATE POLICY "guest inserts own order items"
  ON public.order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.customer_type = 'guest'
        AND o.retailer_id IS NULL
    )
  );

-- Grants for anon to insert
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.order_items TO anon;

-- Admin can read all guest orders (already covered via is_admin in existing SELECT policy);
-- guests cannot read back — order id is returned at insert time.
