"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Package, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { PageIntro, StoreShell } from "@/components/next-storefront";
import { Button } from "@/components/ui/button";
import { fetchProducts } from "@/lib/api";
import { products as initialProducts, type Product } from "@/lib/catalog";

export default function CollectionsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);

  useEffect(() => {
    fetchProducts().then((data) => {
      setProducts(data || []);
      setLoading(false);
    });
  }, []);

  // Group products by category dynamically using the FIRST product added to each category
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

  const sortedChronological = [...products].sort(
    (a, b) => getProductTimestamp(a) - getProductTimestamp(b)
  );

  const collectionsMap = new Map<string, { category: string; count: number; image: string }>();

  sortedChronological.forEach((p) => {
    if (p.category) {
      const catKey = p.category.toLowerCase().trim();
      const formattedTitle = p.category.charAt(0).toUpperCase() + p.category.slice(1);
      const imgSrc = typeof p.image === "string" ? p.image : (p.image as any)?.src || "/assets/cloud-throw.jpg";

      if (collectionsMap.has(catKey)) {
        const existing = collectionsMap.get(catKey)!;
        existing.count += 1;
        // Image remains the first item's image permanently!
      } else {
        collectionsMap.set(catKey, {
          category: formattedTitle,
          count: 1,
          image: imgSrc,
        });
      }
    }
  });

  const collections = Array.from(collectionsMap.values());

  return (
    <StoreShell>
      <section className="mx-auto max-w-7xl px-5 pt-6 pb-20 lg:px-8">
        <div className="mb-6 flex items-baseline justify-between border-b border-border pb-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight">Studio Collections</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Handcrafted crochet pieces grouped by category</p>
          </div>
          <Link href="/shop" className="text-xs font-bold text-primary hover:underline">
            View All Pieces →
          </Link>
        </div>
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-center">
            <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">Loading...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center my-6">
            <Package className="mx-auto size-10 text-muted-foreground/60" />
            <h3 className="mt-4 font-display text-2xl font-medium">No Collections Yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              When products are added to the shop, new collections will automatically appear here with your uploaded photos!
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/shop">
                  Browse All Pieces <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button variant="outline" className="bg-card text-foreground hover:bg-secondary hover:text-foreground" asChild>
                <Link href="/custom-order">
                  <Sparkles className="mr-1.5 size-4 text-primary" /> Request Custom Order
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
            {collections.map((c) => (
              <Link
                key={c.category}
                href={`/shop?category=${encodeURIComponent(c.category)}`}
                className="group rounded-3xl border border-border bg-card p-4 transition-all hover:shadow-md"
              >
                <div className="overflow-hidden rounded-2xl bg-secondary">
                  <img
                    src={c.image}
                    alt={c.category}
                    width={912}
                    height={912}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-medium text-foreground">{c.category}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.count} {c.count === 1 ? "creation" : "creations"} available
                    </p>
                  </div>
                </div>
                <span className="mt-4 flex items-center gap-1.5 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                  Explore collection <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </StoreShell>
  );
}
