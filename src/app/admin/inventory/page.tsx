"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Package, ArrowRight } from "lucide-react";
import { AdminShell, AdminTable, StatCard } from "@/components/next-admin";
import { Button } from "@/components/ui/button";
import { fetchProducts } from "@/lib/api";
import { products as fallbackProducts } from "@/lib/catalog";
import { toast } from "sonner";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<any[]>(fallbackProducts);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const prodsRes = await fetchProducts();
      if (prodsRes && prodsRes.length > 0) {
        setProducts(prodsRes);
      }
    } catch {
      // keep fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick product stock adjustment (+ / -) - Instant 0ms optimistic update
  const handleUpdateProductStock = (slug: string, newStock: number) => {
    const validStock = Math.max(0, newStock);
    setProducts((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, stock: validStock } : p))
    );
    toast.success(`Updated stock to ${validStock}`);

    // Update catalog cache
    try {
      const cached = JSON.parse(sessionStorage.getItem("cozy_cached_products") || "[]");
      const next = cached.map((p: any) => (p.slug === slug ? { ...p, stock: validStock } : p));
      sessionStorage.setItem("cozy_cached_products", JSON.stringify(next));
    } catch {}

    // Send API in background
    fetch(`/api/products/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: validStock }),
    }).catch(() => {});
  };

  const totalStockUnits = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const totalInventoryValue = products.reduce(
    (acc, p) => acc + (Number(p.price) || 0) * (Number(p.stock) || 0),
    0
  );

  return (
    <AdminShell
      title="Stock & Inventory"
      description="Whenever you add a product, it is automatically added here. Click + or - to easily update available pieces."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="mr-1.5 size-4" /> Refresh
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/products">
              <Plus className="mr-1.5 size-4" /> Add New Product
            </Link>
          </Button>
        </div>
      }
    >
      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Total Pieces in Stock"
          value={`${totalStockUnits} units`}
          change="Available to purchase"
        />
        <StatCard
          label="Active Creations"
          value={`${products.length} pieces`}
          change="Live in your store"
        />
        <StatCard
          label="Total Stock Value"
          value={`$${totalInventoryValue.toLocaleString()}`}
          change="Calculated at retail price"
        />
      </div>

      {/* Stock Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
          <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">Loading...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <Package className="mx-auto size-10 text-muted-foreground/60" />
          <p className="mt-4 font-display text-lg font-medium">No Products in Stock Yet</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            You don't need to manually enter stock! When you add a new product in the Products section, it will automatically appear here with 1 piece in stock.
          </p>
          <Button className="mt-5" asChild>
            <Link href="/admin/products">
              <Plus className="mr-1.5 size-4" /> Add Your First Product
            </Link>
          </Button>
        </div>
      ) : (
        <AdminTable
          headers={["Product", "Category", "Retail Price", "Stock On Hand", "Status", "Quick Adjust (+ / -)"]}
          rows={products.map((p) => {
            const isOut = Number(p.stock) === 0;
            const imgSrc =
              typeof p.image === "string"
                ? p.image
                : (p.image as any)?.src || "/assets/cloud-throw.jpg";

            return [
              <div key={p.slug} className="flex items-center gap-3">
                <img
                  src={imgSrc}
                  alt={p.name}
                  className="size-11 rounded-lg object-cover ring-1 ring-border"
                />
                <div>
                  <strong className="block text-foreground">{p.name}</strong>
                  <span className="text-[11px] text-muted-foreground">{p.category}</span>
                </div>
              </div>,
              p.category,
              `$${Number(p.price).toFixed(2)}`,
              <strong
                key={`stk-${p.slug}`}
                className={`text-base ${isOut ? "text-destructive" : "text-foreground"}`}
              >
                {p.stock} piece(s)
              </strong>,
              <span
                key={`lvl-${p.slug}`}
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  isOut ? "bg-destructive/15 text-destructive" : "bg-primary/20 text-primary"
                }`}
              >
                {isOut ? "Sold Out" : "In Stock"}
              </span>,
              <div key={`adj-${p.slug}`} className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="size-8 p-0 text-sm font-bold"
                  onClick={() => handleUpdateProductStock(p.slug, Number(p.stock) - 1)}
                  disabled={p.stock <= 0}
                  title="Decrease by 1"
                >
                  -
                </Button>
                <span className="w-6 text-center text-sm font-bold">{p.stock}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="size-8 p-0 text-sm font-bold"
                  onClick={() => handleUpdateProductStock(p.slug, Number(p.stock) + 1)}
                  title="Increase by 1"
                >
                  +
                </Button>
              </div>,
            ];
          })}
        />
      )}
    </AdminShell>
  );
}
