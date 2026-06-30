import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site-layout";
import { fetchProducts, formatNgn, resolveImage, discountPct } from "@/lib/products";
import heroDesktop from "@/assets/hero-desktop.jpg";
import heroDesktop2x from "@/assets/hero-desktop@2x.jpg";
import heroMobile from "@/assets/hero-mobile.jpg";
import heroMobile2x from "@/assets/hero-mobile@2x.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Patience Sewing — Premium Fashion, Retail & Wholesale" },
      {
        name: "description",
        content:
          "Shop premium fashion direct. Buy single pieces at retail, or unlock wholesale pricing from 12 pieces.",
      },
      { property: "og:title", content: "Patience Sewing — Premium Fashion" },
      { property: "og:description", content: "Retail and wholesale. Direct from our Lagos atelier." },
      { property: "og:image", content: heroDesktop2x },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const featured = (products ?? []).slice(0, 3);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative">
        <div className="grid gap-0 lg:grid-cols-12">
          <div className="order-2 flex flex-col justify-center px-6 py-20 lg:order-1 lg:col-span-5 lg:px-16 lg:py-32">
            <p className="eyebrow">Retail · Wholesale · Est. 2018</p>
            <h1 className="mt-6">
              Premium Fashion,{" "}
              <span className="italic text-primary">direct.</span>
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-foreground/75">
              Shop single pieces at retail, or unlock tiered wholesale pricing from 12 pieces.
              Designed and produced in our Lagos atelier.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/catalog"
                className="rounded-sm bg-primary px-7 py-4 text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Shop the Collection
              </Link>
              <Link
                to="/apply"
                className="rounded-sm border border-foreground px-7 py-4 text-xs font-medium uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                Apply as Retailer
              </Link>
            </div>
            <div className="mt-16 flex items-center gap-8">
              <div>
                <p className="font-display text-3xl text-primary">500+</p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
                  Stocking Retailers
                </p>
              </div>
              <span className="h-12 w-px bg-border" />
              <div>
                <p className="font-display text-3xl text-primary">14 days</p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
                  Production Lead
                </p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-7">
            <div className="relative flex h-[70vh] min-h-[480px] items-center justify-center overflow-hidden bg-secondary lg:h-[calc(100vh-5rem)]">
              <picture>
                <source
                  media="(max-width: 767px)"
                  srcSet={`${heroMobile} 1x, ${heroMobile2x} 2x`}
                />
                <source
                  media="(min-width: 768px)"
                  srcSet={`${heroDesktop} 1x, ${heroDesktop2x} 2x`}
                />
                <img
                  src={heroDesktop}
                  alt="Editorial shot of an Ankara wrap dress in burnt orange"
                  className="h-full w-full object-cover object-center"
                  fetchPriority="high"
                  decoding="async"
                  width={1600}
                  height={1024}
                />
              </picture>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-12 lg:py-32">
        <div className="flex items-end justify-between border-b border-border pb-8">
          <div>
            <p className="eyebrow">The Collection</p>
            <h2 className="mt-3">Featured Pieces</h2>
          </div>
          <Link
            to="/catalog"
            className="hidden text-xs font-medium uppercase tracking-[0.22em] text-primary hover:text-accent md:inline"
          >
            View all →
          </Link>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => {
            const compare = Number(p.compare_at_price_ngn ?? 0);
            const price = Number(p.retail_price_ngn ?? 0);
            const pct = discountPct(p);
            return (
              <Link to="/catalog/$id" params={{ id: p.id }} key={p.id} className="group">
                <div className="relative aspect-[4/5] overflow-hidden border border-border bg-secondary">
                  <img
                    src={resolveImage(p.images[0])}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {pct && (
                    <span className="absolute left-3 top-3 rounded-sm bg-destructive px-2 py-1 text-[0.6rem] font-medium uppercase tracking-widest text-destructive-foreground">
                      −{pct}% Off
                    </span>
                  )}
                </div>
                <div className="mt-5 flex items-start justify-between">
                  <div>
                    <p className="eyebrow text-[0.6rem]">{p.category}</p>
                    <h3 className="mt-1 text-xl">{p.name}</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      {price > 0 && (
                        <span className="text-base font-medium text-primary">{formatNgn(price)}</span>
                      )}
                      {compare > price && (
                        <span className="text-xs text-muted-foreground line-through">{formatNgn(compare)}</span>
                      )}
                    </div>
                  </div>
                  <span className="rounded-sm border border-border px-2 py-1 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                    MOQ {p.moq}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* VALUES */}
      <section className="border-y border-border bg-secondary/50">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Why Patience Sewing</p>
            <h2 className="mt-4">A house built on three principles.</h2>
          </div>

          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Quality Fabrics",
                body: "Hand-sourced Ankara, Adire, French lace, and silk linings. We refuse anything we wouldn't wear ourselves.",
              },
              {
                n: "02",
                title: "Fast Production",
                body: "14-day lead times on standard orders. Our atelier in Lagos runs to schedule, every time.",
              },
              {
                n: "03",
                title: "Trusted by 500+",
                body: "Boutiques across Lagos, Abuja, Accra, London, and Atlanta stock our collections season after season.",
              },
            ].map((v) => (
              <div key={v.n} className="border-t border-foreground/20 pt-8">
                <p className="font-display text-4xl text-primary">{v.n}</p>
                <h3 className="mt-4 text-2xl">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/70">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-24 lg:grid-cols-12 lg:px-12 lg:py-32">
          <div className="lg:col-span-7">
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-accent">
              Wholesale Access
            </p>
            <h2 className="mt-4 text-primary-foreground">
              Become a stocking retailer.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/80">
              Approved retailers unlock tiered wholesale pricing, priority production
              slots, and seasonal lookbooks. Review takes 48 hours.
            </p>
          </div>
          <div className="flex items-end lg:col-span-5 lg:justify-end">
            <Link
              to="/apply"
              className="rounded-sm bg-accent px-8 py-4 text-xs font-medium uppercase tracking-[0.22em] text-accent-foreground transition-colors hover:bg-cream"
            >
              Apply for Access
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
