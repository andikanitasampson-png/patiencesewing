import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Clock, CheckCircle2, XCircle, Package } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { formatNgn } from "@/lib/products";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

type OrderSummary = {
  id: string;
  created_at: string;
  status: string;
  total_ngn: number;
  paystack_reference: string | null;
  item_count: number;
};

function DashboardPage() {
  const { user, profile, loading, isApprovedRetailer } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user && isApprovedRetailer,
    queryFn: async (): Promise<OrderSummary[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, status, total_ngn, paystack_reference, order_items(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((o) => ({
        id: o.id,
        created_at: o.created_at,
        status: o.status,
        total_ngn: Number(o.total_ngn),
        paystack_reference: o.paystack_reference,
        item_count: Array.isArray(o.order_items) ? o.order_items.length : 0,
      }));
    },
  });

  if (loading || !user) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-6 py-32 lg:px-12">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </SiteLayout>
    );
  }

  const appStatus = profile?.retailer_status; // 'pending' | 'approved' | 'rejected' | null

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16">
        <p className="eyebrow">Your Account</p>
        <h1 className="mt-3 text-5xl lg:text-6xl">
          {profile?.full_name?.split(" ")[0] || "Welcome"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {profile?.business_name || user.email}
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[340px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-6">
            <ApplicationStatusCard
              status={appStatus}
              isApprovedRetailer={isApprovedRetailer}
            />

            <div className="border border-border bg-secondary/30 p-6">
              <p className="eyebrow mb-4">Profile</p>
              <dl className="space-y-3 text-sm">
                <Row label="Email" value={profile?.email ?? user.email ?? "—"} />
                <Row label="Business" value={profile?.business_name || "—"} />
                <Row label="Phone" value={profile?.phone || "—"} />
                <Row label="Monthly volume" value={profile?.monthly_volume || "—"} />
              </dl>
            </div>
          </aside>

          {/* Orders */}
          <section>
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">Order History</p>
              {isApprovedRetailer && (
                <Link
                  to="/catalog"
                  className="text-xs font-medium uppercase tracking-[0.18em] text-primary hover:text-accent"
                >
                  Shop the collection →
                </Link>
              )}
            </div>

            {!isApprovedRetailer ? (
              <div className="mt-6 rounded-sm border border-dashed border-border p-10 text-center">
                <Package className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-4 text-sm text-foreground/70">
                  Wholesale ordering unlocks once your retailer application is approved.
                </p>
              </div>
            ) : ordersLoading ? (
              <p className="mt-6 text-sm text-muted-foreground">Loading orders…</p>
            ) : !orders || orders.length === 0 ? (
              <div className="mt-6 rounded-sm border border-dashed border-border p-10 text-center">
                <Package className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-4 text-sm text-foreground/70">No orders yet.</p>
                <Link
                  to="/catalog"
                  className="mt-5 inline-block rounded-sm bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  Place your first order
                </Link>
              </div>
            ) : (
              <div className="mt-6 divide-y divide-border border-y border-border">
                {orders.map((o) => (
                  <Link
                    key={o.id}
                    to="/orders/$id"
                    params={{ id: o.id }}
                    className="group flex flex-wrap items-center justify-between gap-4 px-1 py-5 transition-colors hover:bg-secondary/40"
                  >
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {o.paystack_reference ?? o.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-1 font-display text-2xl group-hover:text-accent">
                        {formatNgn(o.total_ngn)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("en-NG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · {o.item_count} {o.item_count === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <StatusPill status={o.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground/90">{value}</dd>
    </div>
  );
}

function ApplicationStatusCard({
  status,
  isApprovedRetailer,
}: {
  status: string | null | undefined;
  isApprovedRetailer: boolean;
}) {
  if (isApprovedRetailer) {
    return (
      <div className="border border-accent/40 bg-accent/10 p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
          <p className="eyebrow">Approved Retailer</p>
        </div>
        <p className="mt-3 text-sm text-foreground/80">
          You have full access to wholesale pricing and ordering.
        </p>
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="border border-border bg-secondary/40 p-6">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <p className="eyebrow">Application Under Review</p>
        </div>
        <p className="mt-3 text-sm text-foreground/80">
          Our wholesale team typically reviews applications within 1–2 business days. We'll
          email you as soon as a decision is made.
        </p>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="border border-destructive/40 bg-destructive/5 p-6">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-destructive" />
          <p className="eyebrow">Application Not Approved</p>
        </div>
        <p className="mt-3 text-sm text-foreground/80">
          If you believe this was in error or your details have changed, please reach out to
          wholesale@patiencesewing.com.
        </p>
      </div>
    );
  }
  return (
    <div className="border border-border bg-secondary/40 p-6">
      <p className="eyebrow">Wholesale Access</p>
      <p className="mt-3 text-sm text-foreground/80">
        Submit a retailer application to unlock tiered wholesale pricing and ordering.
      </p>
      <Link
        to="/apply"
        className="mt-5 inline-block rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground hover:bg-accent hover:text-accent-foreground"
      >
        Apply Now
      </Link>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-accent/20 text-accent-foreground",
    pending: "bg-secondary text-foreground/70",
    processing: "bg-secondary text-foreground/70",
    shipped: "bg-primary/15 text-primary",
    delivered: "bg-accent/20 text-accent-foreground",
    cancelled: "bg-destructive/10 text-destructive",
  };
  const cls = map[status] ?? "bg-secondary text-foreground/70";
  return (
    <span
      className={`rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-widest ${cls}`}
    >
      {status}
    </span>
  );
}
