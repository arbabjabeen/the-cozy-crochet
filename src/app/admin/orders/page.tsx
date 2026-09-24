"use client";

import {
  Download,
  MessageCircle,
  Send,
  Check,
  Copy,
  Sparkles,
  ShoppingBag,
  X,
  Eye,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Layers,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AdminShell, AdminTable } from "@/components/next-admin";
import { Button } from "@/components/ui/button";
import {
  fetchOrders,
  fetchCustomOrders,
  updateOrderStatusApi,
  updateCustomOrderStatusApi,
} from "@/lib/api";
import { toast } from "sonner";

export type OrderStatus = "Processing" | "Dispatch" | "Delivered" | "Cancelled";

export interface UnifiedOrder {
  id: string;
  orderType: "regular" | "custom";
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress?: {
    fullName?: string;
    street?: string;
    city?: string;
    postalCode?: string;
  };
  itemsSummary: string;
  totalStr: string;
  paymentMethod: string;
  isPaid: boolean;
  status: OrderStatus;
  createdAt: string;
  raw: any;
}

interface NotificationModalState {
  isOpen: boolean;
  orderId: string;
  customerName: string;
  customerPhone: string;
  status: string;
  message: string;
  waUrl: string;
}

const normalizeStatus = (rawStatus: string): OrderStatus => {
  const s = (rawStatus || "").toLowerCase();
  if (s.includes("deliver") || s === "completed") return "Delivered";
  if (s.includes("cancel") || s === "declined") return "Cancelled";
  if (s.includes("dispatch") || s.includes("shipp")) return "Dispatch";
  return "Processing";
};

