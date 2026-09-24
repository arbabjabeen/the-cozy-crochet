import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Gift, Heart, Leaf, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid, SectionHeading, StoreShell } from "@/components/storefront";
import { products } from "@/lib/catalog";
import hero from "@/assets/crochet-hero.jpg";
import studio from "@/assets/crochet-studio.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Cozy Crochet — Handmade Crochet Goods" },
      {
        name: "description",
        content:
          "Shop handmade crochet blankets, bags, amigurumi and warm accessories from The Cozy Crochet. Request custom crochet orders.",
      },
      { property: "og:title", content: "The Cozy Crochet — Handmade Crochet Goods" },
      {
        property: "og:description",
        content: "Thoughtful crochet pieces, stitched slowly and made to be kept.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <StoreShell>
      {/* Hero Section */}
      <section className="mx-auto grid max-w-7xl items-start gap-8 px-5 pb-10 pt-4 md:grid-cols-[1.1fr_1fr] md:gap-12 md:pt-6 lg:px-8 lg:pt-8">
        <div className="rise">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary ring-1 ring-border">
            <Sparkles className="size-3 text-primary" /> Handmade in small batches
          </p>
          <h1 className="mt-6 max-w-xl font-display text-5xl font-medium leading-[1.05] sm:text-6xl">
            Woven by hand, made to be kept for years.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-7 text-muted-foreground">
            Slow-made crochet blankets, market totes and keepsake friends—each piece worked by a small
            studio of makers and wrapped by hand with love.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/shop" search={{ category: "All" }}>
                Shop the collection <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/custom-order">
                <Sparkles className="mr-1.5 size-4 text-primary" /> Customize your piece
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative rise">
          <img
            src={hero}
            alt="Artisan crocheting a cream and sage blanket"
            width={1024}
            height={1280}
            className="aspect-[4/5] w-full rounded-3xl object-cover shadow-sm ring-1 ring-border"
          />
          <div className="absolute -bottom-4 left-4 rounded-2xl bg-card px-4 py-3 shadow-lg ring-1 ring-border sm:-left-4">
            <p className="text-sm font-bold">The Cloud Throw</p>
            <p className="text-xs text-muted-foreground">from $84 · hand wrapped</p>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <SectionHeading title="Shop by category" link="Browse all" to="/collections" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["Blankets", products[0]],
            ["Bags", products[1]],
            ["Amigurumi", products[2]],
            ["Wear", products[3]],
          ].map(([name, p]) => {
            const item = p as (typeof products)[number];
            return (
              <Link
                key={String(name)}
                to="/shop"
                search={{ category: String(name) }}
                className="group rounded-2xl bg-card p-3 ring-1 ring-border transition-all hover:shadow-md"
              >
                <img
                  src={item.image}
                  alt={`${name} collection`}
                  width={912}
                  height={912}
                  loading="lazy"
                  className="aspect-square w-full rounded-xl object-cover transition-transform group-hover:scale-[1.02]"
                />
                <p className="mt-3 font-bold">{String(name)}</p>
                <p className="text-xs text-muted-foreground">Explore the collection</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <SectionHeading eyebrow="Featured" title="This season's favourites" link="View all products" />
        <ProductGrid items={products.slice(0, 4)} />
      </section>

      {/* NEW: Customized According to Your Choice Banner */}
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/5 p-8 sm:p-12 lg:p-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent ring-1 ring-border">
              <Sparkles className="size-3.5 text-accent" /> Bespoke Studio Commissions
            </span>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-medium leading-tight">
              Customize According to Your Choice
            </h2>
            <p className="mt-3 text-base sm:text-lg leading-relaxed text-muted-foreground">
              Have a special color palette, particular blanket dimensions, or an amigurumi idea in mind?
              Submit your requirements with an optional reference photo. AJ will hand-craft it loop by
              loop and stay in touch on WhatsApp or Email.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Button size="lg" className="shadow-md" asChild>
                <Link to="/custom-order">
                  <Sparkles className="mr-2 size-4" /> Request Custom Order
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/about">Learn Our Crafting Process</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Studio Story */}
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid items-center gap-9 rounded-3xl bg-card p-6 ring-1 ring-border md:grid-cols-[1fr_1.05fr] md:p-10">
          <img
            src={studio}
            alt="The Cozy Crochet yarn studio"
            width={1280}
            height={912}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-2xl object-cover"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Our studio</p>
            <h2 className="mt-2 font-display text-3xl font-medium">
              A shelf of fibres, a small team, and a lot of patience.
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              We choose soft natural yarns, work in small runs and hand-finish every piece before it leaves
              our studio.
            </p>
            <Button variant="outline" className="mt-6" asChild>
              <Link to="/about">
                Our story <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Three Values */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-3 lg:px-8">
          {[
            [Leaf, "Natural fibres", "Cotton and merino chosen for softness and longevity."],
            [Heart, "Made slowly", "Each piece is counted, checked and finished by hand."],
            [Gift, "Ready to give", "Complimentary kraft wrap and a handwritten note."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Leaf;
            return (
              <div key={String(t)}>
                <I className="size-5 text-primary" />
                <h3 className="mt-3 font-display text-xl font-medium">{String(t)}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{String(d)}</p>
              </div>
            );
          })}
        </div>
      </section>
    </StoreShell>
  );
}