"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Sparkles, Search, X } from "lucide-react";
import { useState, useEffect, Suspense, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageIntro, ProductGrid, StoreShell } from "@/components/next-storefront";
import { products as initialProducts, type Product } from "@/lib/catalog";
import { fetchProducts } from "@/lib/api";

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const initialQuery = searchParams.get("q") || searchParams.get("search") || "";

  const [cat, setCat] = useState(initialCategory);
  const [search, setSearch] = useState(initialQuery);
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        if (data && data.length > 0) {
          setAllProducts(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const q = searchParams.get("q") || searchParams.get("search") || "";
    setSearch(q);
    const c = searchParams.get("category") || "All";
    setCat(c);
  }, [searchParams]);

  // Dynamically extract only categories that actually have products in the store!
  const catsMap = new Map<string, string>();

  allProducts.forEach((p) => {
    if (p.category) {
      const lower = p.category.toLowerCase().trim();
      const label = p.category.charAt(0).toUpperCase() + p.category.slice(1);
      if (!catsMap.has(lower)) {
        catsMap.set(lower, label);
      }
    }
  });

  const cats = ["All", ...Array.from(catsMap.values())];

  const handleCategoryChange = useCallback(
    (newCat: string) => {
      setCat(newCat);
      const params = new URLSearchParams();
      if (newCat && newCat.toLowerCase() !== "all") {
        params.set("category", newCat);
      }
      if (search.trim()) {
        params.set("q", search.trim());
      }
      const qs = params.toString();
      const newUrl = qs ? `/shop?${qs}` : "/shop";
      router.replace(newUrl, { scroll: false });
    },
    [router, search]
  );

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    const params = new URLSearchParams();
    if (cat && cat.toLowerCase() !== "all") {
      params.set("category", cat);
    }
    if (newSearch.trim()) {
      params.set("q", newSearch.trim());
    }
    const qs = params.toString();
    const newUrl = qs ? `/shop?${qs}` : "/shop";
    router.replace(newUrl, { scroll: false });
  };

  const filtered = allProducts.filter((p) => {
    const pCatLower = p.category?.toLowerCase().trim() || "";
    const activeCatLower = cat.toLowerCase().trim();

    const matchesCat = activeCatLower === "all" || pCatLower === activeCatLower;

    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      pCatLower.includes(q) ||
      p.description?.toLowerCase().includes(q);

    return matchesCat && matchesSearch;
  });

  const activeCategoryLabel =
    cat.toLowerCase() === "all"
      ? "All Categories"
      : cats.find((c) => c.toLowerCase() === cat.toLowerCase()) || cat;

  return (
    <StoreShell>
      <section className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 pt-4 sm:pt-6 pb-16">
        {/* Search & Category Filters Bar */}
        <div className="mb-6 sm:mb-8 border-y border-border py-3.5 sm:py-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search pieces..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 pr-8 h-9 text-sm rounded-full bg-card"
              />
              {search && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <span className="text-xs font-medium text-muted-foreground text-right sm:text-left self-end sm:self-center">
              {loading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                <>
                  Showing {filtered.length} {filtered.length === 1 ? "piece" : "pieces"} in{" "}
                  <strong className="text-foreground">{activeCategoryLabel}</strong>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible no-scrollbar pt-1">
            <SlidersHorizontal className="mr-1 size-3.5 text-muted-foreground shrink-0" />
            {cats.map((c) => {
              const isSelected = cat.toLowerCase().trim() === c.toLowerCase().trim();
              const count =
                c.toLowerCase() === "all"
                  ? allProducts.length
                  : allProducts.filter(
                      (p) => p.category?.toLowerCase().trim() === c.toLowerCase().trim()
                    ).length;

              return (
                <Button
                  key={c}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryChange(c)}
                  className={`rounded-full shrink-0 text-xs sm:text-sm transition-all h-8 sm:h-9 px-3 ${
                    isSelected
                      ? "shadow-xs font-bold"
                      : "bg-card text-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {c}
                  <span
                    className={`ml-1.5 text-[11px] rounded-full px-1.5 py-0.2 ${
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-secondary text-foreground/80"
                    }`}
                  >
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <ProductGrid items={filtered} loading={loading} />

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
              We specialize in custom crochet orders. Tell us your favourite color and ideas, and
              AJ will hand-stitch it for you.
            </p>
          </div>
          <Button size="lg" className="shrink-0 w-full md:w-auto shadow-sm" asChild>
            <Link href="/custom-order">
              <Sparkles className="mr-2 size-4" /> Customize According to Your Choice
            </Link>
          </Button>
        </div>
      </section>
    </StoreShell>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">
            Loading...
          </p>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
