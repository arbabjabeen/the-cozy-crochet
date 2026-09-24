import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { AdminShell, AdminTable } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { money, type Product } from "@/lib/catalog";
import { fetchProducts, addProduct, deleteProductApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [
      { title: "Products Admin — The Cozy Crochet" },
      { name: "description", content: "Manage the studio crochet product catalogue." },
    ],
  }),
  component: Products,
});

function Products() {
  const [items, setItems] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New product form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Blankets");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [badge, setBadge] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts().then(setItems);
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      toast.error("Please enter product name and price");
      return;
    }

    setSubmitting(true);
    try {
      const created = await addProduct({
        name,
        category,
        price: parseFloat(price),
        stock: parseInt(stock, 10) || 10,
        badge,
        description: description || "Hand-crocheted slow made piece.",
        image: "/assets/cloud-throw.jpg",
      });

      setItems([created, ...items]);
      toast.success(`${created.name} added to catalog!`);
      setIsModalOpen(false);
      setName("");
      setPrice("");
      setBadge("");
      setDescription("");
    } catch {
      toast.error("Failed to add product");
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
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-1 size-4" /> Add product
        </Button>
      }
    >
      <AdminTable
        headers={["Product", "Category", "Price", "Stock", "Status", "Actions"]}
        rows={items.map((p) => [
          <div className="flex items-center gap-3" key={p.slug}>
            <img src={p.image} alt="" className="size-11 rounded-md object-cover ring-1 ring-border" />
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
          <span className="font-bold text-primary">Active</span>,
          <Button
            key={`del-${p.slug}`}
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(p.slug)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>,
        ])}
      />

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-xl font-medium">Add New Crochet Piece</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>

            <form onSubmit={handleAddProduct} className="mt-5 space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Blankets">Blankets</option>
                    <option value="Bags">Bags</option>
                    <option value="Amigurumi">Amigurumi</option>
                    <option value="Wear">Wear</option>
                    <option value="Home Decor">Home Decor</option>
                  </select>
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Initial Stock Count
                  </label>
                  <Input
                    type="number"
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

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}