import { createFileRoute } from "@tanstack/react-router";
import { Download, CheckCircle2, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { AdminShell, AdminTable } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { fetchOrders, updateOrderStatusApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "Orders Admin — The Cozy Crochet" },
      { name: "description", content: "Manage orders for The Cozy Crochet." },
    ],
  }),
  component: Orders,
});

function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchOrders().then(setOrders);
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateOrderStatusApi(id, newStatus);
    setOrders((prev) =>
      prev.map((o) => (o._id === id || o.orderNumber === id ? { ...o, status: newStatus } : o))
    );
    toast.success(`Order ${id} status updated to ${newStatus}`);
  };

  const filtered =
    filter === "All"
      ? orders
      : orders.filter((o) => o.status.toLowerCase() === filter.toLowerCase());

  return (
    <AdminShell
      title="Studio Orders"
      description="Track and update each customer order from payment to hand-wrapped dispatch."
      actions={
        <Button variant="outline" onClick={() => toast.info("Exported orders CSV")}>
          <Download className="mr-1.5 size-4" /> Export
        </Button>
      }
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {["All", "Pending", "Packing", "Shipped", "Delivered"].map((tab) => (
          <Button
            key={tab}
            size="sm"
            variant={filter === tab ? "default" : "outline"}
            onClick={() => setFilter(tab)}
          >
            {tab === "Pending" ? "⏳ Pending" : tab}
          </Button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground self-center">
          {filtered.length} Orders
        </span>
      </div>

      <AdminTable
        headers={["Order", "Customer", "Items", "Total", "Payment Status", "Order Status"]}
        rows={filtered.map((o) => {
          const id = o.orderNumber || o._id;
          const itemsSummary = o.items
            ? o.items.map((i: any) => `${i.name} (${i.quantity || 1})`).join(", ")
            : "Handmade Piece";
          const customerName = o.customer?.name || o.shippingAddress?.fullName || "Valued Customer";
          const totalStr = typeof o.total === "number" ? `$${o.total.toFixed(2)}` : o.total;
          const status = o.status || "Pending";
          const isPaid = Boolean(o.isPaid);

          return [
            <strong key={`id-${id}`}>{id}</strong>,
            customerName,
            <span key={`it-${id}`} className="max-w-xs truncate block text-xs" title={itemsSummary}>
              {itemsSummary}
            </span>,
            <strong key={`tot-${id}`}>{totalStr}</strong>,
            <span
              key={`pay-${id}`}
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1 ${
                isPaid
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-amber-100 text-amber-900 border border-amber-300"
              }`}
            >
              {isPaid ? "✓ Paid" : "⏳ Unpaid"}
            </span>,
            <div key={`st-wrap-${id}`} className="space-y-1">
              <span
                key={`st-${id}`}
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  status === "Delivered"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : status === "Packing"
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : status === "Shipped"
                        ? "bg-purple-100 text-purple-800 border border-purple-300"
                        : "bg-secondary text-secondary-foreground border border-border"
                }`}
              >
                {status === "Pending" ? "⏳ Pending" : status}
              </span>
              <select
                key={`sel-${id}`}
                value={status === "Paid" ? "Pending" : status}
                onChange={(e) => handleStatusChange(o._id || o.orderNumber, e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs font-semibold block w-full mt-1"
              >
                <option value="Pending">⏳ Pending</option>
                <option value="Packing">📦 Packing</option>
                <option value="Shipped">🚚 Shipped</option>
                <option value="Delivered">🎉 Delivered</option>
              </select>
            </div>,
          ];
        })}
      />
    </AdminShell>
  );
}