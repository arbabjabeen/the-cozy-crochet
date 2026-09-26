"use client";

import { Plus, Trash2, X, Upload, Pencil, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { AdminShell, AdminTable } from "@/components/next-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { money, type Product, products as fallbackProducts } from "@/lib/catalog";
import { fetchProducts, addProduct, updateProductApi, deleteProductApi } from "@/lib/api";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>(fallbackProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Blankets");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [isOnSale, setIsOnSale] = useState(false);
  const [stock, setStock] = useState("1");
  const [badge, setBadge] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    fetchProducts()
      .then((data) => {
        if (data && data.length > 0) setItems(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("cozy_store_channel");
        bc.onmessage = () => {
          loadData();
        };
      }
    } catch {}

    const handleVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadData();
      }
    };

    window.addEventListener("cozy_products_updated", loadData);
    window.addEventListener("focus", loadData);
    document.addEventListener("visibilitychange", handleVisibility);
    const syncInterval = setInterval(loadData, 7000);

    return () => {
      if (bc) bc.close();
      window.removeEventListener("cozy_products_updated", loadData);
      window.removeEventListener("focus", loadData);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(syncInterval);
    };
  }, []);

  // Get unique categories from items
  const existingCategories = Array.from(
    new Set(["Blankets", "Bags", "Amigurumi", "Wear", ...items.map((i) => i.category)])
  );

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName("");
    setPrice("");
    setOriginalPrice("");
    setIsOnSale(false);
    setStock("1");
    setBadge("");
    setDescription("");
    setImage("");
    setIsCustomCategory(false);
    setCustomCategory("");
    setCategory(existingCategories[0] || "Blankets");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(String(p.price));
    setOriginalPrice(p.originalPrice ? String(p.originalPrice) : "");
    setIsOnSale(Boolean(p.onSale || (p.originalPrice && p.originalPrice > p.price)));
    setStock(String(p.stock !== undefined ? p.stock : 1));
    setBadge(p.badge || "");
    setDescription(p.description || "");
    setImage(typeof p.image === "string" ? p.image : (p.image as any)?.src || "");
    
    if (existingCategories.includes(p.category)) {
      setCategory(p.category);
      setIsCustomCategory(false);
      setCustomCategory("");
    } else {
      setIsCustomCategory(true);
      setCustomCategory(p.category);
    }
    setIsModalOpen(true);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const reader = new FileReader();
        const fallbackTimer = setTimeout(() => {
          resolve("/assets/cloud-throw.jpg");
        }, 5000);

        reader.onload = (e) => {
          const resultStr = e.target?.result as string;
          if (!resultStr) {
            clearTimeout(fallbackTimer);
            return resolve("/assets/cloud-throw.jpg");
          }
          const img = new Image();
          img.onload = () => {
            clearTimeout(fallbackTimer);
            try {
              const canvas = document.createElement("canvas");
              let width = img.width || 400;
              let height = img.height || 400;
              const maxDim = 500;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.72));
              } else {
                resolve(resultStr);
              }
            } catch {
              resolve(resultStr);
            }
          };
          img.onerror = () => {
            clearTimeout(fallbackTimer);
            resolve(resultStr);
          };
          img.src = resultStr;
        };
        reader.onerror = () => {
          clearTimeout(fallbackTimer);
          resolve("/assets/cloud-throw.jpg");
        };
        reader.readAsDataURL(file);
      } catch {
        resolve("/assets/cloud-throw.jpg");
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setImage(compressed);
        toast.success("Product image ready!");
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result as string);
          toast.success("Product image uploaded!");
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectivePrice = price || (isOnSale && originalPrice ? originalPrice : "");
    if (!name.trim() || !effectivePrice) {
      toast.error("Please enter product name and price");
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    if (!finalCategory) {
      toast.error("Please specify a category");
      return;
    }

    setSubmitting(true);
    const numPrice = parseFloat(effectivePrice) || 10;
    let numOriginal = originalPrice ? parseFloat(originalPrice) : undefined;
    if (isOnSale && (!numOriginal || numOriginal <= numPrice)) {
      numOriginal = Math.round(numPrice * 1.25);
    }

    try {
      if (editingProduct) {
        // EDIT EXISTING PRODUCT - Instant 0ms optimistic update
        const updatedItem: Product = {
          ...editingProduct,
          name: name.trim(),
          category: finalCategory,
          price: numPrice,
          originalPrice: isOnSale ? numOriginal : undefined,
          onSale: isOnSale,
          stock: parseInt(stock, 10) || 1,
          badge: badge.trim(),
          description: description.trim() || editingProduct.description,
          image: image || editingProduct.image,
        };

        setItems((prev) => prev.map((it) => (it.slug === editingProduct.slug ? updatedItem : it)));
        setIsModalOpen(false);

        // Send API update
        await updateProductApi(editingProduct.slug, {
          name: name.trim(),
          category: finalCategory,
          price: numPrice,
          originalPrice: isOnSale ? numOriginal : undefined,
          onSale: isOnSale,
          stock: parseInt(stock, 10) || 1,
          badge: badge.trim(),
          description: description.trim(),
          image: image || (typeof editingProduct.image === "string" ? editingProduct.image : ""),
        });
        toast.success(`Updated "${name}" successfully!`);
      } else {
        // ADD NEW PRODUCT - Instant optimistic addition + await server save
        const slug =
          (name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "crochet-piece") +
          "-" +
          Date.now().toString().slice(-4);

        const newProd: Product = {
          slug,
          name: name.trim(),
          category: finalCategory,
          price: numPrice,
          originalPrice: isOnSale && numOriginal ? numOriginal : undefined,
          onSale: isOnSale,
          stock: parseInt(stock, 10) || 1,
          badge: badge.trim(),
          description: description.trim() || "Hand-crocheted slow made piece.",
          image: image || "/assets/cloud-throw.jpg",
          rating: 5,
          numReviews: 0,
        };

        setItems((prev) => [newProd, ...prev]);
        setIsModalOpen(false);

        // Send API addition
        const saved = await addProduct({
          slug: newProd.slug,
          name: newProd.name,
          category: newProd.category,
          price: newProd.price,
          originalPrice: newProd.originalPrice,
          onSale: newProd.onSale,
          stock: newProd.stock,
          badge: newProd.badge,
          description: newProd.description,
          image: newProd.image,
        });

        // Ensure newly saved product slug/details match
        if (saved && saved.slug !== newProd.slug) {
          setItems((prev) => prev.map((p) => (p.slug === newProd.slug ? saved : p)));
        }

        toast.success(`"${newProd.name}" added to catalog & store!`);
      }
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSale = async (p: Product) => {
    const nextSale = !p.onSale;
    let nextOriginal = p.originalPrice;
    if (nextSale && (!nextOriginal || nextOriginal <= p.price)) {
      nextOriginal = Math.round(p.price * 1.25);
    }

    const updatedItem: Product = {
      ...p,
      onSale: nextSale,
      originalPrice: nextSale ? nextOriginal : p.originalPrice,
    };

    setItems((prev) => prev.map((it) => (it.slug === p.slug ? updatedItem : it)));
    await updateProductApi(p.slug, {
      onSale: nextSale,
      originalPrice: nextSale ? nextOriginal : undefined,
    });
    toast.success(nextSale ? `"${p.name}" is now on SALE!` : `Sale turned OFF for "${p.name}"`);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete this piece?`)) return;
    
    // Instant optimistic deletion (0ms)
    setItems((prev) => prev.filter((p) => p.slug !== slug));
    await deleteProductApi(slug);
    toast.info("Product removed from catalog");
  };

  return (
    <AdminShell
      title="Products"
      description={`${items.length} handmade pieces in your catalogue.`}
      actions={
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-1 size-4" /> Add product
        </Button>
      }
    >
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
          <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">Loading...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-display text-lg font-medium">No Products in Catalogue Yet</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            Click "+ Add Product" to add your first handcrafted crochet piece with photos and prices.
          </p>
          <Button className="mt-5" onClick={handleOpenCreate}>
            <Plus className="mr-1.5 size-4" /> Add First Product
          </Button>
        </div>
      ) : (
        <AdminTable
          headers={["Product", "Category", "Price", "Sale Promo", "Stock", "Status", "Actions"]}
          rows={items.map((p) => {
            const imgSrc =
              typeof p.image === "string"
                ? p.image
                : (p.image as any)?.src || "/assets/cloud-throw.jpg";

            const rowKey = (p as any)._id || p.slug;
            const isProductOnSale = Boolean(p.onSale && p.originalPrice && p.originalPrice > p.price);

            return [
              <div className="flex items-center gap-3" key={`p-cell-${rowKey}`}>
                <div className="relative">
                  <img
                    src={imgSrc}
                    alt={p.name}
                    className="size-12 rounded-lg object-cover ring-1 ring-border"
                  />
                  {p.onSale && (
                    <span className="absolute -top-1.5 -right-1.5 rounded-full bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 shadow-xs">
                      SALE
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-bold block">{p.name}</span>
                  {p.badge && (
                    <span className="text-[10px] bg-secondary text-primary font-bold px-1.5 py-0.5 rounded">
                      {p.badge}
                    </span>
                  )}
                </div>
              </div>,
              p.category,
              isProductOnSale ? (
                <div key={`price-${rowKey}`}>
                  <span className="font-bold text-rose-600 dark:text-rose-400 block">{money(p.price)}</span>
                  <span className="text-xs text-muted-foreground line-through block">{money(p.originalPrice!)}</span>
                </div>
              ) : (
                money(p.price)
              ),
              <Button
                key={`sale-btn-${rowKey}`}
                variant={p.onSale ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleSale(p)}
                className={`text-xs h-7 px-2.5 font-bold transition-all ${
                  p.onSale
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={p.onSale ? "Sale active - Click to disable" : "Click to put product on SALE"}
              >
                {p.onSale ? "🔥 ON SALE" : "Off"}
              </Button>,
              `${p.stock} pieces`,
              <span key={`act-${rowKey}`} className="font-bold text-primary">
                Active
              </span>,
              <div key={`act-btn-${rowKey}`} className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenEdit(p)}
                  className="text-muted-foreground hover:text-primary"
                  title="Edit product"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(p.slug)}
                  className="text-muted-foreground hover:text-destructive"
                  title="Delete product"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>,
            ];
          })}
        />
      )}

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-xl font-medium">
                {editingProduct ? `Edit "${editingProduct.name}"` : "Add New Crochet Piece"}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-5 space-y-4">
              {/* Product Name */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                  Product Name *
                </label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Product Image Upload */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                  Product Image *
                </label>
                {image ? (
                  <div className="relative mt-2 rounded-xl border border-border p-3 flex items-center gap-4 bg-secondary/30">
                    <img
                      src={image}
                      alt="Uploaded preview"
                      className="size-16 rounded-lg object-cover ring-1 ring-border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">Product Photo Attached</p>
                      <Button
                        type="button"
                        variant="soft"
                        size="sm"
                        className="mt-1 text-xs"
                        onClick={() => setImage("")}
                      >
                        Remove / Change Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative mt-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-5 text-center transition-colors hover:border-primary bg-background/50">
                    <Upload className="size-6 text-primary" />
                    <span className="mt-1 text-xs font-bold">Upload Product Photo</span>
                    <span className="text-[10px] text-muted-foreground">PNG, JPG, or WEBP up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>
                )}
              </div>

              {/* Category Selection or Custom Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-muted-foreground">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    {isCustomCategory ? "← Choose Existing" : "+ Add New Category"}
                  </button>
                </div>

                {isCustomCategory ? (
                  <Input
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === "__new__") {
                        setIsCustomCategory(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {existingCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__new__">+ Add New Category...</option>
                  </select>
                )}
              </div>

              {/* Promotion / Sale Toggle & Settings */}
              <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 text-sm font-bold text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isOnSale}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsOnSale(checked);
                        if (checked && !originalPrice && price) {
                          const p = parseFloat(price);
                          if (p > 0) setOriginalPrice((p * 1.25).toFixed(2));
                        }
                      }}
                      className="size-4 rounded border-border text-rose-600 focus:ring-rose-500 accent-rose-600"
                    />
                    <span>🏷️ Put this piece on SALE</span>
                  </label>
                  {isOnSale && (
                    <span className="rounded-full bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wide shadow-xs">
                      SALE ACTIVE
                    </span>
                  )}
                </div>

                {isOnSale && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-rose-200/60 dark:border-rose-900/40">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                        Original / Regular Price ($) *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 50.00"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        className="bg-background"
                      />
                      <span className="text-[10px] text-muted-foreground">Crossed-out regular price</span>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-rose-600 dark:text-rose-400">
                        Sale Price ($) *
                      </label>
                      <Input
                        required
                        type="number"
                        step="0.01"
                        placeholder="e.g. 35.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="border-rose-400 focus:border-rose-600 bg-background"
                      />
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Customer pays this amount</span>
                    </div>

                    {originalPrice && price && parseFloat(originalPrice) > parseFloat(price) && (
                      <div className="col-span-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 px-3 py-1.5 text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center justify-between">
                        <span>🔥 {Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100)}% DISCOUNT</span>
                        <span>Customer saves ${(parseFloat(originalPrice) - parseFloat(price)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Price, Stock & Badge */}
              <div className="grid grid-cols-3 gap-3">
                {!isOnSale && (
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                      Price ($) *
                    </label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                )}

                <div className={isOnSale ? "col-span-2" : ""}>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Stock
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>

                <div className={isOnSale ? "col-span-1" : ""}>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Badge (Optional)
                  </label>
                  <Input
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" className="bg-card text-foreground hover:bg-secondary hover:text-foreground" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "Saving..."
                    : editingProduct
                    ? "Update Product"
                    : "Add to Catalog"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
