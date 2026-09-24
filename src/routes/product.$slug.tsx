import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { Minus, Plus, Sparkles, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductGrid, StoreShell } from "@/components/storefront";
import { money, products } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = products.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Product"} — The Cozy Crochet` },
      { name: "description", content: loaderData?.description ?? "Handmade crochet product." },
      { property: "og:title", content: `${loaderData?.name ?? "Product"} — The Cozy Crochet` },
      { property: "og:description", content: loaderData?.description ?? "Handmade crochet product." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const p = Route.useLoaderData();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(p, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <StoreShell>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-12 md:grid-cols-2 lg:px-8">
        <div className="relative">
          <img
            src={p.image}
            alt={p.name}
            width={912}
            height={912}
            className="aspect-square w-full rounded-3xl object-cover shadow-sm ring-1 ring-border"
          />
          {p.badge && (
            <span className="absolute left-4 top-4 rounded-full bg-card px-3.5 py-1 text-xs font-bold uppercase tracking-wider shadow-xs">
              {p.badge}
            </span>
          )}
        </div>

        <div className="md:py-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{p.category}</p>
            <h1 className="mt-2 font-display text-4xl font-medium sm:text-5xl">{p.name}</h1>
            <p className="mt-4 font-display text-3xl text-primary font-medium">{money(p.price)}</p>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {p.description} Each piece is hand-looped with high-grade natural yarn, giving it subtle heirloom variations that make it completely unique.
            </p>

            {/* Add to Bag and Quantity */}
            <div className="mt-8 flex flex-wrap gap-3 sm:flex-nowrap">
              <div className="flex items-center rounded-xl border border-border bg-card">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Decrease quantity"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-10 text-center font-bold">{qty}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Increase quantity"
                  onClick={() => setQty(qty + 1)}
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              <Button
                className="flex-1 py-6 text-base font-bold shadow-sm"
                onClick={handleAddToCart}
              >
                {added ? (
                  <>
                    <Check className="mr-2 size-4" /> Added to Bag!
                  </>
                ) : (
                  "Add to bag"
                )}
              </Button>
            </div>

            {/* Customization Callout */}
            <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 flex items-center justify-between">
              <div className="text-xs">
                <p className="font-bold text-foreground">Want this piece in a different size or shade?</p>
                <p className="text-muted-foreground">We take custom commissions crafted to your specifications.</p>
              </div>
              <Button size="sm" variant="soft" className="ml-3 shrink-0" asChild>
                <Link to="/custom-order">
                  <Sparkles className="mr-1.5 size-3.5 text-primary" /> Customize
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended items */}
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 border-t border-border mt-8">
        <h2 className="mb-7 font-display text-3xl font-medium">You may also love</h2>
        <ProductGrid items={products.filter((x) => x.slug !== p.slug).slice(0, 4)} />
      </section>
    </StoreShell>
  );
}