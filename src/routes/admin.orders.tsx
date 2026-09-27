import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatNgn } from "@/lib/products";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

type Row = {
  id: string;
  created_at: string;
  status: string;
  total_ngn: number;
  paystack_reference: string | null;
  retailer_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  shipping_address: string | null;
  retailer: { full_name: string | null; business_name: string | null; email: string } | null;
  item_count: number;
};

function AdminOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status | "all">("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: async (): Promise<Row[]> => {
      let q = supabase
        .from("orders")
        .select("id, created_at, status, total_ngn, paystack_reference, retailer_id, guest_name, guest_email, guest_phone, shipping_address, profiles!orders_retailer_id_fkey(full_name, business_name, email), order_items(id)")
        .order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((o: any) => ({
        id: o.id,
        created_at: o.created_at,
        status: o.status,
        total_ngn: Number(o.total_ngn),
        paystack_reference: o.paystack_reference,
        retailer_id: o.retailer_id,
        guest_name: o.guest_name,
        guest_email: o.guest_email,
        guest_phone: o.guest_phone,
        shipping_address: o.shipping_address,
        retailer: o.profiles ?? null,
        item_count: Array.isArray(o.order_items) ? o.order_items.length : 0,
      }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {(["all", ...STATUSES] as const).map((f) => (
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

      <div className="mt-8 overflow-x-auto border border-border">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-secondary/40 text-left">
            <tr>
              <Th>Reference</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th>Total</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>{""}</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : !orders || orders.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No orders.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <Td>
                    <Link to="/orders/$id" params={{ id: o.id }} className="font-mono text-xs hover:text-primary">
                      {o.paystack_reference ?? o.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </Td>
                  <Td>
                     <div className="font-medium">{o.retailer?.business_name || o.retailer?.full_name || o.guest_name || "—"}</div>
                     <div className="text-xs text-muted-foreground">{o.retailer?.email || o.guest_email}</div>
                     {o.guest_phone && <div className="text-xs text-muted-foreground">{o.guest_phone}</div>}
                     {o.shipping_address && <div className="max-w-56 whitespace-pre-line text-xs text-muted-foreground">{o.shipping_address}</div>}
                  </Td>
                  <Td>{o.item_count}</Td>
                  <Td className="font-display">{formatNgn(o.total_ngn)}</Td>
                  <Td className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                  </Td>
                  <Td>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value as Status })}
                      className="rounded-sm border border-border bg-background px-2 py-1.5 text-xs uppercase tracking-wider focus:border-primary focus:outline-none"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Td>
                  <Td>
                    <Link to="/orders/$id" params={{ id: o.id }} className="text-xs uppercase tracking-[0.18em] text-primary hover:text-accent">
                      View →
                    </Link>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-4 align-top ${className}`}>{children}</td>;
}
