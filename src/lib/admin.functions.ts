import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const setRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["customer", "retailer", "admin"]),
});

const reviewSchema = z.object({
  applicationId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().max(2000).optional().nullable(),
});

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.role !== "admin") throw new Error("Forbidden");
  return supabaseAdmin;
}

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => setRoleSchema.parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);
    const patch: { role: string; retailer_status?: string } = { role: data.role };
    if (data.role === "retailer") patch.retailer_status = "approved";
    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const reviewRetailerApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => reviewSchema.parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);

    const { data: app, error: appErr } = await supabaseAdmin
      .from("retailer_applications")
      .update({
        status: data.decision,
        admin_notes: data.notes ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
      })
      .eq("id", data.applicationId)
      .select("user_id")
      .maybeSingle();
    if (appErr) throw appErr;
    if (!app) throw new Error("Application not found");

    const profilePatch: { retailer_status: string; role?: string } = {
      retailer_status: data.decision,
    };
    if (data.decision === "approved") profilePatch.role = "retailer";

    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .update(profilePatch)
      .eq("id", app.user_id);
    if (profErr) throw profErr;

    return { ok: true };
  });
