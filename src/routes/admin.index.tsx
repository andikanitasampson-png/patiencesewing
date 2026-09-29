import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Package, ShoppingBag, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatNgn } from "@/lib/products";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [
    { title: "Admin overview — Patience Sewing Ltd" },
    { name: "description", content: "Patience Sewing Ltd administrative overview." },
    { property: "og:title", content: "Admin overview — Patience Sewing Ltd" },
    { property: "og:description", content: "Patience Sewing Ltd administrative overview." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AdminOverview,
});

function AdminOverview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
       const [pending, orders, products, retailers, guestOrders] = await Promise.all([
        supabase.from("retailer_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("id, total_ngn, status"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("retailer_status", "approved"),
         supabase.from("orders").select("id", { count: "exact", head: true }).is("retailer_id", null),
      ]);
      const allOrders = orders.data ?? [];
      return {
        pendingApps: pending.count ?? 0,
        orderCount: allOrders.length,
        revenue: allOrders
          .filter((o) => o.status === "paid" || o.status === "shipped" || o.status === "delivered")
          .reduce((sum, o) => sum + Number(o.total_ngn), 0),
        productCount: products.count ?? 0,
        retailerCount: retailers.count ?? 0,
         guestCount: guestOrders.count ?? 0,
      };
    },
  });

  return (
     <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
      <Stat icon={<ClipboardList className="h-4 w-4" />} label="Pending applications" value={data?.pendingApps ?? "—"} href="/admin/applications" />
      <Stat icon={<ShoppingBag className="h-4 w-4" />} label="Orders" value={data?.orderCount ?? "—"} href="/admin/orders" />
      <Stat icon={<Package className="h-4 w-4" />} label="Active revenue" value={data ? formatNgn(data.revenue) : "—"} />
      <Stat icon={<Users className="h-4 w-4" />} label="Approved retailers" value={data?.retailerCount ?? "—"} />
       <Stat icon={<Users className="h-4 w-4" />} label="Guest customers" value={data?.guestCount ?? "—"} href="/admin/orders" />
    </div>
  );
}

function Stat({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string | number; href?: string }) {
  const body = (
    <div className="border border-border bg-secondary/20 p-6 transition-colors hover:bg-secondary/40">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="eyebrow">{label}</p>
      </div>
      <p className="mt-4 font-display text-4xl">{value}</p>
    </div>
  );
  return href ? <Link to={href}>{body}</Link> : body;
}
