import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock3, PackageCheck, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { AdminShell, AdminTable, StatCard } from "@/components/admin";
import { fetchAnalytics, fetchOrders, fetchCustomOrders } from "@/lib/api";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — The Cozy Crochet" },
      { name: "description", content: "Studio dashboard for The Cozy Crochet." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState<any>({
    revenue: "$12,480",
    orders: 248,
    averageOrder: "$50.32",
    lowStock: 7,
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [customOrdersCount, setCustomOrdersCount] = useState(1);

  useEffect(() => {
    fetchAnalytics().then(setStats);
    fetchOrders().then((data) => setOrders(data.slice(0, 5)));
    fetchCustomOrders().then((data) => setCustomOrdersCount(data.length));
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
            <Link to="/admin/orders" className="text-xs font-bold text-primary hover:underline">
              View all
            </Link>
          </div>
          <AdminTable
            headers={["Order", "Customer", "Item", "Total", "Status"]}
            rows={orders.map((o) => {
              const id = o.orderNumber || o._id;
              const customerName = o.customer?.name || o.shippingAddress?.fullName || "Customer";
              const itemName = o.items?.[0]?.name || "Handmade Piece";
              const total = typeof o.total === "number" ? `$${o.total.toFixed(2)}` : o.total;
              return [
                <strong key={`o-${id}`}>{id}</strong>,
                customerName,
                itemName,
                total,
                <Badge key={`b-${id}`} text={o.status || "Pending"} warn={o.status === "Packing"} />,
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
              to="/admin/custom-orders"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              Review Custom Orders →
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <h2 className="font-display text-xl font-medium">Today in the studio</h2>
            <div className="mt-5 space-y-4">
              {[
                [PackageCheck, "12 orders ready", "Awaiting courier pickup"],
                [Clock3, "6 pieces in progress", "Due over the next 3 days"],
                [ArrowUpRight, "Cloud Throw trending", "18% more views this week"],
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

function Badge({ text, warn }: { text: string; warn?: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
        warn ? "bg-accent/15 text-accent" : "bg-secondary text-primary"
      }`}
    >
      {text}
    </span>
  );
}