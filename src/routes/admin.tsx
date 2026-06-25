import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteLayout } from "@/components/site-layout";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const tabs = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/applications", label: "Applications" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/products", label: "Products" },
];

function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isAdmin) navigate({ to: "/dashboard" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-6 py-32 lg:px-12">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16">
        <p className="eyebrow">Atelier Control</p>
        <h1 className="mt-3 text-5xl lg:text-6xl">Admin</h1>

        <nav className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-b border-border pb-4">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.exact }}
              className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/60 hover:text-primary [&.active]:text-primary"
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="mt-10">
          <Outlet />
        </div>
      </div>
    </SiteLayout>
  );
}
