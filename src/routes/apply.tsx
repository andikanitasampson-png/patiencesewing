import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { useAuth } from "@/lib/auth-context";
import { submitRetailerApplication } from "@/lib/applications.functions";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
       { title: "Become a Retailer — Patience Sewing Ltd" },
      { name: "description", content: "Apply for wholesale access. Approval within 48 hours." },
       { property: "og:title", content: "Become a Retailer — Patience Sewing Ltd" },
      { property: "og:description", content: "Apply for wholesale access. Approval within 48 hours." },
       { property: "og:type", content: "website" },
       { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApplyPage,
});

const schema = z.object({
  business_name: z.string().trim().min(2, "Business name is required").max(120),
  owner_name: z.string().trim().min(2, "Owner name is required").max(120),
  phone: z.string().trim().min(7, "Phone is required").max(40),
  email: z.string().trim().email("Valid email required").max(200),
  business_address: z.string().trim().min(5, "Business address is required").max(400),
  monthly_volume: z.string().min(1, "Please select volume"),
  instagram: z.string().trim().max(80).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(40).optional().or(z.literal("")),
});

const volumes = [
  "Under ₦500k",
  "₦500k – ₦2M",
  "₦2M – ₦10M",
  "Above ₦10M",
];

function ApplyPage() {
  const { user, profile } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    owner_name: "",
    phone: "",
    email: "",
    business_address: "",
    monthly_volume: "",
    instagram: "",
    whatsapp: "",
  });

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        email: f.email || user.email || "",
        owner_name: f.owner_name || profile?.full_name || "",
      }));
    }
  }, [user, profile]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      await submitRetailerApplication({
        data: {
          user_id: user?.id ?? null,
          business_name: form.business_name.trim(),
          owner_name: form.owner_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          business_address: form.business_address.trim(),
          monthly_volume: form.monthly_volume,
          social_links: {
            instagram: form.instagram.trim() || null,
            whatsapp: form.whatsapp.trim() || null,
          },
        },
      });
    } catch (err) {
      setBusy(false);
      toast.error("Could not submit application", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      return;
    }
    setBusy(false);

    setSubmitted(true);
    toast.success("Application received");
  };

  if (submitted) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-6 py-32 text-center lg:px-12">
          <p className="eyebrow">Thank you</p>
          <h1 className="mt-6">Application received.</h1>
          <p className="mt-6 text-base text-foreground/75">
            We review every application personally — typically within 48 hours.
            You'll hear from us at <span className="text-primary">{form.email}</span>.
          </p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-16 lg:grid-cols-[1fr_1.4fr] lg:px-12 lg:py-24">
        <div>
          <p className="eyebrow">Wholesale Access</p>
           <h1 className="mt-4">Become a Patience Sewing Ltd retailer.</h1>
          <p className="mt-6 text-base leading-relaxed text-foreground/75">
            Approved retailers receive tiered wholesale pricing, priority production,
            and seasonal lookbooks. Each application is reviewed personally within 48 hours.
          </p>

          <ul className="mt-10 space-y-4 text-sm text-foreground/70">
            <li className="flex gap-3">
              <span className="font-display text-primary">01</span>
              Submit your business details
            </li>
            <li className="flex gap-3">
              <span className="font-display text-primary">02</span>
              We review within 48 hours
            </li>
            <li className="flex gap-3">
              <span className="font-display text-primary">03</span>
              Unlock pricing and place your first order
            </li>
          </ul>
        </div>

        <form onSubmit={submit} className="space-y-6 rounded-sm border border-border bg-card p-8 lg:p-10">
          <Field label="Business name">
            <input required value={form.business_name} onChange={set("business_name")} className={input} />
          </Field>
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Owner full name">
              <input required value={form.owner_name} onChange={set("owner_name")} className={input} />
            </Field>
            <Field label="Phone">
              <input required value={form.phone} onChange={set("phone")} className={input} />
            </Field>
          </div>
          <Field label="Email">
            <input required type="email" value={form.email} onChange={set("email")} className={input} />
          </Field>
          <Field label="Business address">
            <textarea required rows={3} value={form.business_address} onChange={set("business_address")} className={input} />
          </Field>
          <Field label="Monthly purchase volume">
            <select required value={form.monthly_volume} onChange={set("monthly_volume")} className={input}>
              <option value="">Select volume…</option>
              {volumes.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Instagram (optional)">
              <input value={form.instagram} onChange={set("instagram")} placeholder="@handle" className={input} />
            </Field>
            <Field label="WhatsApp (optional)">
              <input value={form.whatsapp} onChange={set("whatsapp")} placeholder="+234…" className={input} />
            </Field>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full rounded-sm bg-primary px-7 py-4 text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {busy ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      </div>
    </SiteLayout>
  );
}

const input =
  "w-full rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}
