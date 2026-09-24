"use client";

import { Plus, Trash2, X, Upload, Pencil, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { AdminShell, AdminTable } from "@/components/next-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { money, type Product } from "@/lib/catalog";
import { fetchProducts, addProduct, updateProductApi, deleteProductApi } from "@/lib/api";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Blankets");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [badge, setBadge] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts().then(setItems).finally(() => setLoading(false));
  }, []);

  // Get unique categories from items
  const existingCategories = Array.from(
    new Set(["Blankets", "Bags", "Amigurumi", "Wear", ...items.map((i) => i.category)])
  );

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName("");
    setPrice("");
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image file size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        toast.success("Product image uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      toast.error("Please enter product name and price");
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    if (!finalCategory) {
      toast.error("Please specify a category");
      return;
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        // EDIT EXISTING PRODUCT
        const updated = await updateProductApi(editingProduct.slug, {
          name: name.trim(),
          category: finalCategory,
          price: parseFloat(price),
          stock: parseInt(stock, 10) || 1,
          badge: badge.trim(),
          description: description.trim(),
          image: image || (typeof editingProduct.image === "string" ? editingProduct.image : ""),
        });

        if (updated) {
          setItems(items.map((it) => (it.slug === editingProduct.slug ? { ...it, ...updated } : it)));
          toast.success(`Updated "${name}" successfully!`);
        } else {
          // Local fallback
          setItems(
            items.map((it) =>
              it.slug === editingProduct.slug
                ? {
                    ...it,
                    name: name.trim(),
                    category: finalCategory,
                    price: parseFloat(price),
                    stock: parseInt(stock, 10) || 1,
                    badge: badge.trim(),
                    description: description.trim(),
                    image: image || it.image,
                  }
                : it
            )
          );
          toast.success(`Updated "${name}" successfully!`);
        }
      } else {
        // ADD NEW PRODUCT
        const created = await addProduct({
          name: name.trim(),
          category: finalCategory,
          price: parseFloat(price),
          stock: 1, // Automatically added to stock
          badge: badge.trim(),
          description: description.trim() || "Hand-crocheted slow made piece.",
          image: image || "/assets/cloud-throw.jpg",
        });

        setItems([created, ...items]);
        toast.success(`${created.name} added to catalog!`);
      }

      setIsModalOpen(false);
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete this piece?`)) return;
    await deleteProductApi(slug);
    setItems(items.filter((p) => p.slug !== slug));
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
          headers={["Product", "Category", "Price", "Stock", "Status", "Actions"]}
          rows={items.map((p) => {
            const imgSrc =
              typeof p.image === "string"
                ? p.image
                : (p.image as any)?.src || "/assets/cloud-throw.jpg";

            const rowKey = (p as any)._id || p.slug;

            return [
              <div className="flex items-center gap-3" key={`p-cell-${rowKey}`}>
                <img
                  src={imgSrc}
                  alt={p.name}
                  className="size-12 rounded-lg object-cover ring-1 ring-border"
                />
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
              money(p.price),
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

              {/* Price, Stock & Badge */}
              <div className="grid grid-cols-3 gap-3">
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

                <div>
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

                <div>
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
