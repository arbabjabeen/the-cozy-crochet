"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, StoreShell } from "@/components/next-storefront";
import { money } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal, giftWrap, setGiftWrap, isLoaded } = useCart();

  if (!isLoaded) {
    return (
      <StoreShell>
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </StoreShell>
    );
  }

  if (items.length === 0) {
    return (
      <StoreShell>
        <PageIntro
          eyebrow="Your bag"
          title="A few lovely things."
          text="Your bag is currently empty. Explore our handmade collections or request a custom design."
        />
        <section className="mx-auto max-w-xl px-5 pb-24 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-secondary text-primary">
            <ShoppingBag className="size-8" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-medium">Nothing in your bag yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse our blankets, bags, and keepsake friends stitched slowly in our studio.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/shop">
                Browse collection <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-card text-foreground hover:bg-secondary hover:text-foreground" asChild>
              <Link href="/custom-order">
                <Sparkles className="mr-2 size-4 text-primary" /> Request custom piece
              </Link>
            </Button>
          </div>
        </section>
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      <PageIntro
        eyebrow="Your bag"
        title="A few lovely things."
        text="Your handmade pieces are held here while you decide. Every order is wrapped with studio care."
      />
      <section className="mx-auto grid max-w-6xl gap-8 sm:gap-10 px-4 sm:px-5 pb-24 md:grid-cols-[1.5fr_0.8fr]">
        <div className="divide-y divide-border">
          {items.map(({ product: p, quantity: q, color }) => {
            const imgSrc =
              typeof p.image === "string"
                ? p.image
                : (p.image as any)?.src || "/assets/cloud-throw.jpg";

            return (
              <div key={p.slug} className="flex gap-3 sm:gap-4 py-4 sm:py-6">
                <Link href={`/product/${p.slug}`} className="shrink-0">
                  <img
                    src={imgSrc}
                    alt={p.name}
                    className="size-20 sm:size-28 rounded-xl sm:rounded-2xl object-cover ring-1 ring-border"
                  />
                </Link>
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div className="flex justify-between gap-2 sm:gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${p.slug}`}
                        className="font-display text-base sm:text-xl font-medium hover:text-primary transition-colors line-clamp-2"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {color || "Sage"} · Hand wrapped
                      </p>
                    </div>
                    <strong className="font-semibold sm:font-medium text-base sm:text-lg text-primary shrink-0">{money(p.price * q)}</strong>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex items-center rounded-lg border border-border">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateQuantity(p.slug, -1)}
                        aria-label="Decrease"
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-8 text-center font-bold text-sm">{q}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateQuantity(p.slug, 1)}
                        aria-label="Increase"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(p.slug)}
                      aria-label="Remove"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="h-fit rounded-3xl bg-card p-6 ring-1 ring-border shadow-xs">
          <h2 className="font-display text-2xl font-medium">Order summary</h2>
          <div className="mt-6 space-y-3.5 text-sm">
            <p className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <strong className="font-semibold">{money(subtotal)}</strong>
            </p>
            <p className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <input
                  type="checkbox"
                  id="giftWrap"
                  checked={giftWrap}
                  onChange={(e) => setGiftWrap(e.target.checked)}
                  className="rounded accent-primary"
                />
                <label htmlFor="giftWrap" className="cursor-pointer">
                  Kraft gift wrap & handwritten note
                </label>
              </span>
              <strong className="text-primary font-semibold">Complimentary</strong>
            </p>
            <p className="flex justify-between border-t border-border pt-4 text-base font-bold">
              <span>Total</span>
              <span className="text-xl text-primary">{money(subtotal)}</span>
            </p>
          </div>

          <Button className="mt-6 w-full" size="lg" asChild>
            <Link href="/checkout">
              Continue to checkout <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Taxes & complimentary domestic shipping calculated at checkout.
          </p>
        </aside>
      </section>
    </StoreShell>
  );
}
