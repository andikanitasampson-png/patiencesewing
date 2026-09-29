import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/catalog", label: "Collection" },
  { to: "/apply", label: "Become a Retailer" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, profile, signOut, isApprovedRetailer, isAdmin } = useAuth();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:h-20 lg:px-12">
        <Link to="/" className="flex flex-col leading-none">
          <span className="font-display text-2xl tracking-tight">Patience Sewing Ltd</span>
          <span className="eyebrow mt-0.5 text-[0.6rem]">Atelier · Bayelsa</span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/70 transition-colors hover:text-primary [&.active]:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/70 hover:text-primary [&.active]:text-primary"
              >
                {isApprovedRetailer ? "Account" : "Dashboard"}
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-xs font-medium uppercase tracking-[0.18em] text-accent-foreground hover:text-primary [&.active]:text-primary"
                >
                  Admin
                </Link>
              )}
              <span className="text-xs text-muted-foreground">
                {profile?.full_name || user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/70 hover:text-primary"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="rounded-sm border border-foreground/80 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Sign in
            </Link>
          )}
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative flex h-9 w-9 items-center justify-center text-foreground/80 hover:text-primary"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full bg-primary px-1 text-center text-[0.6rem] font-medium leading-[1.1rem] text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <Link to="/cart" aria-label="Cart" className="relative">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 min-w-[1rem] rounded-full bg-primary px-1 text-center text-[0.55rem] font-medium leading-[1rem] text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <button onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-medium uppercase tracking-[0.18em] text-foreground/80"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-border pt-3">
              {user ? (
                <button
                  onClick={() => {
                    void signOut();
                    setOpen(false);
                  }}
                  className="py-3 text-sm font-medium uppercase tracking-[0.18em] text-foreground/80"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="py-3 text-sm font-medium uppercase tracking-[0.18em] text-foreground/80"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
