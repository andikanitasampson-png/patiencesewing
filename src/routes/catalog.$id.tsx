import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { fetchProduct, formatNgn, resolveImage, tierForQty, discountPct } from "@/lib/products";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { submitQuotation } from "@/lib/quotations.functions";

function QuoteForm({
  productId,
  productName,
  defaultQty,
  defaultEmail,
  userId,
  onDone,
}: {
  productId: string;
  productName: string;
  defaultQty?: number;
  defaultEmail: string;
  userId: string | null;
  onDone: () => void;
}) {
  const [f, setF] = useState({
    name: "",
    email: defaultEmail,
    phone: "",
    quantity: defaultQty ? String(defaultQty) : "",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const cls =
    "mt-1 w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await submitQuotation({
        data: {
          productId,
          productName,
          name: f.name,
          email: f.email,
          phone: f.phone || null,
          quantity: f.quantity ? parseInt(f.quantity) : null,
          message: f.message,
          userId,
        },
      });
      toast.success("Quotation request sent", { description: "Our team will reach out within 24 hours." });
      onDone();
    } catch {
      toast.error("Please check your details and try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="mt-6 space-y-3 rounded-sm border border-border bg-secondary/40 p-5">
      <p className="eyebrow">Request a quotation</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs">Name *<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={cls} /></label>
        <label className="text-xs">Email *<input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={cls} /></label>
        <label className="text-xs">Phone<input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={cls} /></label>
        <label className="text-xs">Quantity<input type="number" min={1} value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} className={cls} /></label>
      </div>
      <label className="block text-xs">Message *<textarea required minLength={5} rows={3} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} className={cls} placeholder="Tell us what you need — sizes, colors, delivery date…" /></label>
      <button disabled={busy} className="rounded-sm bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground hover:bg-accent disabled:opacity-50">
        {busy ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}

