import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Patience Sewing" },
      { name: "description", content: "Sign in to your Patience Sewing retailer account." },
    ],
  }),
  component: AuthPage,
});

const signinSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(6).max(200),
});

const signupSchema = signinSchema.extend({
  full_name: z.string().trim().min(2).max(120),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirm: "", full_name: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed", { description: result.error.message });
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    toast.success("Welcome back");
    navigate({ to: "/catalog" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const p = signinSchema.parse(form);
        const { error } = await supabase.auth.signInWithPassword(p);
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/catalog" });
      } else {
        const p = signupSchema.parse(form);
        const { error } = await supabase.auth.signUp({
          email: p.email,
          password: p.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: p.full_name },
          },
        });
        if (error) throw error;
        toast.success("Account created", {
          description: "Apply for wholesale access to unlock pricing.",
        });
        navigate({ to: "/apply" });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-2 lg:px-12 lg:py-28">
        <div className="hidden flex-col justify-between lg:flex">
          <div>
            <p className="eyebrow">Patience Sewing</p>
            <h1 className="mt-6 text-5xl">
              Sign in to your <span className="italic text-primary">atelier</span>.
            </h1>
            <p className="mt-6 max-w-md text-foreground/70">
              Approved retailers see tiered wholesale pricing, place orders, and track production.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            New to Patience Sewing?{" "}
            <Link to="/apply" className="text-primary hover:text-accent">
              Apply for wholesale access →
            </Link>
          </p>
        </div>

        <div className="rounded-sm border border-border bg-card p-8 lg:p-10">
          <div className="mb-8 flex gap-2 border-b border-border">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`-mb-px border-b-2 px-4 py-3 text-xs font-medium uppercase tracking-[0.22em] transition-colors ${
                  mode === m ? "border-primary text-primary" : "border-transparent text-foreground/50 hover:text-foreground"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="w-full rounded-sm border border-border bg-background px-5 py-3 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
          >
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-5">
            {mode === "signup" && (
              <Field label="Full name">
                <input required value={form.full_name} onChange={set("full_name")} className={inputCls} />
              </Field>
            )}
            <Field label="Email">
              <input required type="email" value={form.email} onChange={set("email")} className={inputCls} />
            </Field>
            <Field label="Password">
              <input required type="password" value={form.password} onChange={set("password")} className={inputCls} />
            </Field>
            {mode === "signup" && (
              <Field label="Confirm password">
                <input required type="password" value={form.confirm} onChange={set("confirm")} className={inputCls} />
              </Field>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-sm bg-primary px-7 py-4 text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground lg:hidden">
            <Link to="/apply" className="text-primary hover:text-accent">
              Apply for wholesale access
            </Link>
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}

const inputCls =
  "w-full rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}
