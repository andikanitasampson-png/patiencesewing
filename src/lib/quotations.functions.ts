import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  productId: z.string().uuid().optional().nullable(),
  productName: z.string().max(300).optional().nullable(),
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(50).optional().nullable(),
  quantity: z.number().int().min(1).max(1000000).optional().nullable(),
  message: z.string().trim().min(5).max(5000),
  userId: z.string().uuid().optional().nullable(),
});

export const submitQuotation = createServerFn({ method: "POST" })
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("quotations").insert({
      product_id: data.productId ?? null,
      product_name: data.productName ?? null,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      quantity: data.quantity ?? null,
      message: data.message,
      user_id: data.userId ?? null,
    });
    if (error) throw new Error("Could not submit your request. Please try again.");
    return { ok: true };
  });
