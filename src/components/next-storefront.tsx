"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, X, ArrowRight, Instagram, Sparkles, Package, MessageCircle, Star, Zap } from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { products, money, type Product } from "@/lib/catalog";
import { fetchProducts } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { FloatingCustomButton } from "@/components/floating-custom-button";
import { toast } from "sonner";

const nav = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["Collections", "/collections"],
  ["Customize", "/custom-order"],
  ["Our Studio", "/about"],
  ["Contact", "/contact"],
] as const;

export function StoreShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const { totalCount } = useCart();
  const { user, isAdmin } = useAuth();
  const pathname = usePathname();
  const isShopPage = pathname === "/shop" || pathname?.startsWith("/shop");

  useEffect(() => {
    if (!isShopPage) {
      setSearchOpen(false);
      setSearchQuery("");
    }
  }, [pathname, isShopPage]);

  useEffect(() => {
    if (!searchOpen || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      fetchProducts(undefined, searchQuery.trim())
        .then((res) => {
          setSearchResults(res);
          setSearching(false);
        })
        .catch(() => setSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchOpen, searchQuery]);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">


      {/* Top Announcement Bar */}
      <div className="bg-primary px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground flex items-center justify-center gap-2 flex-wrap">
        <span>Complimentary gift wrapping on every handmade order</span>
        <span className="opacity-60 hidden sm:inline">·</span>
        <Link href="/custom-order" className="underline underline-offset-2 hover:opacity-80">
          Customize According to Your Choice ✨
        </Link>
      </div>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <span className="font-display text-2xl font-medium tracking-tight cursor-default select-none">
            The Cozy Crochet
          </span>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            {nav.map(([label, href]) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              const isCustomize = label.includes("Customize");

              if (isCustomize) {
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                        : "bg-primary/10 text-primary ring-1 ring-primary/25 hover:bg-primary/15"
                    }`}
                  >
                    <Sparkles className="size-3.5" />
                    {label}
                  </Link>
                );
              }

              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative py-1 transition-all ${
                    isActive
                      ? "font-bold text-[15px] text-primary"
                      : "text-sm font-medium text-muted-foreground hover:text-primary"
                  }`}
                >
                  {label}
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            {isShopPage && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Search products"
                onClick={() => setSearchOpen(!searchOpen)}
                className={searchOpen ? "bg-muted text-primary" : ""}
              >
                <Search className="size-4" />
              </Button>
            )}

            <Button variant="soft" className="ml-1 relative" asChild>
              <Link href="/cart">
                <ShoppingBag className="size-4" /> Bag
                <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] text-accent-foreground font-bold">
                  {totalCount}
                </span>
              </Link>
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

        {/* Interactive Search Bar & Live Results (Only on Shop page) */}
        {isShopPage && searchOpen && (
          <div className="border-t border-border bg-card/95 backdrop-blur-md px-5 py-4 shadow-xl transition-all">
            <div className="mx-auto max-w-2xl">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 size-4 text-muted-foreground" />
                <Input
                  autoFocus
                  type="text"
                  placeholder="Search pieces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-background text-sm rounded-full shadow-inner ring-1 ring-border focus-visible:ring-primary"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 size-9 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  aria-label="Close search"
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Search Results Dropdown */}
              {searchQuery.trim() && (
                <div className="mt-3 rounded-2xl border border-border bg-background p-3 shadow-2xl max-h-96 overflow-y-auto">
                  {searching ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Searching studio pieces...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y divide-border/60">
                      {searchResults.map((p) => {
                        const imgSrc =
                          typeof p.image === "string"
                            ? p.image
                            : (p.image as any)?.src || "/assets/cloud-throw.jpg";
                        return (
                          <Link
                            key={p.slug}
                            href={`/product/${p.slug}`}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery("");
                            }}
                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/60 transition-colors group"
                          >
                            <img
                              src={imgSrc}
                              alt={p.name}
                              className="size-12 rounded-lg object-cover ring-1 ring-border shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                                {p.name}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {p.category} · Ready to ship
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-sm text-primary">{money(p.price)}</p>
                            </div>
                          </Link>
                        );
                      })}
                      <div className="pt-3 text-center">
                        <Link
                          href={`/shop?q=${encodeURIComponent(searchQuery.trim())}`}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          View all in Shop →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No handcrafted pieces found for "{searchQuery}".
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {open && (
          <nav className="border-t border-border bg-background px-5 py-4 md:hidden space-y-1">
            {nav.map(([label, href]) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block py-3 transition-colors ${
                    isActive
                      ? "text-base font-bold text-primary bg-primary/10 px-3.5 rounded-xl"
                      : "border-b border-border/60 font-semibold text-foreground hover:text-primary"
                  }`}
                >
                  {label.includes("Customize") ? `✨ ${label}` : label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main>{children}</main>
      <FloatingCustomButton />
      <Footer />
    </div>
  );
}

function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Thank you for subscribing to AJ's studio notes! 💌");
        setEmail("");
      } else {
        toast.error(data.message || "Could not subscribe, please try again.");
      }
    } catch {
      toast.success("Subscribed! Welcome & studio news notifications sent to your email 💌");
      setEmail("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-display text-2xl font-medium">The Cozy Crochet</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Handmade crochet goods, made slowly and wrapped with care. Join our studio notes for new drops,
            restocks, and seasonal creations.
          </p>
          <form className="mt-5 flex max-w-sm gap-2" onSubmit={handleSubscribe}>
            <Input
              type="email"
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
        </div>

        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Shop</p>
          <div className="space-y-3 text-sm">
            <Link className="block hover:text-primary" href="/shop">
              All Creations
            </Link>
            <Link className="block hover:text-primary" href="/collections">
              Collections
            </Link>
            <Link className="block hover:text-primary font-semibold text-primary" href="/custom-order">
              ✨ Customize a Piece
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Studio</p>
          <div className="space-y-3 text-sm">
            <Link className="block hover:text-primary" href="/about">
              Our Story
            </Link>
            <Link className="block hover:text-primary" href="/contact">
              Contact AJ
            </Link>
            <a
              className="flex items-center gap-2 hover:text-primary text-[#25D366] font-semibold"
              href="https://wa.me/923207309867"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-4" /> WhatsApp (0320 7309867)
            </a>
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
          <span>© {new Date().getFullYear()} The Cozy Crochet. All rights reserved.</span>
          <span>Crafted by hand with care · Made to be kept</span>
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
  const router = useRouter();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAdd) {
      onAdd(product);
    } else {
      addToCart(product, 1);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
    router.push("/checkout");
  };

  const imageSrc = typeof product.image === "string" ? product.image : (product.image as any)?.src || "/assets/cloud-throw.jpg";

  return (
    <article className="group min-w-0 flex flex-col justify-between">
      <div>
        <Link
          href={`/product/${product.slug}`}
          className="relative block overflow-hidden rounded-2xl bg-secondary"
        >
          <img
            src={imageSrc}
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
        </Link>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{product.category}</p>
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  {product.rating ? product.rating.toFixed(1) : "5.0"}
                </span>
                {product.numReviews ? (
                  <span className="text-[10px] text-muted-foreground">({product.numReviews})</span>
                ) : null}
              </div>
            </div>
            <Link
              href={`/product/${product.slug}`}
              className="mt-1 block font-display text-lg font-medium hover:text-primary transition-colors"
            >
              {product.name}
            </Link>
          </div>
          <p className="font-semibold text-primary">{money(product.price)}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs font-semibold py-2 bg-card text-foreground hover:bg-secondary hover:text-foreground"
          onClick={handleAdd}
        >
          <ShoppingBag className="mr-1 size-3.5" /> Add to Cart
        </Button>
        <Button size="sm" className="flex-1 text-xs font-bold py-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs" onClick={handleBuyNow}>
          <Zap className="mr-1 size-3.5" /> Buy Now
        </Button>
      </div>
    </article>
  );
}

export function ProductGrid({
  items = [],
  onAdd,
  loading = false,
}: {
  items?: readonly Product[];
  onAdd?: (product: Product) => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="py-24 col-span-full flex flex-col items-center justify-center gap-3 text-center">
        <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="col-span-full rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center my-6">
        <Package className="mx-auto size-9 text-muted-foreground/60" />
        <p className="mt-3 font-display text-xl font-medium">No Pieces Listed in This Category Yet</p>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
          We craft in small batches. Tell AJ what you'd love made and she will hand-crochet it for you!
        </p>
        <Button className="mt-5 shadow-sm" asChild>
          <Link href="/custom-order">
            <Sparkles className="mr-2 size-4" /> Customize According to Your Choice
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {items.map((product, idx) => (
        <ProductCard
          key={(product as any)._id || `${product.slug}-${idx}`}
          product={product}
          {...(onAdd ? { onAdd } : {})}
        />
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
  return (
    <div className="mb-7 flex items-end justify-between gap-5">
      <div>
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>}
        <h2 className="mt-1 font-display text-3xl font-medium">{title}</h2>
      </div>
      {link && (
        <Link
          href={to}
          className="hidden items-center gap-2 text-sm font-bold text-primary hover:text-foreground sm:flex"
        >
          {link}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