const initialUnifiedOrders: UnifiedOrder[] = [
  {
    id: "#CC-8805",
    orderType: "regular",
    customerName: "ARBAB JABEEN",
    customerPhone: "03207309867",
    customerEmail: "arbabjabeen2006@gmail.com",
    shippingAddress: {
      fullName: "ARBAB JABEEN",
      street: "Muhala Ali pur main Street okara",
      city: "Okara",
      postalCode: "56300",
    },
    itemsSummary: "Crochet Flip Flop Bag Charm (x1), Crochet Tulip Bag Charm (x1)",
    totalStr: "$15.00",
    paymentMethod: "WhatsApp / Direct Transfer",
    isPaid: false,
    status: "Delivered",
    createdAt: "2026-09-24T05:39:55.309Z",
    raw: {
      orderNumber: "#CC-8805",
      customer: { name: "ARBAB JABEEN", phone: "03207309867", email: "arbabjabeen2006@gmail.com" },
      total: 15,
      isPaid: false,
      status: "Delivered",
    },
  },
  {
    id: "#CUST-879",
    orderType: "custom",
    customerName: "03207309867",
    customerPhone: "03207309867",
    customerEmail: "customer-1790228516424@cozycrochet.com",
    itemsSummary: "sunflower · yellow (x1)",
    totalStr: "Custom Quote",
    paymentMethod: "Custom Commission",
    isPaid: true,
    status: "Dispatch",
    createdAt: "2026-09-24T05:41:56.480Z",
    raw: {
      customOrderId: "#CUST-879",
      customerName: "03207309867",
      customerPhone: "03207309867",
      productType: "sunflower",
      colorPreference: "yellow",
      isPaid: true,
      status: "Dispatch",
    },
  },
  {
    id: "#CC-9954",
    orderType: "regular",
    customerName: "ARBAB JABEEN",
    customerPhone: "03207309867",
    customerEmail: "arbabjabeen2006@gmail.com",
    shippingAddress: {
      fullName: "ARBAB JABEEN",
      street: "Muhala Ali pur main Street okara",
      city: "Okara",
      postalCode: "56300",
    },
    itemsSummary: "Crochet Tulip Hair Tie (x2), Crochet Rose Flower Keychain (x1)",
    totalStr: "$25.00",
    paymentMethod: "WhatsApp / Direct Transfer",
    isPaid: false,
    status: "Processing",
    createdAt: "2026-09-24T05:37:39.591Z",
    raw: {
      orderNumber: "#CC-9954",
      customer: { name: "ARBAB JABEEN", phone: "03207309867", email: "arbabjabeen2006@gmail.com" },
      total: 25,
      isPaid: false,
      status: "Pending",
    },
  },
  {
    id: "#CUST-313",
    orderType: "custom",
    customerName: "Ayesha Custom",
    customerPhone: "03009876543",
    customerEmail: "ayesha@test.com",
    itemsSummary: "Crochet Plushie & Bag · Lilac and Butter Yellow (x2)",
    totalStr: "Custom Quote",
    paymentMethod: "Custom Commission",
    isPaid: false,
    status: "Processing",
    createdAt: "2026-09-24T05:23:08.223Z",
    raw: {
      customOrderId: "#CUST-313",
      customerName: "Ayesha Custom",
      customerPhone: "03009876543",
      productType: "Crochet Plushie & Bag",
      colorPreference: "Lilac and Butter Yellow",
      isPaid: false,
      status: "New",
    },
  },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<UnifiedOrder[]>(initialUnifiedOrders);
  const [loading, setLoading] = useState(false);

  // 1. Order Type: All | Regular | Custom (2 cheezein)
  const [orderTypeFilter, setOrderTypeFilter] = useState<"All" | "Regular" | "Custom">("All");

  // 2. Payment: All | Paid | Unpaid (2 cheezein)
  const [paymentFilter, setPaymentFilter] = useState<"All" | "Paid" | "Unpaid">("All");

  // 3. Status: All | Processing | Dispatch | Delivered | Cancelled (4 cheezein)
  const [statusFilter, setStatusFilter] = useState<"All" | OrderStatus>("All");

  // Detail Modal State (Clickable customer / order details)
  const [detailOrder, setDetailOrder] = useState<UnifiedOrder | null>(null);

  // WhatsApp Notification Modal State
  const [autoNotifyWhatsApp, setAutoNotifyWhatsApp] = useState(true);
  const [copied, setCopied] = useState(false);
  const [modalState, setModalState] = useState<NotificationModalState | null>(null);

  const loadAllOrders = async () => {
    try {
      const [regularData, customData] = await Promise.all([
        fetchOrders(),
        fetchCustomOrders(),
      ]);

      const unifiedRegular: UnifiedOrder[] = (regularData || []).map((o: any) => ({
        id: o.orderNumber || o._id,
        orderType: "regular",
        customerName: o.customer?.name || o.shippingAddress?.fullName || "Valued Customer",
        customerPhone: o.customer?.phone || o.phone || o.shippingAddress?.phone || "",
        customerEmail: o.customer?.email || "",
        shippingAddress: o.shippingAddress,
        itemsSummary: o.items
          ? o.items.map((i: any) => `${i.name} (x${i.quantity || 1})`).join(", ")
          : "Handmade Piece",
        totalStr: typeof o.total === "number" ? `$${o.total.toFixed(2)}` : o.total || "$0.00",
        paymentMethod: o.paymentMethod || "WhatsApp / Direct Transfer",
        isPaid: Boolean(o.isPaid),
        status: normalizeStatus(o.status),
        createdAt: o.createdAt || new Date().toISOString(),
        raw: o,
      }));

      const unifiedCustom: UnifiedOrder[] = (customData || []).map((co: any) => ({
        id: co.customOrderId || co._id,
        orderType: "custom",
        customerName: co.customerName || "Valued Customer",
        customerPhone: co.customerPhone || "",
        customerEmail: co.customerEmail || "",
        itemsSummary: `${co.productType || "Custom Piece"} · ${co.colorPreference || "Custom"} (x${co.quantity || 1})`,
        totalStr: co.estimatedBudget
          ? co.estimatedBudget.startsWith("$")
            ? co.estimatedBudget
            : `$${co.estimatedBudget}`
          : "Custom Quote",
        paymentMethod: "Custom Commission",
        isPaid: Boolean(co.isPaid),
        status: normalizeStatus(co.status),
        createdAt: co.createdAt || new Date().toISOString(),
        raw: co,
      }));

      // Sort newest first
      const all = [...unifiedRegular, ...unifiedCustom].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      if (all && all.length > 0) {
        setOrders(all);
      }
    } catch {
      // keep fallback data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllOrders();
    const handleFocus = () => loadAllOrders();
    window.addEventListener("focus", handleFocus);
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        loadAllOrders();
      }
    }, 15000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const formatWhatsAppPhone = (rawPhone: string): string => {
    if (!rawPhone) return "";
    let clean = rawPhone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "92" + clean.slice(1);
    }
    return clean;
  };

  const buildStatusMessage = (
    customerName: string,
    orderId: string,
    status: OrderStatus,
    itemsSummary: string,
    totalStr: string,
    orderType: "regular" | "custom"
  ): string => {
    switch (status) {
      case "Processing":
        return `Assalam-o-Alaikum ${customerName}! 🌸\nWe have received your ${orderType === "custom" ? "custom commission" : "crochet"} order #${orderId} at The Cozy Crochet by AJ! 🧶\n\n• Items: ${itemsSummary}\n• Total: ${totalStr}\n• Status: Processing (Slow-Craft Handcrafting) 🧵✨\n\nAJ is now preparing your handmade pieces with care! Thank you for supporting our slow-craft studio.\n- AJ, The Cozy Crochet`;
      case "Dispatch":
        return `Assalam-o-Alaikum ${customerName}! 🌸\nExciting news! Your handmade crochet order #${orderId} has been DISPATCHED with our courier! 🚚📦\n\n• Items: ${itemsSummary}\n• Total: ${totalStr}\n• Status: Dispatched (In Transit)\n\nWe will keep you updated on the delivery tracking. Thank you! 🧶💕\n- AJ, The Cozy Crochet`;
      case "Delivered":
        return `Assalam-o-Alaikum ${customerName}! 🌸\nYour handmade crochet order #${orderId} from The Cozy Crochet has been DELIVERED! 🎉🧶\n\nWe hope you adore your new handcrafted piece! We would love to see photos or receive your kind review. 💕\nThank you for choosing The Cozy Crochet by AJ! ✨`;
      case "Cancelled":
        return `Assalam-o-Alaikum ${customerName}! 🌸\nYour order #${orderId} at The Cozy Crochet has been cancelled. If you have any questions or wish to re-order, feel free to reach out to AJ directly. 🧶\n- AJ, The Cozy Crochet`;
      default:
        return `Assalam-o-Alaikum ${customerName}! 🌸\nYour order #${orderId} at The Cozy Crochet has been updated to: ${status}.\n\nThank you for shopping with us! 🧶✨\n- AJ, The Cozy Crochet`;
    }
  };

  const handlePaymentChange = async (order: UnifiedOrder, isPaid: boolean) => {
    if (order.orderType === "custom") {
      await updateCustomOrderStatusApi(order.id, { isPaid });
    } else {
      await updateOrderStatusApi(order.id, { isPaid });
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, isPaid } : o))
    );

    if (detailOrder && detailOrder.id === order.id) {
      setDetailOrder({ ...detailOrder, isPaid });
    }

    toast.success(`Order #${order.id} payment marked as ${isPaid ? "Paid" : "Unpaid"}`);

    if (isPaid) {
      const msg = `Assalam-o-Alaikum ${order.customerName}! 🌸\nYour payment for order #${order.id} (${order.totalStr}) has been verified successfully! 🎉\n\n• Items: ${order.itemsSummary}\n• Total: ${order.totalStr}\n• Payment Status: Paid & Confirmed ✅\n\nAJ is now preparing and handcrafting your pieces with care! 🧶✨\n- AJ, The Cozy Crochet`;
      const cleanPhone = formatWhatsAppPhone(order.customerPhone);
      const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` : "";

      if (autoNotifyWhatsApp && cleanPhone) {
        try {
          window.open(waUrl, "_blank");
        } catch {}
      }

      setModalState({
        isOpen: true,
        orderId: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone || "No phone provided",
        status: "Paid",
        message: msg,
        waUrl,
      });
    }
  };

  const handleFulfillmentChange = async (order: UnifiedOrder, newStatus: OrderStatus) => {
    if (order.orderType === "custom") {
      await updateCustomOrderStatusApi(order.id, { status: newStatus });
    } else {
      await updateOrderStatusApi(order.id, { status: newStatus });
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
    );

    if (detailOrder && detailOrder.id === order.id) {
      setDetailOrder({ ...detailOrder, status: newStatus });
    }

    toast.success(`Order #${order.id} status updated to ${newStatus}`);

    const msg = buildStatusMessage(
      order.customerName,
      order.id,
      newStatus,
      order.itemsSummary,
      order.totalStr,
      order.orderType
    );
    const cleanPhone = formatWhatsAppPhone(order.customerPhone);
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` : "";

    if (autoNotifyWhatsApp && cleanPhone) {
      try {
        window.open(waUrl, "_blank");
      } catch {}
    }

    setModalState({
      isOpen: true,
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone || "No phone provided",
      status: newStatus,
      message: msg,
      waUrl,
    });
  };

  const handleManualNotify = (order: UnifiedOrder) => {
    const msg = `Assalam-o-Alaikum ${order.customerName}! 🌸\nUpdate on your handmade crochet order #${order.id} from The Cozy Crochet:\n\n• Items: ${order.itemsSummary}\n• Total: ${order.totalStr}\n• Payment: ${order.isPaid ? "Paid ✅" : "Unpaid ⏳"}\n• Status: ${order.status}\n\nThank you for choosing slow-crafted crochet! 🧶✨\n- AJ, The Cozy Crochet`;
    const cleanPhone = formatWhatsAppPhone(order.customerPhone);
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` : "";

    setModalState({
      isOpen: true,
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone || "No phone provided",
      status: `${order.status} (${order.isPaid ? "Paid" : "Unpaid"})`,
      message: msg,
      waUrl,
    });

    if (cleanPhone) {
      window.open(waUrl, "_blank");
    }
  };

  const copyToClipboard = () => {
    if (!modalState) return;
    navigator.clipboard.writeText(modalState.message);
    setCopied(true);
    toast.success("Message copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered orders based on 3 selectors
  const filteredOrders = orders.filter((o) => {
    // 1. Order Type: All | Regular | Custom
    if (orderTypeFilter === "Regular" && o.orderType !== "regular") return false;
    if (orderTypeFilter === "Custom" && o.orderType !== "custom") return false;

    // 2. Payment: All | Paid | Unpaid
    if (paymentFilter === "Paid" && !o.isPaid) return false;
    if (paymentFilter === "Unpaid" && o.isPaid) return false;

    // 3. Status: All | Processing | Dispatch | Delivered | Cancelled
    if (statusFilter !== "All" && o.status !== statusFilter) return false;

    return true;
  });

  return (
    <AdminShell
      title="Studio Orders"
      description="Manage all studio orders. Filter by Order Type (Custom / Regular), Payment (Paid / Unpaid), and Status (Processing, Dispatch, Delivered, Cancelled)."
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
            <span>Auto-send WhatsApp updates</span>
          </label>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAllOrders()}
            className="rounded-full"
          >
            Refresh
          </Button>
        </div>
      }
    >
      {/* 3 CLEAN SELECTOR SECTIONS */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 1. ORDER TYPE: All | Regular | Custom (2 options) */}
          <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full text-xs font-semibold">
            <span className="text-muted-foreground mr-1 flex items-center gap-1">
              <Layers className="size-3.5 text-primary" /> Order Type:
            </span>
            {(["All", "Regular", "Custom"] as const).map((tTab) => (
              <button
                key={tTab}
                onClick={() => setOrderTypeFilter(tTab)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  orderTypeFilter === tTab
                    ? tTab === "Custom"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : tTab === "Regular"
                        ? "bg-foreground text-background shadow-xs"
                        : "bg-secondary text-foreground font-black border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                {tTab === "Regular" ? "🛍️ Regular" : tTab === "Custom" ? "✨ Custom" : "All"}
              </button>
            ))}
          </div>

          {/* 2. PAYMENT: All | Paid | Unpaid (2 options) */}
          <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full text-xs font-semibold">
            <span className="text-muted-foreground mr-1">Payment:</span>
            {(["All", "Paid", "Unpaid"] as const).map((pTab) => (
              <button
                key={pTab}
                onClick={() => setPaymentFilter(pTab)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  paymentFilter === pTab
                    ? pTab === "Paid"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : pTab === "Unpaid"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                {pTab === "Paid" ? "✓ Paid" : pTab === "Unpaid" ? "⏳ Unpaid" : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* 3. STATUS: All | Processing | Dispatch | Delivered | Cancelled (4 options) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground mr-1">Status:</span>
            {(["All", "Processing", "Dispatch", "Delivered", "Cancelled"] as const).map((st) => (
              <Button
                key={st}
                size="sm"
                variant={statusFilter === st ? "default" : "outline"}
                onClick={() => setStatusFilter(st)}
                className={`rounded-full text-xs h-7.5 ${
                  statusFilter === st ? "" : "bg-card text-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {st === "Processing"
                  ? "⏳ Processing"
                  : st === "Dispatch"
                    ? "🚚 Dispatch"
                    : st === "Delivered"
                      ? "🎉 Delivered"
                      : st === "Cancelled"
                        ? "❌ Cancelled"
                        : "All"}
              </Button>
            ))}
          </div>

          <span className="text-xs text-muted-foreground font-medium self-center">
            {filteredOrders.length} Orders
          </span>
        </div>
      </div>

      {/* ORDERS TABLE */}
      {filteredOrders.length === 0 && !loading ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-2">
          <p className="font-display text-lg font-medium text-foreground">No Orders Found</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            No orders match the selected filters. Try changing Order Type, Payment, or Status filter.
          </p>
        </div>
      ) : (
        <AdminTable
          loading={loading}
          headers={[
            "Order #",
            "Customer (Click for Details)",
            "Items / Specs",
            "Total",
            "Payment Status",
            "Order Status",
            "WhatsApp",
          ]}
          rows={filteredOrders.map((o) => {
            return [
              /* Order # + Type Badge */
              <div key={`id-${o.id}`} className="space-y-1">
                <strong
                  onClick={() => setDetailOrder(o)}
                  className="cursor-pointer text-primary hover:underline font-bold block"
                  title="Click to view full order details"
                >
                  {o.id}
                </strong>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    o.orderType === "custom"
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-secondary text-secondary-foreground border border-border"
                  }`}
                >
                  {o.orderType === "custom" ? "✨ Custom" : "🛍️ Regular"}
                </span>
              </div>,

              /* CLICKABLE CUSTOMER NAME */
              <div
                key={`cust-${o.id}`}
                onClick={() => setDetailOrder(o)}
                className="cursor-pointer group hover:bg-secondary/40 p-1.5 -m-1.5 rounded-xl transition-colors"
                title="Click to open customer details"
              >
                <p className="font-bold text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <span>{o.customerName}</span>
                  <Eye className="size-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                </p>
                {o.customerPhone && (
                  <p className="text-[11px] text-muted-foreground">{o.customerPhone}</p>
                )}
                {o.customerEmail && (
                  <p className="text-[10px] text-muted-foreground/80 truncate max-w-[150px]">
                    {o.customerEmail}
                  </p>
                )}
              </div>,

              /* Items Summary */
              <div
                key={`it-${o.id}`}
                onClick={() => setDetailOrder(o)}
                className="cursor-pointer max-w-xs truncate block text-xs"
                title={`${o.itemsSummary} (Click for full specs)`}
              >
                <span className="hover:text-primary transition-colors">{o.itemsSummary}</span>
              </div>,

              /* Total Price */
              <strong key={`tot-${o.id}`} className="text-xs">
                {o.totalStr}
              </strong>,

              /* PAYMENT STATUS (Paid vs Unpaid strictly - 2 options) */
              <div key={`pay-${o.id}`} className="space-y-1">
                <select
                  value={o.isPaid ? "Paid" : "Unpaid"}
                  onChange={(e) => handlePaymentChange(o, e.target.value === "Paid")}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold border cursor-pointer transition-colors block ${
                    o.isPaid
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200"
                      : "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200"
                  }`}
                >
                  <option value="Unpaid">⏳ Unpaid</option>
                  <option value="Paid">✅ Paid</option>
                </select>
                <p className="text-[10px] text-muted-foreground font-medium pl-1 truncate max-w-[120px]">
                  {o.paymentMethod}
                </p>
              </div>,

              /* ORDER STATUS (Strictly 4: Processing, Dispatch, Delivered, Cancelled) */
              <div key={`st-${o.id}`} className="space-y-1.5 min-w-[130px]">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold inline-flex items-center gap-1 ${
                    o.status === "Delivered"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                      : o.status === "Dispatch"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300"
                        : o.status === "Cancelled"
                          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300"
                          : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                  }`}
                >
                  {o.status === "Processing"
                    ? "⏳ Processing"
                    : o.status === "Dispatch"
                      ? "🚚 Dispatch"
                      : o.status === "Delivered"
                        ? "🎉 Delivered"
                        : "❌ Cancelled"}
                </span>
                <select
                  value={o.status}
                  onChange={(e) => handleFulfillmentChange(o, e.target.value as OrderStatus)}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs font-semibold cursor-pointer hover:border-primary transition-colors block w-full"
                >
                  <option value="Processing">⏳ Processing</option>
                  <option value="Dispatch">🚚 Dispatch</option>
                  <option value="Delivered">🎉 Delivered</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
              </div>,

              /* WHATSAPP ACTION BUTTON */
              <div key={`act-${o.id}`} className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleManualNotify(o)}
                  className="rounded-full text-xs font-semibold border-green-600/30 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30"
                  title="Notify customer on WhatsApp"
                >
                  <MessageCircle className="size-3.5 mr-1 text-green-600" />
                  Notify
                </Button>
                <button
                  onClick={() => setDetailOrder(o)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                  title="View order details"
                >
                  <Eye className="size-4" />
                </button>
              </div>,
            ];
          })}
        />
      )}

      {/* SLEEK, COMPACT ORDER DETAILS MODAL (NON-BULKY) */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl font-medium">{detailOrder.id}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      detailOrder.orderType === "custom"
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-secondary text-secondary-foreground border border-border"
                    }`}
                  >
                    {detailOrder.orderType === "custom" ? "✨ Custom Commission" : "🛍️ Regular Order"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Placed on {new Date(detailOrder.createdAt).toLocaleDateString()} at{" "}
                  {new Date(detailOrder.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <button
                onClick={() => setDetailOrder(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Customer Contact Information */}
            <div className="rounded-2xl bg-secondary/40 p-4 space-y-2.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Customer Information
              </span>
              <div className="grid sm:grid-cols-2 gap-2.5">
                <div>
                  <p className="text-muted-foreground text-[11px]">Full Name</p>
                  <p className="font-bold text-foreground text-sm">{detailOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">Phone / WhatsApp</p>
                  {detailOrder.customerPhone ? (
                    <a
                      href={`https://wa.me/${formatWhatsAppPhone(detailOrder.customerPhone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-green-700 dark:text-green-400 hover:underline flex items-center gap-1 text-xs"
                    >
                      <MessageCircle className="size-3" />
                      {detailOrder.customerPhone}
                    </a>
                  ) : (
                    <p className="text-muted-foreground">Not provided</p>
                  )}
                </div>
                {detailOrder.customerEmail && (
                  <div>
                    <p className="text-muted-foreground text-[11px]">Email</p>
                    <p className="font-medium text-foreground">{detailOrder.customerEmail}</p>
                  </div>
                )}
                {detailOrder.shippingAddress?.city && (
                  <div>
                    <p className="text-muted-foreground text-[11px]">Delivery Address</p>
                    <p className="font-medium text-foreground">
                      {detailOrder.shippingAddress.street}, {detailOrder.shippingAddress.city}{" "}
                      {detailOrder.shippingAddress.postalCode}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items & Specifications */}
            <div className="rounded-2xl border border-border p-4 space-y-3 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                {detailOrder.orderType === "custom" ? "Custom Request Specifications" : "Purchased Items"}
              </span>

              {detailOrder.orderType === "regular" ? (
                <div className="space-y-2 divide-y divide-border/60">
                  {detailOrder.raw?.items?.map((item: any, idx: number) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">{item.name}</p>
                        <p className="text-muted-foreground text-[11px]">
                          Qty: {item.quantity || 1} × ${Number(item.price || 0).toFixed(2)}
                        </p>
                      </div>
                      <span className="font-bold text-foreground">
                        ${((item.quantity || 1) * (item.price || 0)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-3 flex justify-between font-bold text-sm">
                    <span>Total Amount</span>
                    <span className="text-primary">{detailOrder.totalStr}</span>
                  </div>
                </div>
              ) : (
                /* Custom Order Specs */
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-secondary/30">
                      <p className="text-muted-foreground text-[10px]">Product Type</p>
                      <p className="font-bold text-foreground">{detailOrder.raw?.productType || "Custom Piece"}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-secondary/30">
                      <p className="text-muted-foreground text-[10px]">Color Preference</p>
                      <p className="font-bold text-foreground">{detailOrder.raw?.colorPreference || "Studio Choice"}</p>
                    </div>
                    {detailOrder.raw?.sizeDimensions && (
                      <div className="p-2.5 rounded-xl bg-secondary/30">
                        <p className="text-muted-foreground text-[10px]">Size / Dimensions</p>
                        <p className="font-bold text-foreground">{detailOrder.raw.sizeDimensions}</p>
                      </div>
                    )}
                    <div className="p-2.5 rounded-xl bg-secondary/30">
                      <p className="text-muted-foreground text-[10px]">Quantity</p>
                      <p className="font-bold text-foreground">{detailOrder.raw?.quantity || 1}</p>
                    </div>
                  </div>

                  {detailOrder.raw?.instructions && (
                    <div className="p-3 rounded-xl bg-secondary/30">
                      <p className="text-muted-foreground text-[10px]">Client Instructions</p>
                      <p className="font-medium text-foreground whitespace-pre-wrap mt-0.5">
                        {detailOrder.raw.instructions}
                      </p>
                    </div>
                  )}

                  {detailOrder.raw?.referenceImage && (
                    <div>
                      <p className="text-muted-foreground text-[10px] mb-1">Reference Photo</p>
                      <img
                        src={detailOrder.raw.referenceImage}
                        alt="Reference"
                        className="size-24 object-cover rounded-xl border border-border"
                      />
                    </div>
                  )}

                  <div className="pt-2 flex justify-between font-bold text-sm">
                    <span>Estimated Budget</span>
                    <span className="text-primary">{detailOrder.totalStr}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Status and Payment Controls inside modal */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Payment Status
                </label>
                <select
                  value={detailOrder.isPaid ? "Paid" : "Unpaid"}
                  onChange={(e) => handlePaymentChange(detailOrder, e.target.value === "Paid")}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold border cursor-pointer transition-colors ${
                    detailOrder.isPaid
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  <option value="Unpaid">⏳ Unpaid</option>
                  <option value="Paid">✅ Paid</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Order Status
                </label>
                <select
                  value={detailOrder.status}
                  onChange={(e) => handleFulfillmentChange(detailOrder, e.target.value as OrderStatus)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold cursor-pointer"
                >
                  <option value="Processing">⏳ Processing</option>
                  <option value="Dispatch">🚚 Dispatch</option>
                  <option value="Delivered">🎉 Delivered</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDetailOrder(null)}
                className="rounded-full"
              >
                Close
              </Button>
              {detailOrder.customerPhone ? (
                <Button
                  size="sm"
                  className="rounded-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleManualNotify(detailOrder)}
                >
                  <MessageCircle className="size-3.5 mr-1.5" />
                  Message Customer
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">No phone recorded</span>
              )}
            </div>
          </div>
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
                  <h3 className="font-display text-lg font-medium">Customer Notification</h3>
                  <p className="text-xs text-muted-foreground">
                    Order #{modalState.orderId} · Updated to{" "}
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
                Status Message:
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
