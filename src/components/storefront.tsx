import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, UserRound, X, ArrowRight, Instagram, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { products, money, type Product } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";

const nav = [
  ["Shop", "/shop"],
  ["Collections", "/collections"],
  ["Custom Order", "/custom-order"],
  ["Our studio", "/about"],
  ["Journal", "/journal"],
] as const;

export function StoreShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { totalCount } = useCart();

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      {/* Top Announcement Bar */}
      <div className="bg-primary px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground flex items-center justify-center gap-2 flex-wrap">
        <span>Complimentary gift wrapping on every handmade order</span>
        <span className="opacity-60 hidden sm:inline">·</span>
        <Link to="/custom-order" className="underline underline-offset-2 hover:opacity-80">
          Request a Custom Crochet Piece
        </Link>
      </div>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="font-display text-2xl font-medium tracking-tight">
            The Cozy Crochet
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            {nav.map(([label, to]) => (
              <Link
                key={to}
                to={to}
                className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
                activeProps={{ className: "text-primary" }}
              >
                {label === "Custom Order" ? (
                  <span className="flex items-center gap-1 text-primary">
                    <Sparkles className="size-3.5" />
                    {label}
                  </span>
                ) : (
                  label
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Search products" asChild>
              <Link to="/shop" search={{ category: "All" }}>
                <Search className="size-4" />
              </Link>
            </Button>

            <Button variant="ghost" size="icon" aria-label="Account" className="hidden sm:inline-flex" asChild>
              <Link to="/account">
                <UserRound className="size-4" />
              </Link>
            </Button>

            <Button variant="soft" className="ml-1 relative" asChild>
              <Link to="/cart">
                <ShoppingBag className="size-4" /> Bag
                <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] text-accent-foreground font-bold">
                  {totalCount}
                </span>
              </Link>
            </Button>

            <Button variant="outline" className="ml-2 hidden lg:inline-flex" asChild>
              <Link to="/admin">Studio admin</Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Toggle menu"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {open && (
          <nav className="border-t border-border bg-background px-5 py-4 md:hidden space-y-1">
            {nav.map(([label, to]) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="block border-b border-border/60 py-3 font-semibold text-foreground hover:text-primary"
              >
                {label === "Custom Order" ? `✨ ${label}` : label}
              </Link>
            ))}
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="block border-b border-border/60 py-3 font-semibold text-foreground hover:text-primary"
            >
              My Account
            </Link>
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="block py-3 font-semibold text-primary"
            >
              Studio admin
            </Link>
          </nav>
        )}
      </header>

      <main>{children}</main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-display text-2xl font-medium">The Cozy Crochet</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Handmade crochet goods, made slowly and wrapped with care. Join our studio notes for new drops,
            restocks, and seasonal creations.
          </p>
          <form className="mt-5 flex max-w-sm gap-2" onSubmit={(e) => e.preventDefault()}>
            <Input type="email" aria-label="Email address" />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>

        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Shop</p>
          <div className="space-y-3 text-sm">
            <Link className="block hover:text-primary" to="/shop" search={{ category: "All" }}>
              All products
            </Link>
            <Link className="block font-bold text-accent hover:text-primary" to="/custom-order">
              ✨ Customize According to Your Choice
            </Link>
            <Link className="block hover:text-primary" to="/collections">
              Collections
            </Link>
            <Link className="block hover:text-primary" to="/cart">
              Your bag
            </Link>
            <Link className="block hover:text-primary" to="/checkout">
              Checkout
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Studio</p>
          <div className="space-y-3 text-sm">
            <Link className="block hover:text-primary" to="/about">
              Our story
            </Link>
            <Link className="block hover:text-primary" to="/journal">
              Journal
            </Link>
            <Link className="block hover:text-primary" to="/account">
              Account
            </Link>
            <a
              className="flex items-center gap-2 hover:text-primary"
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
            >
              <Instagram className="size-4" /> Instagram
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between lg:px-8">
          <span>© 2026 The Cozy Crochet. All rights reserved.</span>
          <span>Crafted by hand · Made to be kept</span>
        </div>
      </div>
    </footer>
  );
}

