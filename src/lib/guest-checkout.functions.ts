import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string().uuid().nullable(),
  name: z.string().min(1).max(200),
  color: z.string().max(100).nullable(),
  size: z.string().max(50).nullable(),
  qty: z.number().int().positive().max(10000),
  unitPriceNgn: z.number().int().nonnegative(),
});

const inputSchema = z.object({
  name: z.string().min(1).max(200),
  business: z.string().max(200).optional().nullable(),
  phone: z.string().min(5).max(50),
  email: z.string().email().max(200),
  address: z.string().min(5).max(1000),
  notes: z.string().max(2000).optional().nullable(),
  paystackReference: z.string().min(1).max(200),
  items: z.array(itemSchema).min(1).max(100),
});

export const createGuestOrder = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Re-price items server-side from products + pricing_tiers to prevent tampering
    const productIds = Array.from(
      new Set(data.items.map((i) => i.productId).filter((v): v is string => !!v))
    );
    if (productIds.length !== data.items.length) {
      throw new Error("Invalid items");
    }

    const { data: products, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, name, retail_price_ngn, is_active")
      .in("id", productIds);
    if (prodErr) throw prodErr;
    const priceMap = new Map(products?.map((p) => [p.id, p]) ?? []);

    let total = 0;
    const repriced = data.items.map((i) => {
      const p = i.productId ? priceMap.get(i.productId) : null;
      if (!p || !p.is_active) throw new Error("Unavailable product");
      const unit = Number(p.retail_price_ngn);
      const subtotal = unit * i.qty;
      total += subtotal;
      return {
        product_id: p.id,
        product_name: p.name,
        color: i.color,
        size: i.size,
        quantity: i.qty,
        unit_price_ngn: unit,
        subtotal_ngn: subtotal,
      };
    });

    const shipping = `${data.name}${data.business ? ` · ${data.business}` : ""}\n${data.phone}\n${data.email}\n${data.address}`;

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        retailer_id: null,
        customer_type: "guest",
        guest_name: data.name,
        guest_email: data.email,
        guest_phone: data.phone,
        total_ngn: total,
        status: "paid",
        shipping_address: shipping,
        notes: data.notes || null,
        paystack_reference: data.paystackReference,
        paystack_status: "success",
      })
      .select("id")
      .single();
    if (orderErr || !order) throw orderErr ?? new Error("Order creation failed");

    const rows = repriced.map((r) => ({ ...r, order_id: order.id }));
    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(rows);
    if (itemsErr) throw itemsErr;

    return { orderId: order.id, total };
  });
