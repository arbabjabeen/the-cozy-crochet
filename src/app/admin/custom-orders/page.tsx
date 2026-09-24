"use client";

import { MessageCircle, Mail, Send, Check, Copy, X } from "lucide-react";
import { useState, useEffect } from "react";
import { AdminShell } from "@/components/next-admin";
import { Button } from "@/components/ui/button";
import { fetchCustomOrders, updateCustomOrderStatusApi } from "@/lib/api";
import { toast } from "sonner";

interface CustomNotificationModalState {
  isOpen: boolean;
  customOrderId: string;
  customerName: string;
  customerPhone: string;
  status: string;
  message: string;
  waUrl: string;
}

export default function AdminCustomOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [autoNotifyWhatsApp, setAutoNotifyWhatsApp] = useState(true);
  const [copied, setCopied] = useState(false);
  const [modalState, setModalState] = useState<CustomNotificationModalState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomOrders().then((data) => {
      setOrders(data);
      if (data.length > 0) setSelectedOrder(data[0]);
    }).finally(() => setLoading(false));
  }, []);

  const formatWhatsAppPhone = (rawPhone: string): string => {
    if (!rawPhone) return "";
    let clean = rawPhone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "92" + clean.slice(1);
    }
    return clean;
  };

  const buildCustomStatusMessage = (
    customerName: string,
    customOrderId: string,
    status: string,
    productType: string,
    colorPreference: string
  ): string => {
    switch (status.toLowerCase()) {
      case "under review":
        return `Assalam-o-Alaikum ${customerName}! 🌸\nThank you for choosing The Cozy Crochet! AJ has reviewed your bespoke commission request #${customOrderId} for "${productType}" (${colorPreference}).\n\n• Current Status: Under Review 🧐✨\n\nAJ is checking yarn materials and sizing to craft your quote. We will update you shortly!\n- AJ, The Cozy Crochet`;
      case "quoted":
        return `Assalam-o-Alaikum ${customerName}! 🌸\nGood news! Your custom order #${customOrderId} quote for "${productType}" is ready!\n\n• Current Status: Quoted 🏷️✨\n\nPlease let us know if you would like to proceed with hand-stitching!\n- AJ, The Cozy Crochet`;
      case "in progress":
        return `Assalam-o-Alaikum ${customerName}! 🌸\nExciting news! AJ has officially begun hand-stitching your custom crochet piece (${productType}, ${colorPreference})! 🧶💕\n\n• Current Status: In Progress 🧵\n• Custom Order: #${customOrderId}\n\nEach stitch is crafted with pure patience and love. We will notify you once completed!\n- AJ, The Cozy Crochet`;
      case "completed":
        return `Assalam-o-Alaikum ${customerName}! 🌸\nYour custom crochet creation #${customOrderId} is now COMPLETED! 🎉🧶✨\n\n• Item: ${productType} (${colorPreference})\n• Status: Completed & Ready for Dispatch 🎁\n\nThank you for commissioning this bespoke piece with The Cozy Crochet by AJ! 💕`;
      case "declined":
        return `Assalam-o-Alaikum ${customerName}! 🌸\nRegarding your custom request #${customOrderId} (${productType}): Due to current studio schedule, we are unfortunately unable to take on this specific piece right now. We hope to craft for you in the future! 🧶\n- AJ, The Cozy Crochet`;
      default:
        return `Assalam-o-Alaikum ${customerName}! 🌸\nYour custom crochet order #${customOrderId} status has been updated to: ${status}.\n\n• Piece: ${productType}\n• Color: ${colorPreference}\n\nThank you for choosing The Cozy Crochet by AJ! 🧶✨`;
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateCustomOrderStatusApi(id, newStatus);
    setOrders((prev) =>
      prev.map((o) => (o._id === id || o.customOrderId === id ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder && (selectedOrder._id === id || selectedOrder.customOrderId === id)) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    const target = orders.find((o) => o._id === id || o.customOrderId === id) || selectedOrder;
    const orderId = target?.customOrderId || id;
    const customerName = target?.customerName || "Valued Customer";
    const rawPhone = target?.customerPhone || "";
    const productType = target?.productType || "Custom Piece";
    const colorPreference = target?.colorPreference || "Custom Color";

    const msg = buildCustomStatusMessage(customerName, orderId, newStatus, productType, colorPreference);
    const cleanPhone = formatWhatsAppPhone(rawPhone);
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` : "";

    toast.success(`Custom order #${orderId} status updated to: ${newStatus}`);

    // Auto-open WhatsApp if enabled
    if (autoNotifyWhatsApp && cleanPhone) {
      try {
        window.open(waUrl, "_blank");
      } catch {
        // Handled by modal
      }
    }

    setModalState({
      isOpen: true,
      customOrderId: orderId,
      customerName,
      customerPhone: rawPhone || "No phone provided",
      status: newStatus,
      message: msg,
      waUrl,
    });
  };

  const copyToClipboard = () => {
    if (!modalState) return;
    navigator.clipboard.writeText(modalState.message);
    setCopied(true);
    toast.success("Message copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminShell
      title="Custom Crochet Orders"
      description="Review bespoke customer requests. Automated WhatsApp status notifications dispatch to customers on status changes."
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto WhatsApp Notification Switch */}
          <label className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer select-none hover:bg-secondary/40 transition-colors">
            <input
              type="checkbox"
              checked={autoNotifyWhatsApp}
              onChange={(e) => setAutoNotifyWhatsApp(e.target.checked)}
              className="accent-primary size-3.5 rounded"
            />
            <MessageCircle className="size-3.5 text-green-600" />
            <span>Auto-send WhatsApp on status change</span>
          </label>

          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {orders.length} Requests
          </span>
        </div>
      }
    >
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
          <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">Loading...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-display text-lg font-medium">No Custom Requests Yet</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            When customers submit custom crochet requests, they will show up here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Orders List */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
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
                  <p className="text-xs uppercase text-muted-foreground">Requested Piece</p>
                  <p className="font-bold">{selectedOrder.productType}</p>
                  <p className="text-xs text-muted-foreground">Qty: {selectedOrder.quantity || 1}</p>
                  {selectedOrder.targetDate && (
                    <p className="text-xs font-semibold text-accent mt-1">Needed by: {selectedOrder.targetDate}</p>
                  )}
                  {selectedOrder.sizeDimensions && (
                    <p className="text-xs text-muted-foreground">{selectedOrder.sizeDimensions}</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Color Preference
                </p>
                <p className="mt-1 rounded-lg border border-border p-2.5 font-medium">
                  {selectedOrder.colorPreference}
                </p>
              </div>

              {selectedOrder.estimatedBudget && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Estimated Budget
                  </p>
                  <p className="mt-1 rounded-lg border border-border p-2.5 font-medium">
                    {selectedOrder.estimatedBudget}
                  </p>
                </div>
              )}

              {selectedOrder.designStyle && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Stitch Pattern & Style
                  </p>
                  <p className="mt-1 rounded-lg border border-border p-2.5 font-medium">
                    {selectedOrder.designStyle}
                  </p>
                </div>
              )}

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
                    href={`https://wa.me/${formatWhatsAppPhone(selectedOrder.customerPhone)}?text=${encodeURIComponent(
                      buildCustomStatusMessage(
                        selectedOrder.customerName,
                        selectedOrder.customOrderId,
                        selectedOrder.status,
                        selectedOrder.productType,
                        selectedOrder.colorPreference
                      )
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="mr-1.5 size-4" /> Send Status on WhatsApp
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
      )}

      {/* Automated Status Notification Modal */}
      {modalState?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-10 place-items-center rounded-2xl bg-green-500/15 text-green-600">
                  <MessageCircle className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-medium">Customer Status Notification</h3>
                  <p className="text-xs text-muted-foreground">
                    Custom Order #{modalState.customOrderId} · Updated to{" "}
                    <strong className="text-primary">{modalState.status}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalState(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-secondary/40 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <strong className="text-foreground">{modalState.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone / WhatsApp:</span>
                <strong className="text-foreground">{modalState.customerPhone}</strong>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Status Message Sent to User:
              </label>
              <div className="rounded-2xl border border-border bg-background p-3.5 text-xs leading-relaxed whitespace-pre-wrap font-mono text-muted-foreground max-h-48 overflow-y-auto">
                {modalState.message}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
              <Button size="sm" variant="ghost" onClick={copyToClipboard}>
                {copied ? <Check className="size-3.5 mr-1.5 text-green-600" /> : <Copy className="size-3.5 mr-1.5" />}
                {copied ? "Copied!" : "Copy Message"}
              </Button>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setModalState(null)}>
                  Done
                </Button>
                {modalState.waUrl ? (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" asChild>
                    <a href={modalState.waUrl} target="_blank" rel="noreferrer">
                      <Send className="size-3.5 mr-1.5" /> Open in WhatsApp
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground self-center">No phone on file</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
