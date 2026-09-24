import { createFileRoute, Link } from "@tanstack/react-router";
import { SlidersHorizontal, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageIntro, ProductGrid, StoreShell } from "@/components/storefront";
import { products as initialProducts, type Product } from "@/lib/catalog";
import { fetchProducts } from "@/lib/api";

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>) => ({
    category: typeof s["category"] === "string" ? s["category"] : "All",
  }),
  head: () => ({
    meta: [
      { title: "Shop Handmade Crochet — The Cozy Crochet" },
      {
        name: "description",
        content: "Browse handmade crochet blankets, bags, amigurumi and accessories.",
      },
      { property: "og:title", content: "Shop Handmade Crochet — The Cozy Crochet" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();
  const [cat, setCat] = useState(search.category);
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    fetchProducts().then(setAllProducts);
  }, []);

  const cats = ["All", "Blankets", "Bags", "Amigurumi", "Wear"];
  const filtered =
    cat === "All"
      ? allProducts
      : allProducts.filter((p) => p.category.toLowerCase() === cat.toLowerCase());

  return (
    <StoreShell>
      <PageIntro
        eyebrow="The collection"
        title="Crochet pieces for everyday rituals."
        text="Thoughtful shapes, soft natural fibres and colour palettes inspired by quiet mornings."
      />

      <section className="mx-auto max-w-7xl px-5 lg:px-8 pb-16">
        {/* Category Filters Bar */}
        <div className="mb-8 flex flex-wrap items-center gap-2 border-y border-border py-4">
          <SlidersHorizontal className="mr-2 size-4 text-muted-foreground" />
          {cats.map((c) => (
            <Button
              key={c}
              variant={cat === c ? "default" : "outline"}
              size="sm"
              onClick={() => setCat(c)}
            >
              {c}
            </Button>
          ))}
          <span className="ml-auto text-sm text-muted-foreground">{filtered.length} pieces</span>
        </div>

        {/* Product Grid */}
        <ProductGrid items={filtered} />

        {/* Custom Order Callout Card */}
        <div className="mt-16 rounded-3xl border border-border bg-card p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
              <Sparkles className="size-3.5" /> Bespoke Commissions
            </span>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-medium">
              Don't see the exact size or color you want?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              We specialize in custom crochet orders. Tell us your favourite color palette, dimensions, and
              design style, and AJ will hand-stitch it for you.
            </p>
          </div>
          <Button size="lg" className="shrink-0 w-full md:w-auto" asChild>
            <Link to="/custom-order">
              <Sparkles className="mr-2 size-4" /> Customize According to Your Choice
            </Link>
          </Button>
        </div>
      </section>
    </StoreShell>
  );
}