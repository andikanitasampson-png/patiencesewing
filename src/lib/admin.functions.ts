import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const setRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["customer", "retailer", "admin"]),
});

const reviewSchema = z.object({
  applicationId: z.string().uuid(),
  decision: z.enum(["approved", "rejected", "pending"]),
  notes: z.string().max(2000).optional().nullable(),
});

const idSchema = z.object({ id: z.string().uuid() });

const respondSchema = z.object({
  id: z.string().uuid(),
  response: z.string().max(5000),
  status: z.enum(["new", "responded", "closed"]),
});

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
  return supabaseAdmin;
}

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => setRoleSchema.parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);
    if (data.userId === context.userId && data.role !== "admin") {
      throw new Error("You cannot remove your own admin access.");
    }
    const patch: Record<string, string> = { role: data.role };
    if (data.role === "retailer") patch.retailer_status = "approved";
    const { error } = await supabaseAdmin
      .from("profiles")
      .update(patch as never)
      .eq("id", data.userId);
    if (error) throw error;

    if (data.role === "admin") {
      const { data: existing } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", data.userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!existing) {
        const { error: rErr } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: data.userId, role: "admin" } as never);
        if (rErr) throw rErr;
      }
    } else {
      const { error: dErr } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (dErr) throw dErr;
    }
    return { ok: true };
  });

export const reviewRetailerApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => reviewSchema.parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);
    const isReset = data.decision === "pending";

    const { data: app, error: appErr } = await supabaseAdmin
      .from("retailer_applications")
      .update({
        status: data.decision,
        admin_notes: data.notes ?? null,
        reviewed_at: isReset ? null : new Date().toISOString(),
        reviewed_by: isReset ? null : context.userId,
      } as never)
      .eq("id", data.applicationId)
      .select("user_id")
      .maybeSingle();
    if (appErr) throw appErr;
    if (!app) throw new Error("Application not found");

    if (app.user_id) {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", app.user_id)
        .maybeSingle();
      const profilePatch: Record<string, string> = { retailer_status: data.decision };
      if (prof?.role !== "admin") {
        profilePatch.role = data.decision === "approved" ? "retailer" : "customer";
      }
      const { error: profErr } = await supabaseAdmin
        .from("profiles")
        .update(profilePatch as never)
        .eq("id", app.user_id);
      if (profErr) throw profErr;
    }
    return { ok: true };
  });

export const deleteRetailerApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("retailer_applications").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const respondToQuotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => respondSchema.parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("quotations")
      .update({
        admin_response: data.response || null,
        status: data.status,
        responded_at: new Date().toISOString(),
        responded_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteQuotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("quotations").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
