import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deleteQuotation, respondToQuotation } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/quotations")({
  head: () => ({
    meta: [
      { title: "Quotations · Admin · Patience Sewing Ltd" },
      { name: "description", content: "Review and respond to customer quotation requests." },
    ],
  }),
  component: AdminQuotations,
});

type Q = {
  id: string;
  product_name: string | null;
  name: string;
  email: string;
  phone: string | null;
  quantity: number | null;
  message: string;
  status: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
};

type Status = "new" | "responded" | "closed";

function AdminQuotations() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status | "all">("new");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-quotations", filter],
    queryFn: async (): Promise<Q[]> => {
      let q = supabase.from("quotations").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data as Q[]) ?? [];
    },
  });

  const respond = useMutation({
    mutationFn: (v: { id: string; response: string; status: Status }) => respondToQuotation({ data: v }),
    onSuccess: () => {
      toast.success("Quotation updated");
      qc.invalidateQueries({ queryKey: ["admin-quotations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteQuotation({ data: { id } }),
    onSuccess: () => {
      toast.success("Quotation deleted");
      qc.invalidateQueries({ queryKey: ["admin-quotations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(["new", "responded", "closed", "all"] as const).map((f) => (
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
        ) : !data || data.length === 0 ? (
          <p className="rounded-sm border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No quotation requests.
          </p>
        ) : (
          data.map((q) => (
            <QuoteCard
              key={q.id}
              q={q}
              busy={respond.isPending || remove.isPending}
              onRespond={respond.mutate}
              onDelete={remove.mutate}
            />
          ))
        )}
      </div>
    </div>
  );
}

function QuoteCard({
  q,
  busy,
  onRespond,
  onDelete,
}: {
  q: Q;
  busy: boolean;
  onRespond: (v: { id: string; response: string; status: Status }) => void;
  onDelete: (id: string) => void;
}) {
  const [response, setResponse] = useState(q.admin_response ?? "");
  const mailto = `mailto:${q.email}?subject=${encodeURIComponent(
    `Your quotation request${q.product_name ? ` — ${q.product_name}` : ""} · Patience Sewing Ltd`,
  )}&body=${encodeURIComponent(response)}`;

  return (
    <article className="border border-border bg-background p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-2xl">{q.product_name || "General enquiry"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {q.name} · <a href={`mailto:${q.email}`} className="underline">{q.email}</a>
            {q.phone ? ` · ${q.phone}` : ""}
            {q.quantity ? ` · ${q.quantity} pcs` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(q.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <span className="rounded-sm border border-border px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.18em]">
          {q.status}
        </span>
      </header>
      <p className="mt-4 whitespace-pre-wrap text-sm">{q.message}</p>
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows={3}
        placeholder="Your response / quoted price…"
        className="mt-5 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          disabled={busy}
          onClick={() => onRespond({ id: q.id, response, status: "responded" })}
          className="rounded-sm bg-primary px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground hover:bg-accent disabled:opacity-50"
        >
          Save response
        </button>
        <a
          href={mailto}
          onClick={() => onRespond({ id: q.id, response, status: "responded" })}
          className="rounded-sm border border-border px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] hover:border-primary"
        >
          Email customer
        </a>
        <button
          disabled={busy}
          onClick={() => onRespond({ id: q.id, response, status: "closed" })}
          className="rounded-sm border border-border px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] hover:border-primary disabled:opacity-50"
        >
          Close
        </button>
        <button
          disabled={busy}
          onClick={() => confirm("Delete this quotation?") && onDelete(q.id)}
          className="rounded-sm border border-border px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] hover:border-destructive hover:text-destructive disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
