import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { fetchProducts, formatNgn, resolveImage, startingPrice, discountPct } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/catalog/")({
  head: () => ({
    meta: [
      { title: "Collection — Patience Sewing" },
      {
        name: "description",
        content: "Browse the Patience Sewing wholesale collection. Ankara dresses, lace blouses, Adire skirts.",
      },
      { property: "og:title", content: "Collection — Patience Sewing" },
      { property: "og:description", content: "Wholesale-only African fashion. Minimum 12 pieces." },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const { isApprovedRetailer } = useAuth();

  const productsQ = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const tiersQ = useQuery({
    queryKey: ["all-tiers", isApprovedRetailer],
    enabled: isApprovedRetailer,
    queryFn: async () => {
      const { data, error } = await supabase.from("pricing_tiers").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [category, setCategory] = useState<string>("All");
  const [color, setColor] = useState<string>("All");
  const [fabric, setFabric] = useState<string>("All");
  const [moqMax, setMoqMax] = useState<number>(100);

  const products = productsQ.data ?? [];

  const { categories, colors, fabrics } = useMemo(() => {
    const c = new Set<string>(), co = new Set<string>(), f = new Set<string>();
    for (const p of products) {
      c.add(p.category);
      p.colors.forEach((x) => co.add(x));
      if (p.fabric) f.add(p.fabric);
    }
    return {
      categories: ["All", ...Array.from(c)],
      colors: ["All", ...Array.from(co)],
      fabrics: ["All", ...Array.from(f)],
    };
  }, [products]);

  const filtered = products.filter((p) => {
    if (category !== "All" && p.category !== category) return false;
    if (color !== "All" && !p.colors.includes(color)) return false;
    if (fabric !== "All" && p.fabric !== fabric) return false;
    if (p.moq > moqMax) return false;
    return true;
  });

  return (
    <SiteLayout>
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12 lg:py-20">
          <p className="eyebrow">Wholesale Collection</p>
          <h1 className="mt-4">The Collection</h1>
          <p className="mt-4 max-w-xl text-foreground/70">
            Every piece, designed for ready-to-stock retailers. {filtered.length} pieces available.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[240px_1fr] lg:px-12">
        {/* Filters */}
        <aside className="space-y-10 lg:sticky lg:top-28 lg:self-start">
          <Filter label="Category" options={categories} value={category} onChange={setCategory} />
          <Filter label="Color" options={colors} value={color} onChange={setColor} />
          <Filter label="Fabric" options={fabrics} value={fabric} onChange={setFabric} />
          <div>
            <p className="eyebrow mb-4">Max MOQ — {moqMax} pcs</p>
            <input
              type="range"
              min={12}
              max={100}
              step={12}
              value={moqMax}
              onChange={(e) => setMoqMax(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </aside>

        {/* Grid */}
        <div>
          {productsQ.isLoading && <p className="text-sm text-muted-foreground">Loading collection…</p>}
          {productsQ.error && <p className="text-sm text-destructive">Could not load products.</p>}

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const tiers = (tiersQ.data ?? []).filter((t: any) => t.product_id === p.id);
              const fromPrice = isApprovedRetailer
                ? startingPrice(tiers.map((t: any) => ({ ...t, unit_price_ngn: Number(t.unit_price_ngn) })))
                : null;

              return (
                <Link
                  key={p.id}
                  to="/catalog/$id"
                  params={{ id: p.id }}
                  className="group block"
                >
                  <div className="relative aspect-[4/5] overflow-hidden border border-border bg-secondary">
                    <img
                      src={resolveImage(p.images[0])}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-sm bg-background/90 px-2 py-1 text-[0.6rem] uppercase tracking-widest text-foreground">
                      Min. {p.moq} pcs
                    </span>
                  </div>
                  <div className="mt-5">
                    <p className="eyebrow text-[0.6rem]">{p.category}</p>
                    <h3 className="mt-1 text-xl">{p.name}</h3>
                    <p className="mt-2 text-xs text-muted-foreground">{p.fabric}</p>

                    {isApprovedRetailer && fromPrice ? (
                      <p className="mt-3 text-sm font-medium text-primary">
                        From {formatNgn(fromPrice)} / piece
                      </p>
                    ) : (
                      <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" /> Sign in to see wholesale pricing
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {!productsQ.isLoading && filtered.length === 0 && (
            <p className="py-20 text-center text-sm text-muted-foreground">
              No pieces match your filters.
            </p>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

function Filter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="eyebrow mb-4">{label}</p>
      <ul className="space-y-2">
        {options.map((opt) => (
          <li key={opt}>
            <button
              onClick={() => onChange(opt)}
              className={`text-sm transition-colors ${
                value === opt
                  ? "text-primary font-medium"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
