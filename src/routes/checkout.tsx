import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { formatNgn, resolveImage } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";
import { createGuestOrder } from "@/lib/guest-checkout.functions";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const isGuest = !user;

  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setBusiness(profile.business_name || "");
      setPhone(profile.phone || "");
      setAddress(profile.business_address || "");
    }
    if (user?.email) setEmail(user.email);
  }, [profile, user]);

  useEffect(() => {
    if (loading) return;
    if (items.length === 0) navigate({ to: "/cart" });
  }, [loading, items.length, navigate]);

  const handlePay = async () => {
    if (!name || !phone || !address || !email) {
      toast.error("Please complete contact and shipping information.");
      return;
    }
    setSubmitting(true);
    try {
      const ref = `PS_STUB_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      if (user) {
        const shipping = `${name}${business ? ` · ${business}` : ""}\n${phone}\n${email}\n${address}`;
        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .insert({
            retailer_id: user.id,
            customer_type: "retailer",
            guest_name: null,
            guest_email: null,
            guest_phone: null,
            total_ngn: subtotal,
            status: "paid",
            shipping_address: shipping,
            notes: notes || null,
            paystack_reference: ref,
            paystack_status: "success",
          })
          .select("id")
          .single();
        if (orderErr || !order) throw orderErr ?? new Error("Order creation failed");

        const rows = items.map((i) => ({
          order_id: order.id,
          product_id: i.productId,
          product_name: i.name,
          color: i.color,
          size: i.size,
          quantity: i.qty,
          unit_price_ngn: i.unitPriceNgn,
          subtotal_ngn: i.qty * i.unitPriceNgn,
        }));
        const { error: itemsErr } = await supabase.from("order_items").insert(rows);
        if (itemsErr) throw itemsErr;

        clear();
        toast.success("Payment confirmed");
        navigate({ to: "/orders/$id", params: { id: order.id } });
      } else {
        await createGuestOrder({
          data: {
            name,
            business: business || null,
            phone,
            email,
            address,
            notes: notes || null,
            paystackReference: ref,
            items: items.map((i) => ({
              productId: i.productId,
              name: i.name,
              color: i.color,
              size: i.size,
              qty: i.qty,
              unitPriceNgn: i.unitPriceNgn,
            })),
          },
        });
        clear();
        toast.success("Order placed", {
          description: `Reference ${ref}. We'll email ${email} with shipping updates.`,
        });
        navigate({ to: "/" });
      }
    } catch (e) {
      console.error(e);
      toast.error("We couldn't complete your order.", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:py-16">
        <Link to="/cart" className="eyebrow text-[0.65rem] hover:text-accent">
          ← Back to cart
        </Link>
        <h1 className="mt-4 text-5xl lg:text-6xl">Checkout</h1>
        {isGuest && (
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Checking out as guest. <Link to="/auth" className="underline hover:text-primary">Sign in</Link> or{" "}
            <Link to="/apply" className="underline hover:text-primary">apply as a retailer</Link> to unlock wholesale pricing.
          </p>
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_420px]">
          <div className="space-y-10">
            <section>
              <p className="eyebrow mb-5">Contact & Shipping</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" value={name} onChange={setName} required />
                <Field label="Business Name" value={business} onChange={setBusiness} />
                <Field label="Phone" value={phone} onChange={setPhone} required />
                <Field label="Email" value={email} onChange={setEmail} required disabled={!!user?.email} />
              </div>
              <div className="mt-4">
                <Field label="Shipping Address" value={address} onChange={setAddress} required textarea />
              </div>
              <div className="mt-4">
                <Field label="Order Notes (optional)" value={notes} onChange={setNotes} textarea />
              </div>
            </section>

            <section>
              <p className="eyebrow mb-5">Payment</p>
              <div className="rounded-sm border border-border bg-secondary/40 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pay with Paystack</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Card · Bank Transfer · USSD — secured by Paystack
                    </p>
                  </div>
                  <span className="rounded-full bg-accent/20 px-3 py-1 text-[0.6rem] uppercase tracking-widest text-accent-foreground">
                    Sandbox
                  </span>
                </div>
              </div>
            </section>
          </div>

          <aside className="self-start border border-border bg-background p-7">
            <p className="eyebrow">Order Summary</p>
            <ul className="mt-5 space-y-4 border-b border-border pb-5">
              {items.map((i) => (
                <li key={`${i.productId}-${i.kind}-${i.color}-${i.size}`} className="flex gap-3">
                  <img
                    src={resolveImage(i.image)}
                    alt={i.name}
                    className="h-16 w-14 flex-none border border-border object-cover"
                  />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.color} · {i.size} · {i.qty} pcs · {i.kind}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-primary">
                    {formatNgn(i.qty * i.unitPriceNgn)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-sm text-foreground/70">Total</span>
              <span className="font-display text-3xl text-primary">{formatNgn(subtotal)}</span>
            </div>
            <button
              onClick={handlePay}
              disabled={submitting}
              className="mt-7 w-full rounded-sm bg-primary px-6 py-4 text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Processing…" : `Pay ${formatNgn(subtotal)}`}
            </button>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  disabled,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  textarea?: boolean;
}) {
  const cls =
    "mt-2 w-full rounded-sm border border-border bg-background px-3 py-3 text-sm focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";
  return (
    <label className="block">
      <span className="eyebrow">
        {label}
        {required && " *"}
      </span>
      {textarea ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={cls} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={cls} />
      )}
    </label>
  );
}
