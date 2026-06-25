import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import heroImg from "@/assets/hero.jpg";
import ankaraImg from "@/assets/product-ankara.jpg";
import laceImg from "@/assets/product-lace.jpg";
import adireImg from "@/assets/product-adire.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Patience Sewing — Premium African Fashion, Wholesale" },
      {
        name: "description",
        content:
          "Wholesale luxury African fashion. Minimum 12 pieces, maximum quality. Trusted by 500+ retailers.",
      },
      { property: "og:title", content: "Patience Sewing — Premium African Fashion, Wholesale" },
      { property: "og:description", content: "Minimum 12 pieces. Maximum quality." },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: HomePage,
});

const featured = [
  { name: "Ankara Wrap Dress", category: "Dresses", moq: 12, img: ankaraImg },
  { name: "Lace Overlay Blouse", category: "Tops", moq: 24, img: laceImg },
  { name: "Adire Midi Skirt", category: "Skirts", moq: 12, img: adireImg },
];

function HomePage() {
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative">
        <div className="grid gap-0 lg:grid-cols-12">
          <div className="order-2 flex flex-col justify-center px-6 py-20 lg:order-1 lg:col-span-5 lg:px-16 lg:py-32">
            <p className="eyebrow">Wholesale · Est. 2018</p>
            <h1 className="mt-6">
              Premium African Fashion,{" "}
              <span className="italic text-primary">wholesale.</span>
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-foreground/75">
              Minimum 12 pieces. Maximum quality. We design and produce ready-to-wear
              collections for retailers who treat fashion as craft.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/catalog"
                className="rounded-sm bg-primary px-7 py-4 text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Browse Collection
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
            <div className="relative h-[calc(60vh-4rem)] min-h-[420px] overflow-hidden bg-secondary lg:h-[calc(100vh-5rem)]">
              <img
                src={heroImg}
                alt="Editorial shot of an Ankara wrap dress in burnt orange"
                width={1600}
                height={1920}
                className="h-full w-full object-cover"
              />
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
          {featured.map((p) => (
            <Link to="/catalog" key={p.name} className="group">
              <div className="aspect-[4/5] overflow-hidden border border-border bg-secondary">
                <img
                  src={p.img}
                  alt={p.name}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="mt-5 flex items-start justify-between">
                <div>
                  <p className="eyebrow text-[0.6rem]">{p.category}</p>
                  <h3 className="mt-1 text-xl">{p.name}</h3>
                </div>
                <span className="rounded-sm border border-border px-2 py-1 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                  MOQ {p.moq}
                </span>
              </div>
            </Link>
          ))}
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
