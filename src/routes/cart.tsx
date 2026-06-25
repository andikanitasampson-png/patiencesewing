import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { useCart, lineKey } from "@/lib/cart-context";
import { fetchProduct, formatNgn, tierForQty, resolveImage } from "@/lib/products";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { items, updateQty, removeItem, subtotal } = useCart();
  const { isApprovedRetailer, user } = useAuth();
  const navigate = useNavigate();

  const uniqueIds = Array.from(new Set(items.map((i) => i.productId)));
  const productQueries = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: ["product", id],
      queryFn: () => fetchProduct(id),
    })),
  });
  const productMap = new Map(
    productQueries.map((q, idx) => [uniqueIds[idx], q.data] as const),
  );

  // Recompute wholesale unit prices live from tiers when qty changes; retail stays fixed.
  useEffect(() => {
    for (const item of items) {
      if (item.kind !== "wholesale") continue;
      const product = productMap.get(item.productId);
      if (!product) continue;
      const tiers = product.pricing_tiers.map((t) => ({
        ...t,
        unit_price_ngn: Number(t.unit_price_ngn),
      }));
      const tier = tierForQty(tiers, item.qty);
      if (tier && tier.unit_price_ngn !== item.unitPriceNgn) {
        updateQty(lineKey(item), item.qty, tier.unit_price_ngn);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => `${i.productId}-${i.kind}-${i.qty}`).join("|"), productQueries.every((q) => q.data)]);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16">
        <p className="eyebrow">Your Selection</p>
        <h1 className="mt-3 text-5xl lg:text-6xl">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="mt-16 max-w-md">
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <Link
              to="/catalog"
              className="mt-6 inline-block rounded-sm bg-primary px-7 py-4 text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Browse the Collection
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_400px]">
            <div className="space-y-6">
              {items.map((item) => {
                const product = productMap.get(item.productId);
                const moq = product?.moq ?? item.moq;
                const belowMoq = item.qty < moq;
                const key = lineKey(item);
                return (
                  <div
                    key={key}
                    className="grid grid-cols-[120px_1fr] gap-5 border-b border-border pb-6"
                  >
                    <div className="aspect-[4/5] overflow-hidden border border-border bg-secondary">
                      <img
                        src={resolveImage(item.image)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            to="/catalog/$id"
                            params={{ id: item.productId }}
                            className="font-display text-2xl hover:text-accent"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                            {item.color} · Size {item.size}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(key)}
                          aria-label="Remove"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <label className="eyebrow mb-2 block">Qty · Min {moq}</label>
                          <input
                            type="number"
                            min={0}
                            value={item.qty}
                            onChange={(e) =>
                              updateQty(key, Math.max(0, parseInt(e.target.value) || 0))
                            }
                            className={`w-24 rounded-sm border bg-background px-3 py-2 text-sm ${
                              belowMoq ? "border-destructive" : "border-border"
                            } focus:border-primary focus:outline-none`}
                          />
                          {belowMoq && (
                            <p className="mt-1 text-xs text-destructive">Below MOQ ({moq})</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-widest text-muted-foreground">
                            {item.qty} × {formatNgn(item.unitPriceNgn)}
                          </p>
                          <p className="mt-1 font-display text-2xl text-primary">
                            {formatNgn(item.qty * item.unitPriceNgn)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="self-start border border-border bg-secondary/40 p-7">
              <p className="eyebrow">Order Summary</p>
              <div className="mt-5 flex items-baseline justify-between border-b border-border pb-5">
                <span className="text-sm text-foreground/70">Subtotal</span>
                <span className="font-display text-3xl text-primary">{formatNgn(subtotal)}</span>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Shipping and any applicable duties are calculated at checkout. Bank-verified
                wholesale invoicing on order confirmation.
              </p>
              {!isApprovedRetailer ? (
                <Link
                  to={user ? "/apply" : "/auth"}
                  className="mt-6 block rounded-sm border border-foreground px-6 py-4 text-center text-xs font-medium uppercase tracking-[0.22em] text-foreground hover:bg-foreground hover:text-background"
                >
                  Unlock wholesale to checkout
                </Link>
              ) : (
                <button
                  onClick={() => navigate({ to: "/checkout" })}
                  disabled={items.some((i) => i.qty < (productMap.get(i.productId)?.moq ?? i.moq))}
                  className="mt-6 w-full rounded-sm bg-primary px-6 py-4 text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Proceed to Checkout
                </button>
              )}
            </aside>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
