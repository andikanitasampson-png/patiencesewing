import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  business_name: z.string().min(2).max(200),
  owner_name: z.string().min(2).max(200),
  phone: z.string().min(5).max(50),
  email: z.string().email().max(200),
  business_address: z.string().min(5).max(1000),
  monthly_volume: z.string().max(100).optional().nullable(),
  social_links: z
    .object({
      instagram: z.string().max(200).optional().nullable(),
      whatsapp: z.string().max(200).optional().nullable(),
    })
    .optional()
    .nullable(),
  user_id: z.string().uuid().optional().nullable(),
});

export const submitRetailerApplication = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let userId: string | null = null;
    if (data.user_id) {
      const { data: profile } = await supabaseAdmin.from("profiles").select("id,email").eq("id", data.user_id).maybeSingle();
      if (profile?.email.toLowerCase() === data.email.trim().toLowerCase()) userId = profile.id;
    }
    const { error } = await supabaseAdmin.from("retailer_applications").insert({
      user_id: userId,
      business_name: data.business_name.trim(),
      owner_name: data.owner_name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim().toLowerCase(),
      business_address: data.business_address.trim(),
      monthly_volume: data.monthly_volume ?? null,
      social_links: data.social_links ?? null,
    });
    if (error) throw new Error(error.message);
    if (userId) {
      const { error: profileError } = await supabaseAdmin.from("profiles").update({
        business_name: data.business_name.trim(), phone: data.phone.trim(),
        business_address: data.business_address.trim(), monthly_volume: data.monthly_volume ?? null,
        retailer_status: "pending",
      }).eq("id", userId);
      if (profileError) throw profileError;
    }
    return { ok: true };
  });
