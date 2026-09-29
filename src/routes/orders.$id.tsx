import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { supabase } from "@/integrations/supabase/client";
import { formatNgn } from "@/lib/products";

export const Route = createFileRoute("/orders/$id")({
  component: OrderPage,
});

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  total_ngn: number;
  shipping_address: string | null;
  notes: string | null;
  paystack_reference: string | null;
  paystack_status: string | null;
};

type OrderItemRow = {
  id: string;
  product_name: string;
  color: string | null;
  size: string | null;
  quantity: number;
  unit_price_ngn: number;
  subtotal_ngn: number;
};

function OrderPage() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .select("id, created_at, status, total_ngn, shipping_address, notes, paystack_reference, paystack_status")
        .eq("id", id)
        .maybeSingle();
      if (oErr) throw oErr;
      if (!order) return null;
      const { data: items, error: iErr } = await supabase
        .from("order_items")
        .select("id, product_name, color, size, quantity, unit_price_ngn, subtotal_ngn")
        .eq("order_id", id);
      if (iErr) throw iErr;
      return { order: order as OrderRow, items: (items ?? []) as OrderItemRow[] };
    },
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-6 py-32 lg:px-12">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </SiteLayout>
    );
  }
  if (error || !data) throw notFound();
  const { order, items } = data;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-16 lg:px-12 lg:py-24">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
          <p className="eyebrow mt-6">Order Confirmed</p>
          <h1 className="mt-3 text-5xl">Thank you</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Your wholesale order has been received. A confirmation invoice will follow by email
            within the next business day.
          </p>
        </div>

        <div className="mt-12 border border-border bg-secondary/30 p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="eyebrow">Order Reference</p>
              <p className="mt-1 font-mono text-sm">
                {order.paystack_reference ?? order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <span className="rounded-full bg-accent/20 px-3 py-1 text-[0.65rem] uppercase tracking-widest text-accent-foreground">
              {order.status}
            </span>
          </div>

          <ul className="mt-5 space-y-3">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">{i.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.color} · {i.size} · {i.quantity} × {formatNgn(Number(i.unit_price_ngn))}
                  </p>
                </div>
                <p className="font-medium text-primary">
                  {formatNgn(Number(i.subtotal_ngn))}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-baseline justify-between border-t border-border pt-5">
            <span className="text-sm text-foreground/70">Total Paid</span>
            <span className="font-display text-3xl text-primary">
              {formatNgn(Number(order.total_ngn))}
            </span>
          </div>

          {order.shipping_address && (
            <div className="mt-6 border-t border-border pt-5">
              <p className="eyebrow mb-2">Ship To</p>
              <p className="whitespace-pre-line text-sm text-foreground/80">
                {order.shipping_address}
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/catalog"
            className="rounded-sm bg-primary px-7 py-4 text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
