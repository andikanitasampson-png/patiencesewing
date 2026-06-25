import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { fetchProduct, formatNgn, resolveImage, tierForQty } from "@/lib/products";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/catalog/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { isApprovedRetailer, user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });

  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(0);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-6 py-32 lg:px-12">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </SiteLayout>
    );
  }
  if (error || !data) throw notFound();

  const product = data;
  const tiers = product.pricing_tiers.map((t) => ({ ...t, unit_price_ngn: Number(t.unit_price_ngn) }));
  const activeTier = isApprovedRetailer && qty >= product.moq ? tierForQty(tiers, qty) : null;
  const subtotal = activeTier ? activeTier.unit_price_ngn * qty : 0;
  const belowMoq = qty > 0 && qty < product.moq;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16">
        <Link to="/catalog" className="eyebrow text-[0.65rem] hover:text-accent">
          ← The Collection
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          {/* Images */}
          <div>
            <div className="aspect-[4/5] overflow-hidden border border-border bg-secondary">
              <img
                src={resolveImage(product.images[0])}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Details */}
          <div className="lg:py-6">
            <p className="eyebrow">{product.category}</p>
            <h1 className="mt-3 text-5xl lg:text-6xl">{product.name}</h1>
            <p className="mt-5 text-sm text-muted-foreground">{product.fabric}</p>
            {product.description && (
              <p className="mt-6 max-w-md leading-relaxed text-foreground/80">{product.description}</p>
            )}

            <div className="my-10 h-px w-full bg-border" />

            {/* Color */}
            <div>
              <p className="eyebrow mb-3">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`rounded-sm border px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
                      color === c
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="mt-8">
              <p className="eyebrow mb-3">Size Run</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`rounded-sm border px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
                      size === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing tiers */}
            <div className="mt-10">
              <p className="eyebrow mb-3">Wholesale Pricing · per piece</p>
              {isApprovedRetailer ? (
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {tiers.map((t) => (
                      <tr
                        key={t.id}
                        className={`border-b border-border ${
                          activeTier?.id === t.id ? "bg-accent/30" : ""
                        }`}
                      >
                        <td className="py-3 text-foreground/80">
                          {t.min_qty}
                          {t.max_qty ? `–${t.max_qty}` : "+"} pcs
                        </td>
                        <td className="py-3 text-right font-medium text-primary">
                          {formatNgn(t.unit_price_ngn)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="rounded-sm border border-dashed border-border p-6 text-center">
                  <Lock className="mx-auto h-5 w-5 text-muted-foreground" />
                  <p className="mt-3 text-sm text-foreground/70">
                    Pricing is shown to approved retailers only.
                  </p>
                  <Link
                    to={user ? "/apply" : "/auth"}
                    className="mt-4 inline-block text-xs font-medium uppercase tracking-[0.18em] text-primary hover:text-accent"
                  >
                    Apply for wholesale access →
                  </Link>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="mt-10">
              <p className="eyebrow mb-3">
                Quantity · Min. {product.moq} pcs
              </p>
              <input
                type="number"
                min={0}
                value={qty || ""}
                onChange={(e) => setQty(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder={`${product.moq}`}
                className={`w-32 rounded-sm border bg-background px-4 py-3 text-base ${
                  belowMoq ? "border-destructive" : "border-border"
                } focus:border-primary focus:outline-none`}
              />
              {belowMoq && (
                <p className="mt-2 text-xs text-destructive">
                  Minimum order is {product.moq} pieces.
                </p>
              )}

              {isApprovedRetailer && activeTier && qty >= product.moq && (
                <div className="mt-5 rounded-sm border border-border bg-secondary/50 p-5">
                  <div className="flex justify-between text-sm text-foreground/70">
                    <span>{qty} pcs × {formatNgn(activeTier.unit_price_ngn)}</span>
                    <span className="text-xs uppercase tracking-widest">Tier {activeTier.min_qty}+</span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Subtotal</span>
                    <span className="font-display text-3xl text-primary">{formatNgn(subtotal)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap gap-3">
              {isApprovedRetailer ? (
                <button
                  disabled={!color || !size || qty < product.moq}
                  onClick={() => toast.success(`${qty} × ${product.name} added to cart`, { description: "Cart coming next — checkout is being wired up." })}
                  className="rounded-sm bg-primary px-7 py-4 text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add to Cart
                </button>
              ) : (
                <Link
                  to={user ? "/apply" : "/auth"}
                  className="rounded-sm bg-primary px-7 py-4 text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  Unlock Wholesale
                </Link>
              )}
              <button
                onClick={() =>
                  toast.success("Quotation request noted", {
                    description: "Our team will reach out within 24 hours.",
                  })
                }
                className="rounded-sm border border-foreground px-7 py-4 text-xs font-medium uppercase tracking-[0.22em] text-foreground hover:bg-foreground hover:text-background"
              >
                Request Quotation
              </button>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
