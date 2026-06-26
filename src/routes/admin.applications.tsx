import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { reviewRetailerApplication } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/applications")({
  component: AdminApplications,
});

type App = {
  id: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string | null;
  business_address: string | null;
  monthly_volume: string | null;
  status: string;
  admin_notes: string | null;
  submitted_at: string;
  social_links: Record<string, string> | null;
};

function AdminApplications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const { data: apps, isLoading } = useQuery({
    queryKey: ["admin-applications", filter],
    queryFn: async (): Promise<App[]> => {
      let q = supabase.from("retailer_applications").select("*").order("submitted_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data as App[]) ?? [];
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, decision, notes }: { id: string; decision: "approved" | "rejected"; notes?: string }) => {
      const { error } = await supabase.rpc("review_retailer_application", {
        _application_id: id,
        _decision: decision,
        _notes: notes,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.decision === "approved" ? "Retailer approved" : "Application rejected");
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-sm border px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] ${
              filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground/70 hover:border-primary"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !apps || apps.length === 0 ? (
          <p className="rounded-sm border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No applications.
          </p>
        ) : (
          apps.map((a) => <AppCard key={a.id} app={a} onReview={review.mutate} pending={review.isPending} />)
        )}
      </div>
    </div>
  );
}

function AppCard({
  app,
  onReview,
  pending,
}: {
  app: App;
  onReview: (v: { id: string; decision: "approved" | "rejected"; notes?: string }) => void;
  pending: boolean;
}) {
  const [notes, setNotes] = useState(app.admin_notes ?? "");

  return (
    <article className="border border-border bg-background p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-2xl">{app.business_name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {app.owner_name} · {app.email}
            {app.phone ? ` · ${app.phone}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted {new Date(app.submitted_at).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
        <StatusPill status={app.status} />
      </header>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <Field label="Monthly volume" value={app.monthly_volume || "—"} />
        <Field label="Address" value={app.business_address || "—"} />
        {app.social_links && Object.keys(app.social_links).length > 0 && (
          <Field
            label="Social"
            value={Object.entries(app.social_links)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" · ")}
          />
        )}
      </dl>

      {app.status === "pending" && (
        <div className="mt-6 space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <div className="flex gap-3">
            <button
              disabled={pending}
              onClick={() => onReview({ id: app.id, decision: "approved", notes })}
              className="rounded-sm bg-primary px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground hover:bg-accent disabled:opacity-50"
            >
              Approve
            </button>
            <button
              disabled={pending}
              onClick={() => onReview({ id: app.id, decision: "rejected", notes })}
              className="rounded-sm border border-border px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] hover:border-destructive hover:text-destructive disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {app.status !== "pending" && app.admin_notes && (
        <p className="mt-4 text-xs text-muted-foreground">Note: {app.admin_notes}</p>
      )}
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    pending: { icon: <Clock className="h-3 w-3" />, cls: "border-border text-muted-foreground" },
    approved: { icon: <CheckCircle2 className="h-3 w-3" />, cls: "border-accent/50 bg-accent/10 text-accent-foreground" },
    rejected: { icon: <XCircle className="h-3 w-3" />, cls: "border-destructive/50 text-destructive" },
  };
  const m = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.18em] ${m.cls}`}>
      {m.icon}
      {status}
    </span>
  );
}
