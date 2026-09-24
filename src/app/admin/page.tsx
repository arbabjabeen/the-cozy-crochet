"use client";

import Link from "next/link";
import { Clock3, PackageCheck, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { AdminShell, AdminTable, StatCard } from "@/components/next-admin";
import { fetchAnalytics, fetchOrders, fetchCustomOrders } from "@/lib/api";

const initialRecentOrders = [
  {
    orderNumber: "#CC-8805",
    customer: { name: "ARBAB JABEEN", phone: "03207309867", email: "arbabjabeen2006@gmail.com" },
    items: [{ name: "Crochet Flip Flop Bag Charm" }, { name: "Crochet Tulip Bag Charm" }],
    total: 15,
    isPaid: false,
    status: "Delivered",
  },
  {
    orderNumber: "#CC-9954",
    customer: { name: "ARBAB JABEEN", phone: "03207309867", email: "arbabjabeen2006@gmail.com" },
    items: [{ name: "Crochet Tulip Hair Tie" }, { name: "Crochet Rose Flower Keychain" }],
    total: 25,
    isPaid: false,
    status: "Pending",
  },
  {
    orderNumber: "#CC-10945",
    customer: { name: "Audit Test Customer" },
    items: [{ name: "Rose Bouquet Keychain" }],
    total: 5,
    isPaid: false,
    status: "Pending",
  },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>({
    revenue: "$45.00",
    orders: 3,
    averageOrder: "$15.00",
    lowStock: 1,
  });
  const [orders, setOrders] = useState<any[]>(initialRecentOrders);
  const [customOrdersCount, setCustomOrdersCount] = useState(3);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchAnalytics().then((s) => {
        if (s && s.orders !== undefined) setStats(s);
      }),
      fetchOrders().then((data) => {
        if (data && data.length > 0) setOrders(data.slice(0, 5));
      }),
      fetchCustomOrders().then((data) => {
        if (data && data.length > 0) setCustomOrdersCount(data.length);
      }),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      title="Good morning, AJ."
      description="Here’s what is happening in your crochet studio today."
    >
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Revenue" value={stats.revenue} change="↑ 12.4% this month" />
        <StatCard label="Orders" value={String(stats.orders)} change="↑ 6.1% this month" />
        <StatCard label="Average order" value={stats.averageOrder} change="↑ 2.8% this month" />
        <StatCard
          label="Low stock"
          value={String(stats.lowStock)}
          change="Needs attention"
          tone="warn"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-medium">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-primary hover:underline">
              View all
            </Link>
          </div>
          <AdminTable
            loading={loading}
            headers={["Order", "Customer", "Item", "Total", "Payment", "Order Status"]}
            rows={orders.map((o) => {
              const id = o.orderNumber || o._id;
              const customerName = o.customer?.name || o.shippingAddress?.fullName || "Customer";
              const itemName = o.items?.[0]?.name || "Handmade Piece";
              const total = typeof o.total === "number" ? `$${o.total.toFixed(2)}` : o.total;
              const isPaid = Boolean(o.isPaid);
              return [
                <strong key={`o-${id}`}>{id}</strong>,
                customerName,
                itemName,
                total,
                <span
                  key={`p-${id}`}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1 ${
                    isPaid
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {isPaid ? "✓ Paid" : "⏳ Unpaid"}
                </span>,
                <Badge key={`b-${id}`} text={o.status || "Pending"} />,
              ];
            })}
          />
        </section>

        <aside className="space-y-6">
          {/* Custom Orders Quick Alert Card */}
          <div className="rounded-2xl border border-border bg-primary/5 p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-display text-lg font-medium text-foreground">
                <Sparkles className="size-5 text-primary" /> Custom Commissions
              </span>
              <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                {customOrdersCount} Pending
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Customers submitted bespoke specifications (colors, dimensions, and reference photos).
            </p>
            <Link
              href="/admin/orders"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              Review Custom Orders in Orders →
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <h2 className="font-display text-xl font-medium">Today in the studio</h2>
            <div className="mt-5 space-y-4">
              {[
                [PackageCheck, "12 orders ready", "Awaiting courier pickup"],
                [Clock3, "6 pieces in progress", "Due over the next 3 days"],
                [Sparkles, "Cloud Throw trending", "18% more views this week"],
              ].map(([Icon, t, d]) => {
                const I = Icon as typeof Clock3;
                return (
                  <div className="flex gap-3 items-center" key={String(t)}>
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                      <I className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{String(t)}</p>
                      <p className="text-xs text-muted-foreground">{String(d)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

function Badge({ text }: { text: string; warn?: boolean }) {
  const isDelivered = text === "Delivered" || text.toLowerCase().includes("deliver");
  const isCancelled = text === "Cancelled" || text.toLowerCase().includes("cancel");
  const isDispatch = text === "Dispatch" || text === "Shipped" || text.toLowerCase().includes("dispatch");
  const isProcessing = !isDelivered && !isCancelled && !isDispatch;

  const colorClass = isDelivered
    ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
    : isDispatch
      ? "bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950 dark:text-blue-300"
      : isCancelled
        ? "bg-red-100 text-red-800 border border-red-300 dark:bg-red-950 dark:text-red-300"
        : "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300";

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1 ${colorClass}`}>
      {isDelivered
        ? "🎉 Delivered"
        : isDispatch
          ? "🚚 Dispatch"
          : isCancelled
            ? "❌ Cancelled"
            : "⏳ Processing"}
    </span>
  );
}
