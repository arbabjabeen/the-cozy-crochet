import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, MessageCircle, Mail, Clock, Check, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { fetchCustomOrders, updateCustomOrderStatusApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/custom-orders")({
  head: () => ({
    meta: [
      { title: "Custom Orders Admin — The Cozy Crochet" },
      { name: "description", content: "Manage bespoke custom crochet requests." },
    ],
  }),
  component: AdminCustomOrdersPage,
});

function AdminCustomOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    fetchCustomOrders().then((data) => {
      setOrders(data);
      if (data.length > 0) setSelectedOrder(data[0]);
    });
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateCustomOrderStatusApi(id, newStatus);
    setOrders((prev) =>
      prev.map((o) => (o._id === id || o.customOrderId === id ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder && (selectedOrder._id === id || selectedOrder.customOrderId === id)) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    toast.success(`Updated status to ${newStatus}`);
  };

  return (
    <AdminShell
      title="Custom Crochet Orders"
      description="Review bespoke customer requests, reference photos, and color specifications."
      actions={
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {orders.length} Requests
          </span>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Orders Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="p-4 border-b border-border bg-secondary/30">
            <h3 className="font-display font-medium">Incoming Requests</h3>
          </div>
          <div className="divide-y divide-border overflow-y-auto max-h-[700px]">
            {orders.map((ord) => {
              const isSelected = selectedOrder?.customOrderId === ord.customOrderId;
              return (
                <div
                  key={ord.customOrderId || ord._id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{ord.customOrderId}</span>
                    <StatusBadge status={ord.status} />
                  </div>
                  <p className="mt-1 font-display text-base font-medium">{ord.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {ord.productType} · {ord.colorPreference}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Qty: {ord.quantity || 1}</span>
                    <span>{ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : "Recent"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Inspection Card */}
        {selectedOrder ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Order Specs
                </span>
                <h2 className="font-display text-2xl font-medium">{selectedOrder.customOrderId}</h2>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    handleStatusChange(selectedOrder._id || selectedOrder.customOrderId, e.target.value)
                  }
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-bold"
                >
                  <option value="New">New</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Quoted">Quoted</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-secondary/50 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Customer</p>
                  <p className="font-bold">{selectedOrder.customerName}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.customerEmail}</p>
                  <p className="text-xs font-semibold text-primary">{selectedOrder.customerPhone}</p>
                </div>
                <div className="rounded-xl bg-secondary/50 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Piece</p>
                  <p className="font-bold">{selectedOrder.productType}</p>
                  <p className="text-xs text-muted-foreground">Qty: {selectedOrder.quantity || 1}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.sizeDimensions}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Color & Yarn Preference
                </p>
                <p className="mt-1 rounded-lg border border-border p-2.5 font-medium">
                  {selectedOrder.colorPreference}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Stitch Pattern & Style
                </p>
                <p className="mt-1 rounded-lg border border-border p-2.5 font-medium">
                  {selectedOrder.designStyle}
                </p>
              </div>

              {selectedOrder.instructions && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Customer Instructions
                  </p>
                  <p className="mt-1 rounded-lg border border-border bg-secondary/20 p-2.5 text-xs leading-relaxed text-muted-foreground">
                    {selectedOrder.instructions}
                  </p>
                </div>
              )}

              {selectedOrder.referenceImage && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Reference Image
                  </p>
                  <div className="mt-2 overflow-hidden rounded-xl border border-border">
                    <img
                      src={selectedOrder.referenceImage}
                      alt="Customer reference"
                      className="max-h-60 w-full object-contain bg-black/5"
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-4 flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <a
                    href={`https://wa.me/${selectedOrder.customerPhone.replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(selectedOrder.customerName)},%20this%20is%20AJ%20from%20The%20Cozy%20Crochet%20regarding%20your%20custom%20order%20${selectedOrder.customOrderId}!`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="mr-1.5 size-4" /> Message on WhatsApp
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={`mailto:${selectedOrder.customerEmail}?subject=The%20Cozy%20Crochet%20Custom%20Order%20${selectedOrder.customOrderId}`}>
                    <Mail className="mr-1.5 size-4" /> Send Email Quote
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border text-muted-foreground">
            Select a custom order to view details
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isNew = status === "New";
  const isDone = status === "Completed";
  const isInProg = status === "In Progress";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
        isNew
          ? "bg-accent/15 text-accent"
          : isDone
            ? "bg-primary/20 text-primary"
            : isInProg
              ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
              : "bg-secondary text-foreground"
      }`}
    >
      {status}
    </span>
  );
}
