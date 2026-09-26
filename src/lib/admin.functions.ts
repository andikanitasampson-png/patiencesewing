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

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => setRoleSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: admin, error: authError } = await context.supabase.from("user_roles").select("id").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (authError || !admin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target, error: targetError } = await supabaseAdmin.from("profiles").select("id, retailer_status").eq("id", data.userId).maybeSingle();
    if (targetError || !target) throw new Error("User not found");
    const { data: targetAdmin, error: roleError } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", data.userId).eq("role", "admin").maybeSingle();
    if (roleError) throw roleError;
    if (targetAdmin && data.role !== "admin") {
      const { count, error: countError } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
      if (countError) throw countError;
      if ((count ?? 0) <= 1) throw new Error("Cannot remove the last admin");
      const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
      if (error) throw error;
    }
    if (data.role === "admin" && !targetAdmin) {
      const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw error;
    }
    if (data.role === "retailer") {
      const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: "retailer" }, { onConflict: "user_id,role" });
      if (error) throw error;
    } else if (data.role === "customer") {
      const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "retailer");
      if (error) throw error;
    }
    if (data.role === "retailer" && target.retailer_status !== "approved") {
      const { error } = await supabaseAdmin.from("profiles").update({ retailer_status: "approved" }).eq("id", data.userId);
      if (error) throw error;
    }
    return { ok: true };
  });

export const reviewRetailerApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => reviewSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: admin, error: authError } = await context.supabase.from("user_roles").select("id").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (authError || !admin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing, error: existingError } = await supabaseAdmin.from("retailer_applications").select("user_id,email,status").eq("id", data.applicationId).maybeSingle();
    if (existingError || !existing) throw new Error("Application not found");
    if (existing.status !== "pending") throw new Error("Application already reviewed");
    let userId = existing.user_id;
    if (!userId) {
      const { data: match, error: matchError } = await supabaseAdmin.from("profiles").select("id").ilike("email", existing.email).maybeSingle();
      if (matchError) throw matchError;
      userId = match?.id ?? null;
    }

    const { data: app, error: appErr } = await supabaseAdmin
      .from("retailer_applications")
      .update({
        status: data.decision,
        admin_notes: data.notes ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
        user_id: userId,
      })
      .eq("id", data.applicationId)
      .eq("status", "pending")
      .select("user_id")
      .maybeSingle();
    if (appErr) throw appErr;
    if (!app) throw new Error("Application already reviewed");
    if (!userId) return { ok: true, accountRequired: true };

    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .update({ retailer_status: data.decision })
      .eq("id", userId);
    if (profErr) throw profErr;
    if (data.decision === "approved") {
      const { error: roleErr } = await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "retailer" }, { onConflict: "user_id,role" });
      if (roleErr) throw roleErr;
    }

    return { ok: true, accountRequired: false };
  });