export const Route = createFileRoute("/catalog/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { isApprovedRetailer, user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });

  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [mode, setMode] = useState<"retail" | "wholesale">("retail");
  const [quoteOpen, setQuoteOpen] = useState(false);

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
  const retailPrice = Number(product.retail_price_ngn ?? 0);
  const compareAt = Number(product.compare_at_price_ngn ?? 0);
  const pct = discountPct(product);

  const isWholesale = mode === "wholesale" && isApprovedRetailer;
  const activeTier = isWholesale && qty >= product.moq ? tierForQty(tiers, qty) : null;
  const unitPrice = isWholesale ? activeTier?.unit_price_ngn ?? 0 : retailPrice;
  const minQty = isWholesale ? product.moq : 1;
  const belowMoq = isWholesale && qty > 0 && qty < product.moq;
  const subtotal = unitPrice * qty;

  const needsColor = product.colors.length > 0;
  const needsSize = product.sizes.length > 0;
  const canAdd =
    (!needsColor || !!color) &&
    (!needsSize || !!size) &&
    qty >= minQty &&
    (isWholesale ? !!activeTier : retailPrice > 0);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16">
        <Link to="/catalog" className="eyebrow text-[0.65rem] hover:text-accent">
          ← The Collection
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          <div>
            <div className="aspect-[4/5] overflow-hidden border border-border bg-secondary">
              <img
                src={resolveImage(product.images[0])}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="lg:py-6">
            <p className="eyebrow">{product.category}</p>
            <h1 className="mt-3 text-5xl lg:text-6xl">{product.name}</h1>
            <p className="mt-5 text-sm text-muted-foreground">{product.fabric}</p>

            {/* Retail price banner — always visible */}
            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-4xl text-primary">{formatNgn(retailPrice)}</span>
              {compareAt > retailPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{formatNgn(compareAt)}</span>
                  {pct && (
                    <span className="rounded-sm bg-destructive px-2 py-1 text-[0.65rem] font-medium uppercase tracking-widest text-destructive-foreground">
                      −{pct}%
                    </span>
                  )}
                </>
              )}
            </div>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">per piece · retail</p>

            {product.description && (
              <p className="mt-6 max-w-md leading-relaxed text-foreground/80">{product.description}</p>
            )}

            <div className="my-10 h-px w-full bg-border" />

            {/* Mode toggle */}
            {isApprovedRetailer && (
              <div className="mb-8 inline-flex rounded-sm border border-border p-1">
                {(["retail", "wholesale"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setQty(0); }}
                    className={`rounded-sm px-4 py-2 text-[0.65rem] uppercase tracking-widest transition-colors ${
                      mode === m ? "bg-primary text-primary-foreground" : "text-foreground/60"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

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
              <p className="eyebrow mb-3">Size</p>
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

            {/* Wholesale tiers (only for retailers in wholesale mode) */}
            {isWholesale && (
              <div className="mt-10">
                <p className="eyebrow mb-3">Wholesale Pricing · per piece</p>
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {tiers.map((t) => (
                      <tr key={t.id} className={`border-b border-border ${activeTier?.id === t.id ? "bg-accent/30" : ""}`}>
                        <td className="py-3 text-foreground/80">
                          {t.min_qty}{t.max_qty ? `–${t.max_qty}` : "+"} pcs
                        </td>
                        <td className="py-3 text-right font-medium text-primary">{formatNgn(t.unit_price_ngn)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Locked wholesale teaser for guests/non-retailers */}
            {!isApprovedRetailer && (
              <div className="mt-10 rounded-sm border border-dashed border-border p-5">
                <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" /> Buying 12+ pieces? Unlock wholesale pricing.
                </p>
                <Link
                  to={user ? "/apply" : "/auth"}
                  className="mt-3 inline-block text-xs font-medium uppercase tracking-[0.18em] text-primary hover:text-accent"
                >
                  Apply for wholesale access →
                </Link>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-10">
              <p className="eyebrow mb-3">
                Quantity {isWholesale ? `· Min. ${product.moq} pcs` : ""}
              </p>
              <input
                type="number"
                min={0}
                value={qty || ""}
                onChange={(e) => setQty(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder={`${minQty}`}
                className={`w-32 rounded-sm border bg-background px-4 py-3 text-base ${
                  belowMoq ? "border-destructive" : "border-border"
                } focus:border-primary focus:outline-none`}
              />
              {belowMoq && (
                <p className="mt-2 text-xs text-destructive">Minimum wholesale order is {product.moq} pieces.</p>
              )}

              {qty > 0 && unitPrice > 0 && (
                <div className="mt-5 rounded-sm border border-border bg-secondary/50 p-5">
                  <div className="flex justify-between text-sm text-foreground/70">
                    <span>{qty} pcs × {formatNgn(unitPrice)}</span>
                    {isWholesale && activeTier && (
                      <span className="text-xs uppercase tracking-widest">Tier {activeTier.min_qty}+</span>
                    )}
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
              <button
                disabled={!canAdd}
                onClick={() => {
                  if (!canAdd) return;
                  addItem({
                    productId: product.id,
                    name: product.name,
                    image: product.images[0] ?? "",
                    color: color ?? "Default",
                    size: size ?? "One size",
                    qty,
                    unitPriceNgn: unitPrice,
                    moq: product.moq,
                    kind: isWholesale ? "wholesale" : "retail",
                  });
                  toast.success(`${qty} × ${product.name} added to cart`, {
                    action: { label: "View cart", onClick: () => navigate({ to: "/cart" }) },
                  });
                }}
                className="rounded-sm bg-primary px-7 py-4 text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add to Cart
              </button>
              <button
                onClick={() => setQuoteOpen((v) => !v)}
                className="rounded-sm border border-foreground px-7 py-4 text-xs font-medium uppercase tracking-[0.22em] text-foreground hover:bg-foreground hover:text-background"
              >
                Request Quotation
              </button>
            </div>
            {!canAdd && (
              <p className="mt-3 text-xs text-muted-foreground">
                {needsColor && !color ? "Choose a color. " : ""}
                {needsSize && !size ? "Choose a size. " : ""}
                {qty < minQty ? `Enter a quantity of at least ${minQty}.` : ""}
              </p>
            )}
            {quoteOpen && (
              <QuoteForm
                productId={product.id}
                productName={product.name}
                defaultQty={qty || undefined}
                defaultEmail={user?.email ?? ""}
                userId={user?.id ?? null}
                onDone={() => setQuoteOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