export function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-10 pt-14 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl font-medium leading-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-7 text-muted-foreground">{text}</p>
    </section>
  );
}

export function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd?: (product: Product) => void;
}) {
  const { addToCart } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAdd) {
      onAdd(product);
    } else {
      addToCart(product, 1);
    }
  };

  const isSale = Boolean(
    product.onSale || (product.originalPrice && product.originalPrice > product.price)
  );
  const effectiveOriginal =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice
      : Math.round(product.price * 1.25);

  const discountPercent = isSale
    ? Math.round(((effectiveOriginal - product.price) / effectiveOriginal) * 100)
    : null;

  return (
    <article className="group min-w-0 flex flex-col justify-between">
      <div>
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="relative block overflow-hidden rounded-2xl bg-secondary"
        >
          <img
            src={product.image}
            alt={product.name}
            width={912}
            height={912}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
          />
          {product.badge && (
            <span className="absolute left-3 top-3 rounded-full bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-wide shadow-xs">
              {product.badge}
            </span>
          )}
          {isSale && (
            <span className="absolute right-3 top-3 rounded-full bg-rose-600 text-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-md flex items-center gap-1">
              🔥 {discountPercent ? `-${discountPercent}%` : "SALE"}
            </span>
          )}
        </Link>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{product.category}</p>
            <Link
              to="/product/$slug"
              params={{ slug: product.slug }}
              className="mt-1 block font-display text-lg font-medium hover:text-primary transition-colors"
            >
              {product.name}
            </Link>
          </div>
          <div className="text-right shrink-0">
            {isSale ? (
              <div className="flex flex-col items-end">
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {money(product.price)}
                </span>
                <span className="text-[11px] text-muted-foreground line-through">
                  {money(effectiveOriginal)}
                </span>
              </div>
            ) : (
              <p className="font-semibold text-primary">{money(product.price)}</p>
            )}
          </div>
        </div>
      </div>
      <Button variant="soft" className="mt-3 w-full" onClick={handleAdd}>
        <ShoppingBag className="mr-1.5 size-4" /> Add to Cart
      </Button>
    </article>
  );
}

export function ProductGrid({
  items = products,
  onAdd,
}: {
  items?: readonly Product[];
  onAdd?: (product: Product) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {items.map((product) => (
        <ProductCard key={product.slug} product={product} {...(onAdd ? { onAdd } : {})} />
      ))}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  link,
  to = "/shop",
}: {
  eyebrow?: string;
  title: string;
  link?: string;
  to?: "/shop" | "/collections" | "/journal" | "/custom-order";
}) {
  const target =
    to === "/shop" ? (
      <Link
        to="/shop"
        search={{ category: "All" }}
        className="hidden items-center gap-2 text-sm font-bold text-primary hover:text-foreground sm:flex"
      >
        {link}
        <ArrowRight className="size-4" />
      </Link>
    ) : to === "/collections" ? (
      <Link
        to="/collections"
        className="hidden items-center gap-2 text-sm font-bold text-primary hover:text-foreground sm:flex"
      >
        {link}
        <ArrowRight className="size-4" />
      </Link>
    ) : to === "/custom-order" ? (
      <Link
        to="/custom-order"
        className="hidden items-center gap-2 text-sm font-bold text-primary hover:text-foreground sm:flex"
      >
        {link}
        <ArrowRight className="size-4" />
      </Link>
    ) : (
      <Link
        to="/journal"
        className="hidden items-center gap-2 text-sm font-bold text-primary hover:text-foreground sm:flex"
      >
        {link}
        <ArrowRight className="size-4" />
      </Link>
    );

  return (
    <div className="mb-7 flex items-end justify-between gap-5">
      <div>
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>}
        <h2 className="mt-1 font-display text-3xl font-medium">{title}</h2>
      </div>
      {link && target}
    </div>
  );
}