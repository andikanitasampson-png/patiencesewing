import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  id: z.string().uuid(),
  email: z.string().email().max(200),
});

export const getGuestOrder = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error: oErr } = await supabaseAdmin.rpc("get_guest_order", {
      _order_id: data.id,
      _email: data.email,
    });
    if (oErr) throw new Error(oErr.message);
    const row = Array.isArray(order) ? order[0] : order;
    if (!row) return null;
    const { data: items, error: iErr } = await supabaseAdmin.rpc("get_guest_order_items", {
      _order_id: data.id,
      _email: data.email,
    });
    if (iErr) throw new Error(iErr.message);
    return { order: row, items: items ?? [] };
  });
