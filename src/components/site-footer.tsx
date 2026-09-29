import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="eyebrow">Patience Sewing Ltd</p>
            <p className="mt-4 max-w-md font-display text-3xl leading-tight">
              Premium African fashion, made for the retailers who refuse to compromise.
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="eyebrow mb-5">Explore</p>
            <ul className="space-y-3 text-sm text-foreground/70">
              <li><Link to="/catalog" className="hover:text-primary">The Collection</Link></li>
              <li><Link to="/apply" className="hover:text-primary">Wholesale Access</Link></li>
              <li><Link to="/auth" className="hover:text-primary">Retailer Sign In</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="eyebrow mb-5">Contact</p>
            <ul className="space-y-3 text-sm text-foreground/70">
              <li>
                <a href="mailto:wholesale@patiencesewing.com" className="hover:text-primary">
                  wholesale@patiencesewing.com
                </a>
              </li>
              <li>Atelier · Bayelsa, Nigeria</li>
              <li>Minimum order — 12 pieces</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Patience Sewing Ltd. All rights reserved.</p>
          <p className="uppercase tracking-[0.18em]">Crafted in Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
