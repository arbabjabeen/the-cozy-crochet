"use client";

import Link from "next/link";
import { ArrowRight, Gift, Heart, Leaf, Sparkles, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ProductGrid, SectionHeading, StoreShell } from "@/components/next-storefront";
import { fetchProducts } from "@/lib/api";
import { products as initialProducts, type Product } from "@/lib/catalog";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);

  useEffect(() => {
    fetchProducts().then((prods) => {
      if (prods && prods.length > 0) {
        setFeaturedProducts(prods);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  // Build categories using the FIRST item ever added to each category
  // Chronologically sort (oldest/first added first) so new additions never overwrite the cover card
  const getProductTimestamp = (p: any): number => {
    if (p.createdAt) {
      const t = new Date(p.createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    if (p._id && typeof p._id === "string" && p._id.startsWith("prod-")) {
      const t = Number(p._id.replace("prod-", ""));
      if (!isNaN(t)) return t;
    }
    return 0;
  };

  const sortedChronological = [...featuredProducts].sort(
    (a, b) => getProductTimestamp(a) - getProductTimestamp(b)
  );

  const productCategoriesMap = new Map<string, { name: string; img: string; subtitle: string }>();

  sortedChronological.forEach((p) => {
    if (p.category) {
      const lower = p.category.toLowerCase().trim();
      const formatted = p.category.charAt(0).toUpperCase() + p.category.slice(1);
      const imgSrc = typeof p.image === "string" ? p.image : (p.image as any)?.src || "/assets/cloud-throw.jpg";
      if (!productCategoriesMap.has(lower)) {
        productCategoriesMap.set(lower, {
          name: formatted,
          img: imgSrc,
          subtitle: "Handcrafted Studio Pieces",
        });
      }
    }
  });

  const categories = Array.from(productCategoriesMap.values());

  return (
    <StoreShell>
      {/* Hero Section */}
      <section className="mx-auto grid max-w-7xl items-start gap-6 sm:gap-8 px-4 sm:px-5 pb-8 sm:pb-10 pt-3 sm:pt-4 md:grid-cols-[1.1fr_1fr] md:gap-12 md:pt-6 lg:px-8 lg:pt-8">
        <div className="rise pt-1 md:pt-2">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 sm:px-3.5 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-[0.16em] text-primary ring-1 ring-border shadow-2xs">
            <Sparkles className="size-3 text-primary" /> Handmade in small batches by AJ
          </p>
          <h1 className="mt-3 sm:mt-5 max-w-xl font-display text-3xl sm:text-5xl lg:text-6xl font-medium leading-[1.1] sm:leading-[1.08] tracking-tight">
            Woven by hand, made to last.
          </h1>
          <p className="mt-3 sm:mt-4 max-w-lg text-sm sm:text-lg leading-relaxed text-muted-foreground">
            Slow-made crochet pieces crafted with soft natural fibres and wrapped with care by AJ.
          </p>
          <div className="mt-5 sm:mt-7 flex flex-wrap gap-2.5 sm:gap-3">
            <Button size="lg" asChild className="shadow-xs font-bold text-xs sm:text-sm h-10 sm:h-11 px-4 sm:px-6">
              <Link href="/shop">
                Shop pieces <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="font-semibold text-xs sm:text-sm h-10 sm:h-11 px-4 sm:px-6 bg-card text-foreground hover:bg-secondary hover:text-foreground">
              <Link href="/custom-order">
                <Sparkles className="mr-1.5 size-4 text-primary" /> Customize
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative rise">
          <img
            src="/assets/crochet-hero.jpg"
            alt="Artisan crocheting a piece"
            width={1024}
            height={1280}
            className="w-full h-auto max-h-[380px] sm:max-h-[480px] lg:max-h-[520px] rounded-2xl sm:rounded-3xl object-cover shadow-sm ring-1 ring-border"
          />
        </div>
      </section>

      {/* Category Grid */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-5 py-10 sm:py-14 lg:px-8">
          <SectionHeading title="Shop by category" link="Browse all" to="/collections" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="group rounded-2xl bg-card p-3 ring-1 ring-border transition-all hover:shadow-md"
              >
                <img
                  src={cat.img}
                  alt={`${cat.name} collection`}
                  width={912}
                  height={912}
                  loading="lazy"
                  className="aspect-square w-full rounded-xl object-cover transition-transform group-hover:scale-[1.02]"
                />
                <p className="mt-3 font-bold">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.subtitle}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <SectionHeading eyebrow="Featured" title="This season's favourites" link="View all products" to="/shop" />
        {loading && featuredProducts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
            <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">Loading...</p>
          </div>
        ) : featuredProducts.length > 0 ? (
          <ProductGrid items={featuredProducts} />
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
            <Sparkles className="mx-auto size-8 text-primary" />
            <h3 className="mt-3 font-display text-xl font-medium">New Handcrafted Pieces Dropping Soon</h3>
            <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
              AJ is busy at the studio stitching new creations. In the meantime, you can customize your piece according to your exact choice!
            </p>
            <Button className="mt-6 shadow-sm" asChild>
              <Link href="/custom-order">
                <Sparkles className="mr-2 size-4" /> Customize According to Your Choice
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* Customize According to Your Choice Banner */}
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/5 p-8 sm:p-12 lg:p-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent ring-1 ring-border">
              <Sparkles className="size-3.5 text-accent" /> Bespoke Studio Commissions
            </span>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-medium leading-tight">
              Customize According to Your Choice
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Have a special color, dimension, or idea in mind? Share your request and AJ will hand-craft it for you.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/custom-order">
                  <Sparkles className="mr-2 size-4" /> Customize a Piece
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Studio Story */}
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid items-center gap-8 rounded-3xl bg-card p-6 ring-1 ring-border md:grid-cols-[1fr_1.05fr] md:p-8">
          <img
            src="/assets/crochet-studio.jpg"
            alt="The Cozy Crochet yarn studio"
            width={1280}
            height={912}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-2xl object-cover"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Our studio</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-medium">
              A shelf of fibres and a lot of patience.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We work in small runs with soft natural yarns, hand-finishing every piece before it leaves our studio.
            </p>
            <Button variant="outline" className="mt-5 bg-card text-foreground hover:bg-secondary hover:text-foreground" asChild>
              <Link href="/about">
                Our story <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Values */}
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
